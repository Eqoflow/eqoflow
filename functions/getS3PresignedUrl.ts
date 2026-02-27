import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return Response.json({ error: 'fileName and fileType are required' }, { status: 400 });
    }

    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('AWS_S3_BUCKET_NAME');
    const region = Deno.env.get('AWS_S3_REGION');

    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `uploads/${user.id}/${timestamp}_${sanitizedName}`;

    const host = `${bucketName}.s3.${region}.amazonaws.com`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
    const dateStamp = amzDate.slice(0, 8);

    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const credential = `${accessKeyId}/${credentialScope}`;
    const expiresIn = 3600; // 1 hour

    // Build canonical query string for presigned URL
    const queryParams = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': credential,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(expiresIn),
      'X-Amz-SignedHeaders': 'content-type;host',
    });

    const canonicalQueryString = queryParams.toString().split('&').sort().join('&');
    const canonicalHeaders = `content-type:${fileType}\nhost:${host}\n`;
    const signedHeaders = 'content-type;host';
    const canonicalRequest = `PUT\n/${key}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`;

    const canonicalRequestHash = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest)))
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

    const sign = async (key, msg) => {
      const k = typeof key === 'string' ? new TextEncoder().encode(key) : key;
      const cryptoKey = await crypto.subtle.importKey('raw', k, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(msg)));
    };

    const kDate = await sign(`AWS4${secretAccessKey}`, dateStamp);
    const kRegion = await sign(kDate, region);
    const kService = await sign(kRegion, 's3');
    const kSigning = await sign(kService, 'aws4_request');
    const signatureBytes = await sign(kSigning, stringToSign);
    const signature = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    const presignedUrl = `https://${host}/${key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
    const fileUrl = `https://${host}/${key}`;

    return Response.json({ presigned_url: presignedUrl, file_url: fileUrl });

  } catch (error) {
    console.error('Presign error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
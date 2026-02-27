import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileBase64, fileName, fileType } = body;

    if (!fileBase64 || !fileName || !fileType) {
      return Response.json({ error: 'Missing file data (fileBase64, fileName, fileType required)' }, { status: 400 });
    }

    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('AWS_S3_BUCKET_NAME');
    const region = Deno.env.get('AWS_S3_REGION');

    // Decode base64 to bytes
    const binaryString = atob(fileBase64);
    const fileBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      fileBytes[i] = binaryString.charCodeAt(i);
    }

    // Generate a unique file key
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `uploads/${user.id}/${timestamp}_${sanitizedName}`;

    // AWS Signature V4 signing
    const method = 'PUT';
    const host = `${bucketName}.s3.${region}.amazonaws.com`;
    const url = `https://${host}/${key}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
    const dateStamp = amzDate.slice(0, 8);

    // Hash the payload
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBytes);
    const payloadHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const canonicalHeaders = `content-type:${fileType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = `${method}\n/${key}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const canonicalRequestHash = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest)))
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

    // Derive signing key
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

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Upload to S3
    const s3Response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': fileType,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        'Authorization': authorizationHeader,
      },
      body: fileBytes,
    });

    if (!s3Response.ok) {
      const errorText = await s3Response.text();
      console.error('S3 upload error:', errorText);
      return Response.json({ error: 'Failed to upload to S3', details: errorText }, { status: 500 });
    }

    const fileUrl = `https://${host}/${key}`;
    return Response.json({ file_url: fileUrl });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
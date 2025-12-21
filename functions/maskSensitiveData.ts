import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Robust client-side email masking function
function maskEmailClientSide(email) {
  if (!email || !email.includes('@')) return email;
  
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  // Mask local part (show first char + *** + last char if long enough)
  const maskedLocal = local.length > 2 
    ? local.charAt(0) + '***' + local.charAt(local.length - 1)
    : local.charAt(0) + '***';
  
  // Mask domain (show first char + *** + .tld)
  const domainParts = domain.split('.');
  if (domainParts.length < 2) return `${maskedLocal}@${domain}`;
  
  const domainName = domainParts[0];
  const tld = domainParts.slice(1).join('.');
  const maskedDomain = domainName.charAt(0) + '***' + '.' + tld;
  
  return `${maskedLocal}@${maskedDomain}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate the user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, maskingType } = await req.json();
    
    if (!data) {
      return Response.json({ error: 'No data provided to mask' }, { status: 400 });
    }

    // For now, use client-side masking as primary method
    // This ensures the app works reliably without external API dependencies
    let maskedData = data;
    
    if (typeof data === 'string' && data.includes('@')) {
      // Likely an email
      maskedData = maskEmailClientSide(data);
    } else if (typeof data === 'object') {
      // Mask email fields in objects
      maskedData = { ...data };
      if (maskedData.email) maskedData.email = maskEmailClientSide(maskedData.email);
      if (maskedData.user_email) maskedData.user_email = maskEmailClientSide(maskedData.user_email);
      if (maskedData.created_by) maskedData.created_by = maskEmailClientSide(maskedData.created_by);
    }

    // TODO: Once Arya.ai API endpoint is confirmed, uncomment this section
    /*
    const secretToken = Deno.env.get('ARYA_AI_SECRET_TOKEN');
    const encryptionKey = Deno.env.get('ARYA_AI_ENCRYPTION_KEY');

    if (secretToken && encryptionKey) {
      try {
        // Try Arya.ai API with proper endpoint and auth
        const aryaResponse = await fetch('CORRECT_ARYA_API_ENDPOINT_HERE', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secretToken}`,
            'X-Encryption-Key': encryptionKey
          },
          body: JSON.stringify({
            text: typeof data === 'string' ? data : JSON.stringify(data),
            masking_type: maskingType || 'asterisk'
          }),
          signal: AbortSignal.timeout(3000)
        });

        if (aryaResponse.ok) {
          const aryaResult = await aryaResponse.json();
          maskedData = aryaResult.masked_text || aryaResult.output || maskedData;
        }
      } catch (apiError) {
        console.log('Arya.ai API unavailable, using fallback:', apiError.message);
      }
    }
    */

    return Response.json({
      success: true,
      masked_data: maskedData,
      original_length: typeof data === 'string' ? data.length : JSON.stringify(data).length,
      masked_length: typeof maskedData === 'string' ? maskedData.length : JSON.stringify(maskedData).length,
      method: 'client_side_fallback'
    });

  } catch (error) {
    console.error('Error in maskSensitiveData:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
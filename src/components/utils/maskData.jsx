// Cache for masked data to avoid repeated processing
const maskCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Client-side email masking - NO network requests
 * Masks email to format: s***n@g***l.com
 */
export async function maskEmail(email) {
  if (!email) return email;
  
  // Check cache first
  const cacheKey = `email_${email}`;
  const cached = maskCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.value;
  }

  // Client-side masking logic - NO API CALLS
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  // Mask local part: show first and last char, mask middle
  const maskedLocal = local.length > 2
    ? local.charAt(0) + '***' + local.charAt(local.length - 1)
    : local.charAt(0) + '***';
  
  // Mask domain: show first char of domain name, mask rest, keep TLD
  const [domainName, tld] = domain.split('.');
  const maskedDomain = domainName.charAt(0) + '***' + '.' + tld;
  
  const maskedValue = `${maskedLocal}@${maskedDomain}`;
  
  // Cache the result
  maskCache.set(cacheKey, {
    value: maskedValue,
    timestamp: Date.now()
  });
  
  return maskedValue;
}

/**
 * Mask user data objects - purely client-side
 */
export async function maskUserData(userData) {
  if (!userData) return userData;
  
  const masked = { ...userData };
  
  // Mask email if present
  if (masked.email || masked.user_email) {
    const emailToMask = masked.email || masked.user_email;
    const maskedEmail = await maskEmail(emailToMask);
    if (masked.email) masked.email = maskedEmail;
    if (masked.user_email) masked.user_email = maskedEmail;
  }
  
  // Mask created_by if present
  if (masked.created_by) {
    masked.created_by = await maskEmail(masked.created_by);
  }
  
  return masked;
}

/**
 * Clear the masking cache
 */
export function clearMaskCache() {
  maskCache.clear();
}
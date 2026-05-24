/**
 * Normalizes the Redirect URI for Instagram/Meta OAuth.
 * Meta requires a byte-for-byte match, so we must ensure:
 * 1. No trailing slashes
 * 2. Consistent protocol (https in production)
 * 3. No query parameters
 */
export function getInstagramRedirectUri(baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000") {
  
  // Remove any trailing slash from the base URL
  const normalizedBase = baseUrl.replace(/\/$/, "");
  
  const redirectUri = `${normalizedBase}/api/auth/instagram/callback`;
  
  return redirectUri;
}

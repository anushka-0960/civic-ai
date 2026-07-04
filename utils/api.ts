/**
 * Returns the resolved backend API URL.
 * Points to the current Next.js origin.
 */
export function getBackendUrl(): string {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  // Vercel auto-injects VERCEL_URL on all deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`;
  }
  // Fallback for current origin
  return '/api';
}

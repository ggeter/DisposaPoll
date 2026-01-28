// Utility Functions for DisposaPoll

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate a cryptographically secure random magic link code
 * @param length - Length of the code (default: 20)
 * @returns Alphanumeric code
 */
export function generateMagicLinkCode(length: number = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  return Array.from(randomValues)
    .map(value => chars[value % chars.length])
    .join('');
}

/**
 * Generate session fingerprint from request
 * Combines IP address and User-Agent for simple duplicate detection
 */
export async function generateSessionId(request: Request): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const combined = `${ip}:${userAgent}`;
  
  return await hashString(combined);
}

/**
 * Simple hash function for session IDs
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * CORS headers for API responses
 */
export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/**
 * Create JSON response with CORS headers
 */
export function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

/**
 * Create error response
 */
export function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}

/**
 * Update poll's last_accessed timestamp
 */
export async function updateLastAccessed(db: D1Database, pollId: string): Promise<void> {
  await db
    .prepare('UPDATE polls SET last_accessed = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(pollId)
    .run();
}

/**
 * Validate request body exists and is JSON
 */
export async function parseRequestBody<T>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

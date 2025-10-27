import crypto from 'crypto';

/**
 * Generate a unique ID using Node's crypto module
 * This avoids ESM dependency issues with uuid/cuid2 packages
 * Format: Base36-encoded random bytes (similar to cuid)
 */
export function generateId(): string {
  // Generate 16 random bytes
  const randomBytes = crypto.randomBytes(16);

  // Convert to base36 string (lowercase alphanumeric)
  const timestamp = Date.now().toString(36);
  const random = randomBytes.toString('base64url').substring(0, 20);

  return `${timestamp}-${random}`;
}

/**
 * Alternative: Generate a UUID v4 compatible ID
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

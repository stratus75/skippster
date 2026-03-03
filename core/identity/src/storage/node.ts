/**
 * Node.js environment encrypted key storage
 */

import * as crypto from 'crypto';

/**
 * Encrypt data with a password (Node.js)
 */
export function encryptSync(data: Uint8Array, password: string): Uint8Array {
  // Generate random salt
  const salt = crypto.randomBytes(16);

  // Derive key from password
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  // Generate random IV
  const iv = crypto.randomBytes(16);

  // Encrypt
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine salt + iv + authTag + encrypted
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Decrypt data with a password (Node.js)
 */
export function decryptSync(data: Uint8Array, password: string): Uint8Array {
  const saltLength = 16;
  const ivLength = 16;
  const authTagLength = 16;

  if (data.length < saltLength + ivLength + authTagLength) {
    throw new Error('Invalid encrypted data');
  }

  // Extract salt, iv, authTag, and encrypted data
  const salt = data.slice(0, saltLength);
  const iv = data.slice(saltLength, saltLength + ivLength);
  const authTag = data.slice(saltLength + ivLength, saltLength + ivLength + authTagLength);
  const encrypted = data.slice(saltLength + ivLength + authTagLength);

  // Derive key from password
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  // Decrypt
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted;
}

/**
 * Store key to filesystem
 */
export function storeKeySync(did: string, encryptedKey: Uint8Array, path: string): void {
  const fs = require('fs');
  const keyPath = `${path}/${did}.key`;
  fs.writeFileSync(keyPath, Buffer.from(encryptedKey));
}

/**
 * Retrieve key from filesystem
 */
export function retrieveKeySync(did: string, path: string): Uint8Array | null {
  const fs = require('fs');
  try {
    const keyPath = `${path}/${did}.key`;
    return new Uint8Array(fs.readFileSync(keyPath));
  } catch {
    return null;
  }
}

/**
 * Delete key from filesystem
 */
export function deleteKeySync(did: string, path: string): void {
  const fs = require('fs');
  const keyPath = `${path}/${did}.key`;
  try {
    fs.unlinkSync(keyPath);
  } catch {
    // Ignore if file doesn't exist
  }
}
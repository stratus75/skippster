/**
 * Encrypted key storage using Web Crypto API
 */

/**
 * Encrypt data with a password
 */
export async function encrypt(data: Uint8Array, password: string): Promise<Uint8Array> {
  // Derive key from password
  const passwordBuffer = new TextEncoder().encode(password);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Generate random salt
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  // Derive encryption key
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generate random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );

  // Combine salt + iv + encrypted
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return combined;
}

/**
 * Decrypt data with a password
 */
export async function decrypt(data: Uint8Array, password: string): Promise<Uint8Array> {
  const saltLength = 16;
  const ivLength = 12;

  if (data.length < saltLength + ivLength) {
    throw new Error('Invalid encrypted data');
  }

  // Extract salt, iv, and encrypted data
  const salt = data.slice(0, saltLength);
  const iv = data.slice(saltLength, saltLength + ivLength);
  const encrypted = data.slice(saltLength + ivLength);

  // Derive key from password
  const passwordBuffer = new TextEncoder().encode(password);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encrypted
  );

  return new Uint8Array(decrypted);
}

/**
 * Store key in browser storage (localStorage or IndexedDB)
 */
export async function storeKey(
  did: string,
  encryptedKey: Uint8Array,
  type: 'localStorage' | 'indexedDB' = 'localStorage'
): Promise<void> {
  if (type === 'localStorage') {
    const key = `skippster_key_${did}`;
    const value = Buffer.from(encryptedKey).toString('base64');
    localStorage.setItem(key, value);
  } else {
    // IndexedDB implementation
    const db = await openIndexedDB();
    const tx = db.transaction('keys', 'readwrite');
    await tx.objectStore('keys').put({ did, encryptedKey });
  }
}

/**
 * Retrieve key from storage
 */
export async function retrieveKey(
  did: string,
  type: 'localStorage' | 'indexedDB' = 'localStorage'
): Promise<Uint8Array | null> {
  if (type === 'localStorage') {
    const key = `skippster_key_${did}`;
    const value = localStorage.getItem(key);
    if (!value) return null;
    return new Uint8Array(Buffer.from(value, 'base64'));
  } else {
    const db = await openIndexedDB();
    const tx = db.transaction('keys', 'readonly');
    const result = await tx.objectStore('keys').get(did);
    return result ? result.encryptedKey : null;
  }
}

/**
 * Delete key from storage
 */
export async function deleteKey(
  did: string,
  type: 'localStorage' | 'indexedDB' = 'localStorage'
): Promise<void> {
  if (type === 'localStorage') {
    const key = `skippster_key_${did}`;
    localStorage.removeItem(key);
  } else {
    const db = await openIndexedDB();
    const tx = db.transaction('keys', 'readwrite');
    await tx.objectStore('keys').delete(did);
  }
}

/**
 * Open IndexedDB for key storage
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('skippster-keys', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'did' });
      }
    };
  });
}
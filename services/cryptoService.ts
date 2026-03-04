// Simple encryption service for localStorage data
// Uses AES-GCM with a derived key from a passphrase
// Note: This provides obfuscation but not true security since the key is in the client

const ENCRYPTION_KEY = 'grind_camp_2026_local_encryption';
const SALT = new Uint8Array([71, 82, 73, 78, 68, 67, 65, 77, 80, 50, 48, 50, 54, 83, 65, 76]);

let cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  cachedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return cachedKey;
}

export const cryptoService = {
  encrypt: async (data: string): Promise<string> => {
    try {
      const key = await getKey();
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(data)
      );

      // Combine IV and encrypted data, then base64 encode
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      // Fallback to plain storage if encryption fails
      return data;
    }
  },

  decrypt: async (encryptedData: string): Promise<string> => {
    try {
      const key = await getKey();

      // Decode base64 and extract IV and data
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
      );
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      // If decryption fails, assume it's unencrypted legacy data
      console.warn('Decryption failed, assuming legacy unencrypted data');
      return encryptedData;
    }
  },

  // Check if data appears to be encrypted (base64 with expected length)
  isEncrypted: (data: string): boolean => {
    try {
      // Encrypted data should be base64 and have at least 12 bytes for IV
      const decoded = atob(data);
      return decoded.length > 12;
    } catch {
      return false;
    }
  }
};

/** Passwortbasierte Verschlüsselung der Sicherungsdatei: PBKDF2-SHA-256 und AES-256-GCM (Web Crypto). */
export const ENCRYPTED_FORMAT = 'life-leveling-backup-encrypted';
const ITERATIONS = 310_000;

export interface EncryptedEnvelope {
  format: typeof ENCRYPTED_FORMAT;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  iv: string;
  data: string;
}

const toB64 = (b: Uint8Array) => {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
};
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptText(plain: string, password: string): Promise<EncryptedEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));
  return {
    format: ENCRYPTED_FORMAT,
    kdf: 'PBKDF2-SHA256',
    iterations: ITERATIONS,
    salt: toB64(salt),
    iv: toB64(iv),
    data: toB64(new Uint8Array(data)),
  };
}

export async function decryptText(env: EncryptedEnvelope, password: string): Promise<string> {
  const key = await deriveKey(password, fromB64(env.salt), env.iterations);
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(env.iv) }, key, fromB64(env.data));
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error('Das Passwort ist falsch oder die Datei ist beschädigt.');
  }
}

export function isEncryptedEnvelope(x: unknown): x is EncryptedEnvelope {
  return !!x && typeof x === 'object' && (x as { format?: unknown }).format === ENCRYPTED_FORMAT;
}

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getSecret(): Buffer {
  const secret = process.env.ENCRYPT_SECRET;
  if (!secret) {
    throw new Error("ENCRYPT_SECRET environment variable is not set");
  }
  const buf = Buffer.from(secret, "utf-8");
  if (buf.length !== 32) {
    throw new Error("ENCRYPT_SECRET must be exactly 32 bytes");
  }
  return buf;
}

/**
 * AES-256-GCM 암호화
 * 출력 형식: iv:authTag:ciphertext (모두 base64)
 */
export function encryptApiKey(plaintext: string): string {
  const key = getSecret();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * AES-256-GCM 복호화
 * 입력 형식: iv:authTag:ciphertext (모두 base64)
 */
export function decryptApiKey(encrypted: string): string {
  const key = getSecret();
  const parts = encrypted.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format: expected iv:authTag:ciphertext");
  }

  const iv = Buffer.from(parts[0], "base64");
  const authTag = Buffer.from(parts[1], "base64");
  const ciphertext = Buffer.from(parts[2], "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf-8");
}

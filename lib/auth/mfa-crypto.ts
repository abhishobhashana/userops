import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.MFA_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("MFA_ENCRYPTION_KEY is not defined");
  }

  /*
   * MFA_ENCRYPTION_KEY must be a 32-byte key
   * represented as a 64-character hexadecimal string.
   */
  if (!/^[a-fA-F0-9]{64}$/.test(secret)) {
    throw new Error(
      "MFA_ENCRYPTION_KEY must be a 64-character hexadecimal string",
    );
  }

  return Buffer.from(secret, "hex");
}

export function encryptMfaSecret(secret: string): string {
  const key = getEncryptionKey();

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  /*
   * Format:
   *
   * iv:authTag:ciphertext
   */
  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptMfaSecret(encryptedSecret: string): string {
  const key = getEncryptionKey();

  const parts = encryptedSecret.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted MFA secret");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  if (
    iv.length !== IV_LENGTH ||
    authTag.length !== AUTH_TAG_LENGTH ||
    encrypted.length === 0
  ) {
    throw new Error("Invalid encrypted MFA secret");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

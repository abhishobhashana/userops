import { createHash, randomBytes, randomInt } from "node:crypto";

const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RECOVERY_CODE_LENGTH = 16;
const RESET_TOKEN_BYTES = 32;

export const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

function normalizeRecoveryCode(code: string): string {
  return code.replace(/-/g, "").trim().toUpperCase();
}

export function generateRecoveryCode(): string {
  let code = "";

  for (let index = 0; index < RECOVERY_CODE_LENGTH; index += 1) {
    code += RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)];
  }

  return code.match(/.{1,4}/g)!.join("-");
}

export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(normalizeRecoveryCode(code)).digest("hex");
}

export function generateResetToken(): string {
  return randomBytes(RESET_TOKEN_BYTES).toString("hex");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getResetTokenExpiry(): Date {
  return new Date(Date.now() + RESET_TOKEN_TTL_MS);
}

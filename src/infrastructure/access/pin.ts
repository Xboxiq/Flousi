import type { PinRecord } from "@/domain";

/**
 * The PIN, hashed.
 *
 * Read gate P3/G0 first: this is **not** security. The store lives in
 * `localStorage`, which anyone holding the device can read, and a hash sitting
 * beside the app that verifies it can be bypassed by anyone willing to open the
 * developer tools. What hashing buys is that the app is not *careless*: a glance at
 * storage does not reveal the merchant's PIN, which he has very likely reused
 * somewhere that does matter.
 *
 * SHA-256 with a per-install random salt, via WebCrypto — no dependency, and no
 * hand-rolled hash.
 */

const ENCODER = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function digest(salt: string, pin: string): Promise<string> {
  const data = ENCODER.encode(`${salt}:${pin}`);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

/** Builds a storable record. The digits never enter it. */
export async function hashPin(pin: string, now: string): Promise<PinRecord> {
  const salt = randomSalt();
  return { hash: await digest(salt, pin), salt, updatedAt: now };
}

/**
 * Verifies a PIN against a record.
 *
 * A missing record means no PIN is set, and the way back to the owner is then
 * unconditional — which is the correct answer, not a failure (gate P3/G2).
 */
export async function verifyPin(record: PinRecord | null, pin: string): Promise<boolean> {
  if (!record) return true;
  if (!record.salt || !record.hash) return true;
  return (await digest(record.salt, pin)) === record.hash;
}

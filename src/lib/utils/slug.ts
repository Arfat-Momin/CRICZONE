import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 12;

/**
 * Generates a random, URL-safe code with 36^12 (~4.7e18) possibilities.
 * Used as a tournament slug. Not cryptographically sensitive — just
 * hard to guess and impossible to collide in practice.
 */
export function generateShortCode(length = CODE_LENGTH): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    const b = bytes[i] ?? 0;
    out += ALPHABET.charAt(b % ALPHABET.length);
  }
  return out;
}

/**
 * Slugifies a human-readable string (kept for potential SEO-friendly
 * URLs, labels, or fallbacks). Not used for public URLs anymore.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    .replace(/-$/, "");
}
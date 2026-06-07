import { webcrypto } from "node:crypto";

const { subtle } = webcrypto;
const encoder = new TextEncoder();
const iterations = 100_000;

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

function randomSecret(bytes = 32) {
  return base64Url(webcrypto.getRandomValues(new Uint8Array(bytes)));
}

async function hashCredential(credential, pepper) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const material = await subtle.importKey(
    "raw",
    encoder.encode(`${credential}:${pepper}`),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256"
    },
    material,
    256
  );
  return `v1$${iterations}$${base64Url(salt)}$${base64Url(
    new Uint8Array(bits)
  )}`;
}

const [ownerPassword, staffPin, ownerEmail = "owner@example.com"] =
  process.argv.slice(2);

if (!ownerPassword || !staffPin) {
  console.error(
    "Usage: npm run auth:generate -- <owner-password> <staff-pin> [owner-email]"
  );
  process.exitCode = 1;
} else {
  const pepper = randomSecret();
  const sessionSecret = randomSecret();
  const ownerHash = await hashCredential(ownerPassword, pepper);
  const staffHash = await hashCredential(staffPin, pepper);

  console.log(`AUTH_PEPPER="${pepper}"`);
  console.log(`SESSION_SECRET="${sessionSecret}"`);
  console.log(`DEMO_OWNER_EMAIL="${ownerEmail}"`);
  console.log(`DEMO_OWNER_PASSWORD_HASH="${ownerHash}"`);
  console.log(`DEMO_STAFF_PIN_HASH="${staffHash}"`);
  console.log(`NOTIFICATION_ALLOWLIST="${ownerEmail}"`);
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const iterations = 100_000;

export type StaffSession = {
  restaurantSlug: string;
  role: "owner" | "staff";
  expiresAt: number;
};

function bytesToBase64Url(bytes: Uint8Array) {
  let value = "";
  bytes.forEach((byte) => {
    value += String.fromCharCode(byte);
  });
  return btoa(value)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "="
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveCredential(
  credential: string,
  pepper: string,
  salt: Uint8Array
) {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${credential}:${pepper}`),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new Uint8Array(salt).buffer,
      iterations,
      hash: "SHA-256"
    },
    material,
    256
  );
  return new Uint8Array(bits);
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export async function hashCredential(credential: string, pepper: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveCredential(credential, pepper, salt);
  return `v1$${iterations}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hash)}`;
}

export async function verifyCredential(
  credential: string,
  pepper: string,
  stored: string
) {
  const [version, storedIterations, saltValue, hashValue] = stored.split("$");
  if (
    version !== "v1" ||
    Number(storedIterations) !== iterations ||
    !saltValue ||
    !hashValue
  ) {
    return false;
  }
  const actual = await deriveCredential(
    credential,
    pepper,
    base64UrlToBytes(saltValue)
  );
  return equalBytes(actual, base64UrlToBytes(hashValue));
}

async function importHmacKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage
  );
}

export async function createSessionToken(
  session: StaffSession,
  secret: string
) {
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify(session)));
  const key = await importHmacKey(secret, ["sign"]);
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
  );
  return `${payload}.${bytesToBase64Url(signature)}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<StaffSession | null> {
  const [payload, signatureValue, extra] = token.split(".");
  if (!payload || !signatureValue || extra) {
    return null;
  }

  try {
    const key = await importHmacKey(secret, ["verify"]);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signatureValue),
      encoder.encode(payload)
    );
    if (!valid) {
      return null;
    }
    const session = JSON.parse(
      decoder.decode(base64UrlToBytes(payload))
    ) as StaffSession;
    if (
      !session.restaurantSlug ||
      !["owner", "staff"].includes(session.role) ||
      session.expiresAt <= nowSeconds
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

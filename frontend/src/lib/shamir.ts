// Guardian security module:
// - Shamir 2-of-3 secret sharing over a 521-bit prime field
// - AES-256-GCM authenticated encryption
//
// Prototype security layer for Continuum.
// Production deployment would require server-side key management,
// secure guardian authentication, and additional operational controls.

type U8 = Uint8Array<ArrayBuffer>;

const P = 2n ** 521n - 1n;
const SECRET_LENGTH = 32;
const IV_LENGTH = 12;
const SHARE_COUNT = 3;
const THRESHOLD = 2;

const mod = (a: bigint) => ((a % P) + P) % P;

const powmod = (base: bigint, exponent: bigint) => {
  let result = 1n;
  let value = mod(base);
  let power = exponent;

  while (power > 0n) {
    if (power & 1n) {
      result = mod(result * value);
    }

    value = mod(value * value);
    power >>= 1n;
  }

  return result;
};

const inv = (value: bigint) => {
  const normalized = mod(value);

  if (normalized === 0n) {
    throw new Error("Cannot invert zero in the field.");
  }

  return powmod(normalized, P - 2n);
};

const toBig = (bytes: Uint8Array) => {
  if (bytes.length === 0) {
    throw new Error("Cannot convert empty bytes to bigint.");
  }

  return BigInt(
    "0x" +
      Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join(""),
  );
};

const toBytes = (value: bigint, length: number): U8 => {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("Invalid byte length.");
  }

  if (value < 0n) {
    throw new Error("Cannot encode a negative value.");
  }

  const hex = value.toString(16);

  if (hex.length > length * 2) {
    throw new Error("Value does not fit in the requested byte length.");
  }

  const padded = hex.padStart(length * 2, "0");

  return Uint8Array.from(
    padded.match(/../g)!.map((part) => parseInt(part, 16)),
  ) as U8;
};

const isValidX = (x: number) =>
  Number.isInteger(x) && x >= 1 && x <= SHARE_COUNT;

const isValidHex = (value: string) =>
  typeof value === "string" &&
  value.length > 0 &&
  /^[0-9a-fA-F]+$/.test(value);

const validateShare = (share: Share) => {
  if (!share || typeof share !== "object") {
    throw new Error("Invalid share.");
  }

  if (!isValidX(share.x)) {
    throw new Error("Invalid guardian share index.");
  }

  if (!isValidHex(share.y)) {
    throw new Error("Invalid guardian share value.");
  }

  const y = BigInt(`0x${share.y}`);

  if (y < 0n || y >= P) {
    throw new Error("Guardian share value is outside the field.");
  }

  return y;
};

export type Share = {
  x: number;
  y: string;
};

/**
 * Create exactly 3 shares from a 32-byte AES key.
 *
 * Any 2 valid shares can reconstruct the original key.
 */
export function split(secret: Uint8Array): Share[] {
  if (secret.length !== SECRET_LENGTH) {
    throw new Error(
      `Guardian secret must be exactly ${SECRET_LENGTH} bytes.`,
    );
  }

  const coefficient = toBig(
    crypto.getRandomValues(new Uint8Array(64)),
  );

  const secretValue = toBig(secret);

  return Array.from({ length: SHARE_COUNT }, (_, index) => {
    const x = index + 1;

    return {
      x,
      y: mod(secretValue + coefficient * BigInt(x)).toString(16),
    };
  });
}

/**
 * Reconstruct the AES key from exactly 2 distinct valid shares.
 */
export function combine(shares: Share[], len = SECRET_LENGTH): U8 {
  if (!Array.isArray(shares)) {
    throw new Error("Shares must be provided as an array.");
  }

  if (shares.length !== THRESHOLD) {
    throw new Error(
      `Exactly ${THRESHOLD} shares are required to reconstruct the vault.`,
    );
  }

  if (!Number.isInteger(len) || len !== SECRET_LENGTH) {
    throw new Error(
      `Reconstructed key must be exactly ${SECRET_LENGTH} bytes.`,
    );
  }

  const first = shares[0]!;
  const second = shares[1]!;

  if (first.x === second.x) {
    throw new Error("Duplicate guardian shares are not allowed.");
  }

  const y1 = validateShare(first);
  const y2 = validateShare(second);

  const x1 = BigInt(first.x);
  const x2 = BigInt(second.x);

  const secret = mod(
    y1 * x2 * inv(x2 - x1) +
      y2 * x1 * inv(x1 - x2),
  );

  // A valid AES-256 key must fit exactly into 32 bytes.
  return toBytes(secret, len);
}

/**
 * Encrypt a plaintext vault using AES-256-GCM.
 */
export async function makeVault(plaintext: string) {
  if (typeof plaintext !== "string") {
    throw new Error("Vault plaintext must be a string.");
  }

  const raw = crypto.getRandomValues(
    new Uint8Array(SECRET_LENGTH),
  ) as U8;

  const key = await crypto.subtle.importKey(
    "raw",
    raw,
    "AES-GCM",
    false,
    ["encrypt"],
  );

  const iv = crypto.getRandomValues(
    new Uint8Array(IV_LENGTH),
  ) as U8;

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    new TextEncoder().encode(plaintext),
  );

  return {
    iv,
    ct: new Uint8Array(encrypted) as U8,
    shares: split(raw),
  };
}

/**
 * Decrypt the vault using exactly 2 guardian shares.
 *
 * AES-GCM authentication guarantees that a corrupted ciphertext
 * or incorrect reconstructed key causes decryption to fail.
 */
export async function openVault(
  iv: U8,
  ct: U8,
  shares: Share[],
) {
  if (!(iv instanceof Uint8Array) || iv.length !== IV_LENGTH) {
    throw new Error("Invalid AES-GCM initialization vector.");
  }

  if (!(ct instanceof Uint8Array) || ct.length === 0) {
    throw new Error("Invalid encrypted vault.");
  }

  const raw = combine(shares);

  const key = await crypto.subtle.importKey(
    "raw",
    raw,
    "AES-GCM",
    false,
    ["decrypt"],
  );

  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    ct,
  );

  return new TextDecoder().decode(plaintext);
}
// Shamir 2-of-3 over a 521-bit Mersenne prime field + AES-GCM. Prototype only.
type U8 = Uint8Array<ArrayBuffer>;
const P = 2n ** 521n - 1n;
const mod = (a: bigint) => ((a % P) + P) % P;
const powmod = (b: bigint, e: bigint) => {
  let r = 1n;
  b = mod(b);
  while (e > 0n) {
    if (e & 1n) r = mod(r * b);
    b = mod(b * b);
    e >>= 1n;
  }
  return r;
};
const inv = (a: bigint) => powmod(a, P - 2n);
const toBig = (b: Uint8Array) => BigInt("0x" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join(""));
const toBytes = (n: bigint, len: number) => {
  const h = n.toString(16).padStart(len * 2, "0");
  return Uint8Array.from(h.match(/../g)!.map((x) => parseInt(x, 16)));
};

export type Share = { x: number; y: string };

export function split(secret: Uint8Array): Share[] {
  const a1 = toBig(crypto.getRandomValues(new Uint8Array(64)));
  const s = toBig(secret);
  return [1, 2, 3].map((x) => ({ x, y: mod(s + a1 * BigInt(x)).toString(16) }));
}

export function combine(shares: Share[], len = 32): Uint8Array {
  const a = shares[0]!, b = shares[1]!;
  const x1 = BigInt(a.x), x2 = BigInt(b.x);
  const y1 = BigInt("0x" + a.y), y2 = BigInt("0x" + b.y);
  const s = mod(y1 * x2 * inv(x2 - x1) + y2 * x1 * inv(x1 - x2));
  return toBytes(s, len);
}

export async function makeVault(plaintext: string) {
  const raw = crypto.getRandomValues(new Uint8Array(32)) as U8;
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12)) as U8;
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext)),
  );
  return { iv, ct, shares: split(raw) };
}

export async function openVault(iv: U8, ct: U8, shares: Share[]) {
  const key = await crypto.subtle.importKey("raw", combine(shares) as U8, "AES-GCM", false, ["decrypt"]);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct as U8);
  return new TextDecoder().decode(pt);
}

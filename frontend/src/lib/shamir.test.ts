import { describe, expect, it } from "vitest";
import {
  makeVault,
  openVault,
  split,
  combine,
  type Share,
} from "./shamir";

describe("Guardian Shamir 2-of-3 security", () => {
  it("G01: reconstructs the secret using any valid pair", () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const shares = split(secret);

    const recovered = combine([shares[0], shares[1]]);

    expect(Array.from(recovered)).toEqual(Array.from(secret));
  });

  it("G02: rejects fewer than 2 shares", () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const shares = split(secret);

    expect(() => combine([shares[0]])).toThrow(
      "Exactly 2 shares are required",
    );
  });

  it("G03: rejects more than 2 shares", () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const shares = split(secret);

    expect(() => combine(shares)).toThrow(
      "Exactly 2 shares are required",
    );
  });

  it("G04: rejects duplicate shares", () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const shares = split(secret);

    expect(() => combine([shares[0], shares[0]])).toThrow(
      "Duplicate guardian shares are not allowed",
    );
  });

  it("G05: rejects an invalid guardian share index", () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const shares = split(secret);

    const invalidShare: Share = {
      x: 99,
      y: shares[0].y,
    };

    expect(() => combine([invalidShare, shares[1]])).toThrow(
      "Invalid guardian share index",
    );
  });

  it("G06: rejects malformed share data", () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const shares = split(secret);

    const invalidShare: Share = {
      x: 1,
      y: "not-a-hex-value",
    };

    expect(() => combine([invalidShare, shares[1]])).toThrow(
      "Invalid guardian share value",
    );
  });

  it("G07: rejects corrupted ciphertext", async () => {
    const vault = await makeVault(
      "Continuum synthetic emergency vault",
    );

    const corruptedCiphertext = new Uint8Array(vault.ct);
    corruptedCiphertext[0] ^= 0xff;

    await expect(
      openVault(
        vault.iv,
        corruptedCiphertext,
        [vault.shares[0], vault.shares[1]],
      ),
    ).rejects.toThrow();
  });

  it("G08: successfully decrypts with Guardian 1 + Guardian 3", async () => {
    const plaintext = "Continuum test vault G1 + G3";

    const vault = await makeVault(plaintext);

    const decrypted = await openVault(
      vault.iv,
      vault.ct,
      [vault.shares[0], vault.shares[2]],
    );

    expect(decrypted).toBe(plaintext);
  });

  it("G09: successfully decrypts with Guardian 2 + Guardian 3", async () => {
    const plaintext = "Continuum test vault G2 + G3";

    const vault = await makeVault(plaintext);

    const decrypted = await openVault(
      vault.iv,
      vault.ct,
      [vault.shares[1], vault.shares[2]],
    );

    expect(decrypted).toBe(plaintext);
  });

  it("G10: encrypts and decrypts a vault correctly", async () => {
    const plaintext =
      "Locker: SBI Aundh, #214 — key in blue pouch.";

    const vault = await makeVault(plaintext);

    expect(vault.shares).toHaveLength(3);
    expect(vault.iv).toHaveLength(12);
    expect(vault.ct.length).toBeGreaterThan(0);

    const decrypted = await openVault(
      vault.iv,
      vault.ct,
      [vault.shares[0], vault.shares[1]],
    );

    expect(decrypted).toBe(plaintext);
  });
});
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { makeVault, openVault, type Share } from "@/lib/shamir";

export const Route = createFileRoute("/guardian")({
  head: () => ({
    meta: [
      { title: "Guardian Release — Continuum" },
      { name: "description", content: "Any 2 of 3 guardians can unlock the household vault, using Shamir secret sharing." },
      { property: "og:title", content: "Guardian Release — Continuum" },
      { property: "og:description", content: "Any 2 of 3 guardians can unlock the household vault, using Shamir secret sharing." },
    ],
  }),
  component: Guardian,
});

const GUARDIANS = ["Meera (spouse)", "Rohan (son)", "R. Deshpande (CA)"];
const SECRET = `Locker: SBI Aundh, #214 — key in blue pouch, study drawer.
Net-banking hint: "first car + year".
Will: original with Adv. Joshi, copy in locker.`;

function Guardian() {
  const [vault, setVault] = useState<{ iv: Uint8Array<ArrayBuffer>; ct: Uint8Array<ArrayBuffer>; shares: Share[] } | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [out, setOut] = useState<string | null>(null);

  useEffect(() => { makeVault(SECRET).then(setVault); }, []);

  const toggle = (i: number) => {
    setOut(null);
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i].slice(-2)));
  };
  const release = async () => {
    if (!vault) return;
    try {
      setOut(await openVault(vault.iv, vault.ct, picked.map((i) => vault.shares[i]!)));
    } catch {
      setOut("Decryption failed.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Shamir 2-of-3 · AES-GCM · release simulated</p>
        <h1 className="mt-2 text-4xl">No single person can open the vault. Any two can.</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {GUARDIANS.map((g, i) => {
          const on = picked.includes(i);
          return (
            <button key={g} onClick={() => toggle(i)}
              className={`card-surface p-5 text-left transition ${on ? "!border-primary ring-2 ring-primary" : "hover:bg-muted"}`}>
              <div className="eyebrow">Guardian G{i + 1}</div>
              <div className="mt-1 font-display text-lg">{g}</div>
              <div className="mt-3 truncate font-mono text-[10px] text-muted-foreground">
                share {vault ? vault.shares[i]!.y.slice(0, 28) + "…" : "generating…"}
              </div>
              <div className="mt-3 text-sm">{on ? "✓ Share submitted" : "Tap to submit share"}</div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4">
        <button onClick={release} disabled={picked.length < 2 || !vault}
          className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground disabled:opacity-40">
          Release vault ({picked.length}/2)
        </button>
        <span className="text-sm text-muted-foreground">Pick any two guardians.</span>
      </div>
      <div className="card-surface p-6">
        <div className="eyebrow mb-2">{out ? "Decrypted vault" : "Encrypted vault"}</div>
        <pre className="whitespace-pre-wrap break-all font-mono text-sm">
          {out ?? (vault ? Array.from(vault.ct.slice(0, 96), (b) => b.toString(16).padStart(2, "0")).join("") + "…" : "…")}
        </pre>
      </div>
    </div>
  );
}

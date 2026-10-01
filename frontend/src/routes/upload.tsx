import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { actions, computeScores, DIMENSIONS, mockExtract, SAMPLE_DOCS, useStore } from "@/lib/store";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload & Confirm — Continuum" },
      { name: "description", content: "Extract fields from household documents and confirm each one by hand." },
      { property: "og:title", content: "Upload & Confirm — Continuum" },
      { property: "og:description", content: "Extract fields from household documents and confirm each one by hand." },
    ],
  }),
  component: Upload,
});

function Upload() {
  const s = useStore();
  const { overall } = computeScores(s);
  const [drag, setDrag] = useState(false);
  const loaded = new Set(s.docs.map((d) => d.name));

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (!/\.(txt|md)$/i.test(f.name)) continue;
      actions.addDoc(mockExtract(f.name, await f.text()));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Upload → Extract → Confirm</p>
          <h1 className="mt-2 text-4xl">Nothing counts until a person confirms it.</h1>
        </div>
        <div className="card-surface px-5 py-3 text-center">
          <div className="font-display text-3xl font-semibold">{overall}</div>
          <div className="eyebrow">live score</div>
        </div>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        className={`block cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition ${drag ? "border-primary bg-accent" : "bg-card"}`}
      >
        <input type="file" accept=".txt,.md" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <p className="font-display text-xl">Drop .txt / .md files</p>
        <p className="mt-1 text-sm text-muted-foreground">Lines like "Nominee: Meera" become fields. Mock extractor — files never leave your browser.</p>
      </label>

      <div>
        <p className="eyebrow mb-3">Or try a synthetic sample</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_DOCS.map((d) => (
            <button
              key={d.name}
              disabled={loaded.has(d.name)}
              onClick={() => actions.addDoc(d)}
              className="rounded-md border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"
            >
              {d.type}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {s.docs.map((doc) => (
          <div key={doc.id} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg">{doc.type}</h3>
                <p className="font-mono text-xs text-muted-foreground">{doc.name}</p>
              </div>
              <button onClick={() => actions.removeDoc(doc.id)} className="text-sm text-muted-foreground hover:text-destructive">
                Remove
              </button>
            </div>
            {doc.fields.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No "Label: value" lines found.</p>}
            <div className="mt-4 divide-y">
              {doc.fields.map((f) => (
                <FieldRow key={f.id} docId={doc.id} f={f} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldRow({ docId, f }: { docId: string; f: ReturnType<typeof useStore>["docs"][0]["fields"][0] }) {
  const [val, setVal] = useState(f.value);
  const high = f.confidence >= 0.7;
  const dim = DIMENSIONS.find((d) => d.key === f.dim)!;
  return (
    <div className="grid items-center gap-3 py-3 text-sm md:grid-cols-[160px_1fr_auto_auto]">
      <div>
        <div className="font-medium">{f.label}</div>
        <div className="eyebrow !text-[0.6rem]">{dim.label}</div>
      </div>
      <input
        value={val}
        disabled={f.confirmed}
        onChange={(e) => setVal(e.target.value)}
        className="rounded-md border bg-background px-3 py-1.5 disabled:border-transparent disabled:bg-transparent"
      />
      <span className={`rounded-full px-2 py-0.5 font-mono text-xs ${high ? "bg-accent text-accent-foreground" : "bg-gold/30 text-gold-foreground"}`}>
        {high ? "high" : "low"} {Math.round(f.confidence * 100)}%
      </span>
      {f.confirmed ? (
        <span className="w-24 text-center text-success">✓ Confirmed</span>
      ) : (
        <button onClick={() => actions.confirm(docId, f.id, val)} className="w-24 rounded-md bg-primary px-3 py-1.5 text-primary-foreground">
          Confirm
        </button>
      )}
    </div>
  );
}

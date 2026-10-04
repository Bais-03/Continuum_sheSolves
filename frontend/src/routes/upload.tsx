import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SAMPLE_DOCS } from "@/lib/store";
import { 
  apiGetDocuments, 
  apiUploadDocument, 
  apiDeleteDocument, 
  apiConfirmField, 
  apiRejectField,
  apiGetScores 
} from "@/lib/api";

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

type BackendField = {
  id: string;
  field_label: string;
  extracted_value: string | null;
  confidence: number | null;
  readiness_dimension: string | null;
  confirmation_status: string;
};

type BackendDoc = {
  id: string;
  filename: string;
  document_type: string | null;
  upload_status: string;
  fields: BackendField[];
};

function Upload() {
  const [docs, setDocs] = useState<BackendDoc[]>([]);
  const [overallScore, setOverallScore] = useState<number>(17);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshData = async () => {
    try {
      setLoading(true);
      const docsRes = await apiGetDocuments();
      setDocs(docsRes || []);
      const scoresRes = await apiGetScores();
      if (scoresRes && typeof scoresRes.overall_score === "number") {
        setOverallScore(scoresRes.overall_score);
      }
    } catch (err: any) {
      console.warn("Could not fetch documents from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setLoading(true);
    try {
      for (const f of Array.from(files)) {
        await apiUploadDocument(f);
      }
      await refreshData();
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleSampleDoc = async (sample: typeof SAMPLE_DOCS[0]) => {
    setError("");
    setLoading(true);
    try {
      const content = sample.fields.map(f => `${f.label}: ${f.value}`).join("\n");
      const file = new File([content], sample.name, { type: "text/plain" });
      await apiUploadDocument(file);
      await refreshData();
    } catch (err: any) {
      setError(err.message || "Failed to upload sample document");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDoc = async (docId: string) => {
    try {
      setLoading(true);
      await apiDeleteDocument(docId);
      await refreshData();
    } catch (err: any) {
      setError(err.message || "Failed to delete document");
    } finally {
      setLoading(false);
    }
  };

  const loadedNames = new Set(docs.map((d) => d.filename));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Upload → Extract → Confirm</p>
          <h1 className="mt-2 text-4xl">Nothing counts until a person confirms it.</h1>
        </div>
        <div className="card-surface px-5 py-3 text-center">
          <div className="font-display text-3xl font-semibold">{overallScore}</div>
          <div className="eyebrow">live score</div>
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        className={`block cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition ${drag ? "border-primary bg-accent" : "bg-card"}`}
      >
        <input type="file" accept=".txt,.md" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <p className="font-display text-xl">Drop .txt / .md files</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading ? "Processing document..." : "Lines like 'Nominee: Meera' become extracted fields automatically saved to the backend."}
        </p>
      </label>

      <div>
        <p className="eyebrow mb-3">Or try a synthetic sample</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_DOCS.map((d) => (
            <button
              key={d.name}
              disabled={loadedNames.has(d.name) || loading}
              onClick={() => handleSampleDoc(d)}
              className="rounded-md border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"
            >
              {d.type}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {docs.length === 0 && !loading && (
          <div className="card-surface p-8 text-center text-muted-foreground">
            No documents uploaded yet. Upload a .txt file or select a sample above to begin.
          </div>
        )}
        {docs.map((doc) => (
          <div key={doc.id} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg">{doc.document_type || "Document"}</h3>
                <p className="font-mono text-xs text-muted-foreground">{doc.filename} · <span className="uppercase text-primary">{doc.upload_status}</span></p>
              </div>
              <button 
                onClick={() => handleRemoveDoc(doc.id)} 
                disabled={loading}
                className="text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                Remove
              </button>
            </div>
            {doc.fields.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No "Label: value" lines found in this document.</p>}
            <div className="mt-4 divide-y">
              {doc.fields.map((f) => (
                <FieldRow key={f.id} f={f} onRefresh={refreshData} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldRow({ f, onRefresh }: { f: BackendField; onRefresh: () => void }) {
  const [val, setVal] = useState(f.extracted_value || "");
  const [submitting, setSubmitting] = useState(false);
  const confidence = f.confidence ?? 1.0;
  const high = confidence >= 0.7;
  const isConfirmed = f.confirmation_status === "CONFIRMED";
  const isRejected = f.confirmation_status === "REJECTED";

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await apiConfirmField(f.id, val);
      onRefresh();
    } catch (err) {
      console.error("Failed to confirm field:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      await apiRejectField(f.id);
      onRefresh();
    } catch (err) {
      console.error("Failed to reject field:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid items-center gap-3 py-3 text-sm md:grid-cols-[160px_1fr_auto_auto]">
      <div>
        <div className="font-medium">{f.field_label}</div>
        <div className="eyebrow !text-[0.6rem]">{f.readiness_dimension || "asset"}</div>
      </div>
      <input
        value={val}
        disabled={isConfirmed || submitting}
        onChange={(e) => setVal(e.target.value)}
        className="rounded-md border bg-background px-3 py-1.5 disabled:border-transparent disabled:bg-transparent"
      />
      <span className={`rounded-full px-2 py-0.5 font-mono text-xs ${high ? "bg-accent text-accent-foreground" : "bg-gold/30 text-gold-foreground"}`}>
        {high ? "high" : "low"} {Math.round(confidence * 100)}%
      </span>
      <div className="flex items-center gap-2">
        {isConfirmed ? (
          <span className="w-24 text-center text-success font-medium">✓ Confirmed</span>
        ) : isRejected ? (
          <span className="w-24 text-center text-destructive font-medium">✗ Rejected</span>
        ) : (
          <>
            <button 
              onClick={handleConfirm} 
              disabled={submitting}
              className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Confirm
            </button>
            <button 
              onClick={handleReject} 
              disabled={submitting}
              className="rounded-md border border-destructive/30 px-3 py-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
<<<<<<< Updated upstream
import { useState } from "react";
import { actions, computeScores, DIMENSIONS, mockExtract, SAMPLE_DOCS, useStore } from "@/lib/store";
=======
import { useState, useEffect } from "react";
import { SAMPLE_DOCS } from "@/lib/store";
import {
  apiGetDocuments,
  apiUploadDocument,
  apiDeleteDocument,
  apiConfirmField,
  apiRejectField,
  apiGetScores,
} from "@/lib/api";
import {
  UploadCloud,
  FileCheck2,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  Check,
  RefreshCw,
} from "lucide-react";
>>>>>>> Stashed changes

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
<<<<<<< Updated upstream
      { title: "Upload & Confirm — Continuum" },
      { name: "description", content: "Extract fields from household documents and confirm each one by hand." },
      { property: "og:title", content: "Upload & Confirm — Continuum" },
      { property: "og:description", content: "Extract fields from household documents and confirm each one by hand." },
=======
      { title: "Upload & Confirm Documents — Continuum" },
      {
        name: "description",
        content: "Extract fields from household documents and confirm each one by hand.",
      },
>>>>>>> Stashed changes
    ],
  }),
  component: Upload,
});

function Upload() {
  const s = useStore();
  const { overall } = computeScores(s);
  const [drag, setDrag] = useState(false);
<<<<<<< Updated upstream
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

=======
  const [loading, setLoading] = useState(false);
  const [confirmingAll, setConfirmingAll] = useState(false);
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
      setError(err.message || "Failed to upload document file");
    } finally {
      setLoading(false);
    }
  };

  const handleSampleDoc = async (sample: typeof SAMPLE_DOCS[0]) => {
    setError("");
    setLoading(true);

    try {
      const content = sample.fields
        .map((f) => `${f.label}: ${f.value}`)
        .join("\n");

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

  const handleConfirmAll = async () => {
    try {
      setConfirmingAll(true);
      setError("");

      const unconfirmedFields = docs.flatMap((doc) =>
        doc.fields.filter(
          (field) =>
            field.confirmation_status !== "CONFIRMED" &&
            field.confirmation_status !== "REJECTED"
        )
      );

      if (unconfirmedFields.length === 0) return;

      await Promise.all(
        unconfirmedFields.map((field) =>
          apiConfirmField(field.id, field.extracted_value || "")
        )
      );

      await refreshData();
    } catch (err: any) {
      console.error("Failed to confirm all fields:", err);
      setError(err.message || "Failed to confirm all fields");
    } finally {
      setConfirmingAll(false);
    }
  };

  const hasUnconfirmedFields = docs.some((doc) =>
    doc.fields.some(
      (field) =>
        field.confirmation_status !== "CONFIRMED" &&
        field.confirmation_status !== "REJECTED"
    )
  );

  const loadedNames = new Set(docs.map((d) => d.filename));

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <FileCheck2 className="h-3.5 w-3.5 text-sky-600" />
            Human-In-The-Loop Intelligence Protocol
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-slate-900 font-display">
            Document Extraction & Verification
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
            Continuum extracts beneficiary, asset, and policy terms from your documents. Every fact requires explicit human verification before influencing successor readiness scores.
          </p>
        </div>

        <div className="card-surface px-6 py-3 text-center border-slate-200 shadow-sm">
          <div className="font-display text-3xl font-bold text-sky-800 font-mono">
            {overallScore}
          </div>
          <div className="eyebrow text-[0.62rem] text-slate-500">
            LIVE READINESS INDEX
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Upload Drag Drop Area */}
>>>>>>> Stashed changes
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
<<<<<<< Updated upstream
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
=======
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition cursor-pointer ${
          drag
            ? "border-sky-500 bg-sky-50"
            : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50 shadow-sm"
        }`}
      >
        <input
          type="file"
          accept=".txt,.md"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 mb-4">
          <UploadCloud className="h-7 w-7" />
        </div>

        <p className="text-lg font-semibold text-slate-900 font-display">
          Drop household document files (.txt / .md)
        </p>

        <p className="mt-2 text-xs text-slate-600 max-w-md leading-relaxed">
          {loading
            ? "Processing and extracting document facts..."
            : "Lines formatted like 'Nominee: Meera Kulkarni' or 'Policy No: 98124' are automatically extracted into verifiable fields."}
        </p>

        <div className="mt-4 cyber-button text-xs py-2 px-4">
          Select Files to Upload
        </div>
      </label>

      {/* Sample Synthetic Documents */}
      <div className="card-surface p-5 shadow-sm">
        <p className="eyebrow mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-sky-600" />
          Test Synthetic Sample Files
        </p>

        <div className="flex flex-wrap gap-2.5">
          {SAMPLE_DOCS.map((d) => {
            const isLoaded = loadedNames.has(d.name);
            return (
              <button
                key={d.name}
                disabled={isLoaded || loading}
                onClick={() => handleSampleDoc(d)}
                className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition flex items-center gap-2 ${
                  isLoaded
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 opacity-90"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-sky-700" />
                <span>{d.type}</span>
                {isLoaded && <Check className="h-3 w-3 text-emerald-700" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm All Toolbar */}
      {hasUnconfirmedFields && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Pending Fields Detected:</span> Review extracted data below or confirm all valid items simultaneously.
          </div>
          <button
            onClick={handleConfirmAll}
            disabled={confirmingAll || loading}
            className="cyber-button text-xs py-2 px-4"
          >
            {confirmingAll ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Confirming All...
              </span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm All Extracted Fields
              </>
            )}
          </button>
        </div>
      )}

      {/* Uploaded Documents List */}
      <div className="space-y-6">
        {docs.length === 0 && !loading && (
          <div className="card-surface p-12 text-center text-slate-500 space-y-3 shadow-sm">
            <FileText className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No documents uploaded yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload a household policy file or load a synthetic sample above to test automated field extraction.
            </p>
          </div>
        )}

        {docs.map((doc) => (
          <div key={doc.id} className="card-surface p-6 space-y-4 shadow-sm">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 font-display">
                    {doc.document_type || "Extracted Household Document"}
                  </h3>
                  <p className="font-mono text-xs text-slate-500 mt-0.5">
                    {doc.filename} ·{" "}
                    <span className="text-sky-800 uppercase font-bold">{doc.upload_status}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleRemoveDoc(doc.id)}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-700 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove Document
              </button>
            </div>

            {/* Empty fields */}
            {doc.fields.length === 0 && (
              <p className="text-xs text-slate-500 py-2">
                No key-value fields detected in this file. Try uploading a text document containing lines like "Policy: 123".
              </p>
            )}

            {/* Extracted Fields Table/List */}
            <div className="divide-y divide-slate-100">
              {doc.fields.map((f) => (
                <FieldRow key={f.id} f={f} onRefresh={refreshData} />
>>>>>>> Stashed changes
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

<<<<<<< Updated upstream
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
=======
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
    <div className="grid items-center gap-4 py-3.5 text-xs md:grid-cols-[180px_1fr_100px_auto]">
      {/* Field Label & Category */}
      <div>
        <div className="font-semibold text-slate-900">{f.field_label}</div>
        <div className="eyebrow text-[0.6rem] text-sky-700 mt-0.5">
          {f.readiness_dimension || "General Asset"}
        </div>
      </div>

      {/* Extracted Value Input */}
      <div>
        <input
          value={val}
          disabled={isConfirmed || submitting}
          onChange={(e) => setVal(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-slate-800 disabled:border-transparent disabled:bg-transparent disabled:text-slate-600"
        />
      </div>

      {/* Confidence Indicator */}
      <div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[0.7rem] font-semibold border ${
            high
              ? "bg-sky-50 border-sky-200 text-sky-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          {high ? "HIGH" : "LOW"} {Math.round(confidence * 100)}%
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isConfirmed ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-800 font-semibold font-mono text-[0.7rem]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> CONFIRMED
          </span>
        ) : isRejected ? (
          <span className="flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-red-800 font-semibold font-mono text-[0.7rem]">
            <XCircle className="h-3.5 w-3.5 text-red-600" /> REJECTED
          </span>
        ) : (
          <>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="cyber-button text-xs py-1.5 px-3"
            >
              Confirm
            </button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
            >
              Reject
            </button>
          </>
        )}
      </div>
>>>>>>> Stashed changes
    </div>
  );
}

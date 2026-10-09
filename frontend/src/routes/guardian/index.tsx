import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  apiCreateGuardianReleaseRequest,
  apiGetGuardianReleaseRequests,
  type GuardianReleaseRequest,
  type GuardianReleaseSummary,
} from "@/lib/api";
import {
  LockKeyhole,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Shield,
  ChevronRight,
  RefreshCw,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/guardian/")({
  head: () => ({
    meta: [
      { title: "Guardian Vault Release — Continuum" },
      {
        name: "description",
        content: "Request controlled household vault release through Guardian approvals.",
      },
    ],
  }),
  component: GuardianReleasePage,
});

function GuardianReleasePage() {
  const [requests, setRequests] = useState<GuardianReleaseSummary[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<GuardianReleaseRequest | null>(null);

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetGuardianReleaseRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to load release requests:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Guardian release requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const createRequest = async () => {
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const request = await apiCreateGuardianReleaseRequest(reason.trim());
      setReason("");
      setSuccess("Vault release request registered. Authorized Guardians can now review and vote.");
      setSelectedRequest(request);
      await loadRequests();
    } catch (err) {
      console.error("Failed to create release request:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create Guardian release request."
      );
    } finally {
      setCreating(false);
    }
  };

  const viewRequest = async (requestId: string) => {
    try {
      setLoadingRequest(requestId);
      setError(null);
      const { apiGetGuardianReleaseRequest } = await import("@/lib/api");
      const request = await apiGetGuardianReleaseRequest(requestId);
      setSelectedRequest(request);
    } catch (err) {
      console.error("Failed to load release request:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load release request details."
      );
    } finally {
      setLoadingRequest(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "released":
        return (
          <span className="flex items-center gap-1 font-mono text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> VAULT RELEASED
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 font-mono text-xs text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full font-semibold">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> AWAITING VOTES
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 font-mono text-xs text-red-800 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full font-semibold">
            <XCircle className="h-3.5 w-3.5 text-red-600" /> REJECTED
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <p className="eyebrow flex items-center gap-2">
          <LockKeyhole className="h-3.5 w-3.5 text-sky-600" />
          Contingency Vault Release Protocol · 2-of-3 Model
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-slate-900 font-display">
          Controlled Vault Release Protocol
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
          Initiate a threshold release sequence. Under Continuum's multi-party protocol, no single individual can release the vault independently — at least two authorized Guardians must affirmatively cast their approval vote.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Create Release Request Form */}
      <section className="card-surface p-6 sm:p-7 space-y-5">
        <div>
          <div className="eyebrow">Initiate Sequence</div>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 font-display">
            Start a Threshold Approval Request
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Continuum will record the request on the audit log and allow designated Guardians to vote through their keyholder portals.
          </p>
        </div>

        <div>
          <label htmlFor="release-reason" className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2">
            Reason for Vault Release <span className="text-slate-500">(Optional context for Guardians)</span>
          </label>
          <textarea
            id="release-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="e.g. Activating household contingency procedures..."
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-900 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition"
          />
          <div className="mt-1 text-right text-[0.68rem] font-mono text-slate-500">
            {reason.length}/500
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="button"
            onClick={createRequest}
            disabled={creating}
            className="cyber-button text-xs py-2.5 px-5"
          >
            {creating ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Submitting Request...
              </span>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Request Vault Release
              </>
            )}
          </button>
          <span className="text-xs font-mono text-slate-600 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-sky-700" />
            Requires 2 of 3 Guardian Approvals
          </span>
        </div>
      </section>

      {/* Release History List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Audit Ledger</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900 font-display">
              Release Request History
            </h2>
          </div>
          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Log
          </button>
        </div>

        {loading ? (
          <div className="card-surface p-8 text-center text-xs text-slate-500">
            Loading release audit ledger...
          </div>
        ) : requests.length === 0 ? (
          <div className="card-surface p-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">No release requests have been initiated yet.</p>
            <p className="text-slate-500">Use the form above to initiate a threshold authorization sequence.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <button
                key={req.id}
                type="button"
                onClick={() => viewRequest(req.id)}
                className="card-surface card-surface-hover w-full p-5 text-left transition space-y-4 block"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      {statusBadge(req.status)}
                      <span className="font-mono text-xs text-slate-500">ID: {req.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold font-mono text-emerald-700">{req.approved_count}</p>
                      <p className="text-[0.65rem] font-mono text-slate-500 uppercase">Approved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold font-mono text-amber-700">{req.pending_count}</p>
                      <p className="text-[0.65rem] font-mono text-slate-500 uppercase">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold font-mono text-red-700">{req.rejected_count}</p>
                      <p className="text-[0.65rem] font-mono text-slate-500 uppercase">Rejected</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[0.7rem] font-mono text-slate-500 pt-3 border-t border-slate-100">
                  <span>Created {new Date(req.created_at).toLocaleString()}</span>
                  <span>Threshold Target: {req.threshold} Approvals</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Request Details Drawer Modal */}
      {selectedRequest && (
        <section className="card-surface p-6 border-slate-300 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="eyebrow">Approval Audit Detail</div>
              <h2 className="text-xl font-semibold text-slate-900 font-display">
                Request Voting Progress
              </h2>
            </div>
            <button
              onClick={() => setSelectedRequest(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1"
            >
              Close Details ✕
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-4 font-mono text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-slate-500">STATUS</span>
              <p className="mt-1 font-bold text-slate-900 uppercase">{selectedRequest.status}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-slate-500">TARGET</span>
              <p className="mt-1 font-bold text-sky-800">{selectedRequest.threshold} Approvals</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-slate-500">CAST VOTES</span>
              <p className="mt-1 font-bold text-emerald-800">{selectedRequest.approved_count} YES / {selectedRequest.rejected_count} NO</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-slate-500">PENDING</span>
              <p className="mt-1 font-bold text-amber-800">{selectedRequest.pending_count} Guardians</p>
            </div>
          </div>

          {selectedRequest.reason && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[0.65rem] font-mono text-slate-500 uppercase">Context Reason</p>
              <p className="mt-1 text-xs text-slate-800 leading-relaxed">{selectedRequest.reason}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="eyebrow">Individual Guardian Votes</p>
            <div className="space-y-2">
              {selectedRequest.approvals.map((app) => (
                <div key={app.guardian_id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3.5 text-xs shadow-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{app.guardian_name}</p>
                    <p className="text-[0.65rem] font-mono text-slate-500 mt-0.5">
                      {app.responded_at ? `Responded ${new Date(app.responded_at).toLocaleString()}` : "Awaiting Vote"}
                    </p>
                  </div>
                  <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                    app.status === "approved"
                      ? "text-emerald-800 bg-emerald-50 border border-emerald-200"
                      : app.status === "rejected"
                      ? "text-red-800 bg-red-50 border border-red-200"
                      : "text-amber-800 bg-amber-50 border border-amber-200"
                  }`}>
                    {app.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
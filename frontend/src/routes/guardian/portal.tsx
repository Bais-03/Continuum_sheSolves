import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Users,
  LockKeyhole,
  AlertCircle,
  Clock3,
  XCircle,
  Shield,
  RefreshCw,
  Info,
} from "lucide-react";

import {
  apiGetGuardianPortal,
  apiGetPendingGuardianReleaseRequests,
  apiGetGuardianReleaseRequest,
  apiApproveGuardianReleaseRequest,
  apiRejectGuardianReleaseRequest,
  type GuardianPortalResponse,
  type GuardianReleaseRequest,
} from "@/lib/api";

export const Route = createFileRoute("/guardian/portal")({
  head: () => ({
    meta: [
      { title: "Guardian Portal — Continuum" },
      {
        name: "description",
        content: "Authorized keyholder portal for multi-party contingency vault release.",
      },
    ],
  }),
  component: GuardianPortalPage,
});

function GuardianPortalPage() {
  const [portal, setPortal] = useState<GuardianPortalResponse | null>(null);

  const [pendingRequests, setPendingRequests] = useState<
    GuardianReleaseRequest[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null,
  );

  const [error, setError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPortal() {
      try {
        setLoading(true);
        setError("");
        const data = await apiGetGuardianPortal();
        if (mounted) {
          setPortal(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load Guardian Portal."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPortal();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadPendingRequests() {
      try {
        setLoadingRequests(true);
        setRequestError("");

        const summaries = await apiGetPendingGuardianReleaseRequests();
        const details = await Promise.all(
          summaries.map((request) =>
            apiGetGuardianReleaseRequest(request.id)
          )
        );

        if (mounted) {
          setPendingRequests(details);
        }
      } catch (err) {
        if (mounted) {
          setRequestError(
            err instanceof Error
              ? err.message
              : "Unable to load pending release requests."
          );
        }
      } finally {
        if (mounted) {
          setLoadingRequests(false);
        }
      }
    }

    loadPendingRequests();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshPendingRequests = async () => {
    try {
      setRequestError("");
      const summaries = await apiGetPendingGuardianReleaseRequests();
      const details = await Promise.all(
        summaries.map((request) =>
          apiGetGuardianReleaseRequest(request.id)
        )
      );
      setPendingRequests(details);
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? err.message
          : "Unable to refresh release requests."
      );
    }
  };

  const approveRequest = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      setRequestError("");
      setActionSuccess("");
      await apiApproveGuardianReleaseRequest(requestId);
      setActionSuccess("Your approval vote was recorded successfully.");
      await refreshPendingRequests();
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? err.message
          : "Unable to approve the release request."
      );
    } finally {
      setProcessingRequest(null);
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      setRequestError("");
      setActionSuccess("");
      await apiRejectGuardianReleaseRequest(requestId);
      setActionSuccess("Your rejection vote was recorded on the release ledger.");
      await refreshPendingRequests();
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? err.message
          : "Unable to reject the release request."
      );
    } finally {
      setProcessingRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-44 animate-pulse rounded-2xl bg-white border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !portal) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12 flex items-center justify-center">
        <div className="mx-auto max-w-md w-full">
          <div className="card-surface p-8 text-center space-y-4 border-slate-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-200">
              <AlertCircle className="h-6 w-6" />
            </div>

            <h1 className="text-xl font-semibold text-slate-900 font-display">
              Guardian Portal Restricted
            </h1>

            <p className="text-xs text-slate-600 leading-relaxed">
              {error || "This account is not currently linked to an active Guardian credential."}
            </p>

            <div className="pt-2">
              <Link
                to="/guardian"
                className="cyber-button text-xs py-2 px-4 inline-flex"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Overview
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const guardianRatio = `${portal.threshold} of ${portal.total_guardians}`;

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="eyebrow flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
              Multi-Party Threshold Verification · Keyholder Portal
            </div>

            <h1 className="mt-2 text-3xl font-semibold text-slate-900 font-display">
              Guardian Verification Portal
            </h1>

            <p className="mt-1 text-xs text-slate-600">
              Authorized release keyholder workspace for household continuity management.
            </p>
          </div>

          <Link
            to="/guardian"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" />
            Vault Release Log
          </Link>
        </div>

        {/* Welcome card */}
        <section className="card-surface p-7 border-slate-200 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-mono text-emerald-800 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ACTIVE GUARDIAN KEYHOLDER
              </div>

              <h2 className="text-2xl font-semibold text-slate-900 font-display">
                Welcome, {portal.name}
              </h2>

              <p className="mt-1 text-xs text-sky-700 font-mono font-medium">
                Designation: {portal.relationship}
              </p>

              {portal.email && (
                <p className="mt-1.5 text-xs font-mono text-slate-500">
                  {portal.email}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
                <LockKeyhole className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[0.65rem] font-mono text-slate-500 uppercase">
                  ACCESS SCHEME
                </p>

                <p className="mt-0.5 font-semibold text-slate-900 font-mono text-xs capitalize">
                  {portal.access_level} Verification Key
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Status & Responsibility Grid */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Vault Threshold Topology</p>

                <p className="mt-2 text-3xl font-bold font-mono text-slate-900">
                  {guardianRatio}
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  Guardians required to vote affirmatively before the vault can be released to successors.
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card-surface p-6 space-y-3">
            <p className="eyebrow">Your Assigned Responsibility</p>

            <div className="flex items-start gap-3 pt-1">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
              </div>

              <p className="text-xs leading-relaxed text-slate-700">
                {portal.responsibility}
              </p>
            </div>
          </div>
        </section>

        {/* Restricted Privacy Boundary */}
        <section className="rounded-xl border border-slate-200 bg-slate-100/70 p-5 space-y-2">
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 text-sky-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 font-mono">
              Zero-Knowledge Privacy Boundary
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            As a designated Guardian, you participate in the threshold authorization process when a release is initiated. Under Continuum's zero-knowledge security architecture, your credential does not grant access to the household's private files, balances, documents, or knowledge graph.
          </p>
        </section>

        {/* Release Requests for this Guardian */}
        <section className="card-surface p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-sky-600" />
                <h3 className="text-lg font-semibold text-slate-900 font-display">
                  Pending Release Requests
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Review and cast your cryptographic authorization vote on release requests assigned to your key.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshPendingRequests}
              disabled={loadingRequests}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingRequests ? "animate-spin" : ""}`} />
              {loadingRequests ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {actionSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {requestError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {requestError}
            </div>
          )}

          {loadingRequests ? (
            <div className="animate-pulse space-y-3">
              <div className="h-28 rounded-xl bg-slate-100" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
              <LockKeyhole className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No Pending Release Requests</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active vault release requests require your authorization at this time. When a request is submitted by the household owner, it will appear here for your vote.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const isProcessing = processingRequest === request.id;

                return (
                  <div
                    key={request.id}
                    className="rounded-xl border border-amber-200 bg-amber-50/40 p-6 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <span className="cyber-badge text-amber-800 bg-amber-100 border-amber-300">
                          <Clock3 className="h-3.5 w-3.5 text-amber-700" />
                          APPROVAL VOTE REQUIRED
                        </span>

                        <h4 className="mt-3 text-base font-semibold text-slate-900 font-display">
                          Household Vault Release Authorization
                        </h4>

                        <p className="mt-1 font-mono text-xs text-slate-500">
                          Request Reference: {request.id}
                        </p>
                      </div>

                      <div className="sm:text-right font-mono text-xs">
                        <span className="text-slate-500">THRESHOLD PROGRESS</span>
                        <p className="text-lg font-bold text-slate-900 mt-0.5">
                          {request.approved_count} / {request.threshold} YES
                        </p>
                      </div>
                    </div>

                    {request.reason && (
                      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-1">
                        <p className="text-[0.65rem] font-mono text-slate-500 uppercase">
                          Stated Request Reason
                        </p>
                        <p className="text-xs text-slate-800 leading-relaxed">
                          {request.reason}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => approveRequest(request.id)}
                        disabled={isProcessing}
                        className="cyber-button text-xs py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 border-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isProcessing ? "Recording Vote..." : "Approve Vault Release"}
                      </button>

                      <button
                        type="button"
                        onClick={() => rejectRequest(request.id)}
                        disabled={isProcessing}
                        className="rounded-lg border border-red-200 bg-white px-5 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition"
                      >
                        <XCircle className="h-4 w-4" />
                        {isProcessing ? "Recording Vote..." : "Reject Release Request"}
                      </button>
                    </div>

                    <p className="text-[0.68rem] text-slate-500 font-mono flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                      Your authorization vote is cryptographically signed and stored in the release audit ledger.
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
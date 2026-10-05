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
              : "Unable to load Guardian Portal.",
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

        // Fetch full request details so the Guardian can see
        // the reason and the approval status of every Guardian.
        const details = await Promise.all(
          summaries.map((request) =>
            apiGetGuardianReleaseRequest(request.id),
          ),
        );

        if (mounted) {
          setPendingRequests(details);
        }
      } catch (err) {
        if (mounted) {
          setRequestError(
            err instanceof Error
              ? err.message
              : "Unable to load pending release requests.",
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
          apiGetGuardianReleaseRequest(request.id),
        ),
      );

      setPendingRequests(details);
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? err.message
          : "Unable to refresh release requests.",
      );
    }
  };

  const approveRequest = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      setRequestError("");

      await apiApproveGuardianReleaseRequest(requestId);

      await refreshPendingRequests();
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? err.message
          : "Unable to approve the release request.",
      );
    } finally {
      setProcessingRequest(null);
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      setRequestError("");

      await apiRejectGuardianReleaseRequest(requestId);

      await refreshPendingRequests();
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? err.message
          : "Unable to reject the release request.",
      );
    } finally {
      setProcessingRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-slate-200" />
            <div className="h-40 rounded-2xl bg-slate-200" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-48 rounded-2xl bg-slate-200" />
              <div className="h-48 rounded-2xl bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !portal) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>

            <h1 className="text-xl font-semibold text-slate-900">
              Guardian Portal unavailable
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              {error ||
                "This account is not associated with an active Guardian."}
            </p>

            <Link
              to="/guardian"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const guardianRatio = `${portal.threshold} of ${portal.total_guardians}`;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              Continuum
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Guardian Portal
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Your role in the household continuity process.
            </p>
          </div>

          <Link
            to="/guardian"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        {/* Welcome card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active Guardian
              </div>

              <h2 className="text-2xl font-semibold text-slate-900">
                Welcome, {portal.name}
              </h2>

              <p className="mt-1 text-slate-600">{portal.relationship}</p>

              {portal.email && (
                <p className="mt-3 text-sm text-slate-500">
                  {portal.email}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                <LockKeyhole className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Access Level
                </p>

                <p className="mt-1 font-semibold capitalize text-slate-900">
                  {portal.access_level}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Protection status */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Vault Protection
                </p>

                <p className="mt-3 text-4xl font-semibold text-slate-900">
                  {guardianRatio}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Guardians required for the controlled release process.
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Users className="h-5 w-5 text-slate-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Your Responsibility
            </p>

            <div className="mt-4 flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>

              <p className="text-sm leading-6 text-slate-700">
                {portal.responsibility}
              </p>
            </div>
          </div>
        </section>

        {/* Privacy boundary */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <ShieldCheck className="h-5 w-5 text-slate-700" />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Restricted Guardian Access
              </h3>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Your Guardian account is intentionally separated from the
                household workspace. You can participate in the controlled
                release process when required, but you cannot access private
                household documents, readiness scores, or the household
                knowledge graph.
              </p>
            </div>
          </div>
        </section>

        {/* Guardian Release Requests */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-slate-700" />

                <h3 className="font-semibold text-slate-900">
                  Release Requests
                </h3>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                Review and respond to controlled household vault-release
                requests assigned to you.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshPendingRequests}
              disabled={loadingRequests}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingRequests ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {requestError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {requestError}
            </div>
          )}

          {loadingRequests ? (
            <div className="mt-6 animate-pulse space-y-3">
              <div className="h-28 rounded-xl bg-slate-100" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <div className="flex items-center gap-3">
                <LockKeyhole className="h-5 w-5 text-slate-500" />

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    No pending release request
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    You will see a request here when the household initiates a
                    controlled vault release.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {pendingRequests.map((request) => {
                const isProcessing = processingRequest === request.id;

                return (
                  <div
                    key={request.id}
                    className="rounded-xl border border-amber-200 bg-amber-50/40 p-5"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                            <Clock3 className="h-3.5 w-3.5" />
                            Approval required
                          </div>

                          <h4 className="mt-3 font-semibold text-slate-900">
                            Household vault release request
                          </h4>

                          <p className="mt-1 font-mono text-xs text-slate-500">
                            {request.id}
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-xs text-slate-500">
                            Approval threshold
                          </p>

                          <p className="mt-1 text-lg font-semibold text-slate-900">
                            {request.approved_count}/{request.threshold}
                          </p>

                          <p className="text-xs text-slate-500">
                            approvals
                          </p>
                        </div>
                      </div>

                      {request.reason && (
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Request reason
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {request.reason}
                          </p>
                        </div>
                      )}

                      <div className="grid gap-3 text-sm sm:grid-cols-3">
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-500">Approved</p>
                          <p className="mt-1 font-semibold text-emerald-700">
                            {request.approved_count}
                          </p>
                        </div>

                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-500">Pending</p>
                          <p className="mt-1 font-semibold text-amber-700">
                            {request.pending_count}
                          </p>
                        </div>

                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-500">Rejected</p>
                          <p className="mt-1 font-semibold text-red-700">
                            {request.rejected_count}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-amber-200 pt-4 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => approveRequest(request.id)}
                          disabled={isProcessing}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />

                          {isProcessing ? "Processing…" : "Approve release"}
                        </button>

                        <button
                          type="button"
                          onClick={() => rejectRequest(request.id)}
                          disabled={isProcessing}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />

                          {isProcessing ? "Processing…" : "Reject release"}
                        </button>
                      </div>

                      <div className="text-xs leading-5 text-slate-500">
                        You are only approving the release request. You do not
                        receive access to the household's private documents,
                        readiness scores, or knowledge graph.
                      </div>
                    </div>
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
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  apiCreateGuardianReleaseRequest,
  apiGetGuardianReleaseRequests,
  type GuardianReleaseRequest,
  type GuardianReleaseSummary,
} from "@/lib/api";

export const Route = createFileRoute("/guardian/")({
  head: () => ({
    meta: [
      { title: "Guardian Release — Continuum" },
      {
        name: "description",
        content:
          "Request controlled household vault release through Guardian approvals.",
      },
      {
        property: "og:title",
        content: "Guardian Release — Continuum",
      },
      {
        property: "og:description",
        content:
          "Request controlled household vault release through Guardian approvals.",
      },
    ],
  }),
  component: Guardian,
});

function Guardian() {
  const [requests, setRequests] = useState<GuardianReleaseSummary[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<GuardianReleaseRequest | null>(null);

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
          : "Unable to load Guardian release requests.",
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

      const request = await apiCreateGuardianReleaseRequest(
        reason.trim(),
      );

      setReason("");
      setSuccess(
        "Release request created. Your Guardians must now approve the request.",
      );

      setSelectedRequest(request);

      await loadRequests();
    } catch (err) {
      console.error("Failed to create release request:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create Guardian release request.",
      );
    } finally {
      setCreating(false);
    }
  };

  const viewRequest = async (requestId: string) => {
    try {
      setLoadingRequest(requestId);
      setError(null);

      // The list endpoint already contains the main status information.
      // Fetching the full request gives us individual Guardian approvals.
      const { apiGetGuardianReleaseRequest } = await import("@/lib/api");

      const request = await apiGetGuardianReleaseRequest(requestId);

      setSelectedRequest(request);
    } catch (err) {
      console.error("Failed to load release request:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load release request details.",
      );
    } finally {
      setLoadingRequest(null);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "released":
        return "Released";
      case "pending":
        return "Awaiting approvals";
      case "expired":
        return "Expired";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const statusClass = (status: string) => {
    switch (status) {
      case "released":
        return "text-green-600";
      case "pending":
        return "text-amber-600";
      case "expired":
      case "rejected":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="eyebrow">2-of-3 Guardian threshold</p>

        <h1 className="mt-2 text-4xl">
          No single person can open the vault. Any two can.
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Request a controlled vault release. Your selected Guardians do not
          receive access to household documents — they only approve or reject
          the release request.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="card-surface border-destructive p-6 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="card-surface border-green-500 p-6 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* Create request */}
      <section className="card-surface p-6">
        <div className="eyebrow mb-2">Request vault release</div>

        <h2 className="font-display text-2xl">
          Start a Guardian approval request
        </h2>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Continuum will notify the configured Guardians. At least two active
          Guardians must approve before the vault can be released.
        </p>

        <div className="mt-6">
          <label
            htmlFor="release-reason"
            className="mb-2 block text-sm font-medium"
          >
            Reason <span className="text-muted-foreground">(optional)</span>
          </label>

          <textarea
            id="release-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Example: I need to activate the household continuity plan."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="mt-1 text-right text-xs text-muted-foreground">
            {reason.length}/500
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            onClick={createRequest}
            disabled={creating}
            className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground disabled:opacity-40"
          >
            {creating ? "Creating request…" : "Request vault release"}
          </button>

          <span className="text-sm text-muted-foreground">
            Requires 2 Guardian approvals
          </span>
        </div>
      </section>

      {/* Existing requests */}
      <section>
        <div className="mb-4">
          <p className="eyebrow">Release history</p>

          <h2 className="mt-1 font-display text-2xl">
            Guardian release requests
          </h2>
        </div>

        {loading ? (
          <div className="card-surface p-6 text-sm text-muted-foreground">
            Loading release requests…
          </div>
        ) : requests.length === 0 ? (
          <div className="card-surface p-6 text-sm text-muted-foreground">
            No Guardian release requests have been created yet.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => viewRequest(request.id)}
                className="card-surface w-full p-5 text-left transition hover:bg-muted"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="eyebrow">Release request</div>

                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      {request.id}
                    </div>

                    <div
                      className={`mt-2 text-sm font-medium ${statusClass(
                        request.status,
                      )}`}
                    >
                      {statusLabel(request.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-xl font-semibold">
                        {request.approved_count}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Approved
                      </div>
                    </div>

                    <div>
                      <div className="text-xl font-semibold">
                        {request.pending_count}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pending
                      </div>
                    </div>

                    <div>
                      <div className="text-xl font-semibold">
                        {request.rejected_count}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Rejected
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {request.approved_count}/{request.threshold} approvals
                  </div>
                </div>

                <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                  Created{" "}
                  {new Date(request.created_at).toLocaleString()}
                  {request.expires_at && (
                    <>
                      {" · "}Expires{" "}
                      {new Date(request.expires_at).toLocaleString()}
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Selected request */}
      {selectedRequest && (
        <section className="card-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Request details</div>

              <h2 className="mt-1 font-display text-2xl">
                Guardian approvals
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setSelectedRequest(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div
                className={`mt-1 font-medium ${statusClass(
                  selectedRequest.status,
                )}`}
              >
                {statusLabel(selectedRequest.status)}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Threshold</div>
              <div className="mt-1 font-medium">
                {selectedRequest.threshold}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Approved</div>
              <div className="mt-1 font-medium">
                {selectedRequest.approved_count}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Pending</div>
              <div className="mt-1 font-medium">
                {selectedRequest.pending_count}
              </div>
            </div>
          </div>

          {selectedRequest.reason && (
            <div className="mt-6">
              <div className="text-xs text-muted-foreground">
                Request reason
              </div>

              <div className="mt-1 text-sm">{selectedRequest.reason}</div>
            </div>
          )}

          <div className="mt-6">
            <div className="eyebrow mb-3">Guardian responses</div>

            <div className="space-y-3">
              {selectedRequest.approvals.map((approval) => (
                <div
                  key={approval.guardian_id}
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div>
                    <div className="font-medium">
                      {approval.guardian_name}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {approval.responded_at
                        ? `Responded ${new Date(
                            approval.responded_at,
                          ).toLocaleString()}`
                        : "Awaiting response"}
                    </div>
                  </div>

                  <div
                    className={`text-sm font-medium ${statusClass(
                      approval.status,
                    )}`}
                  >
                    {approval.status === "approved"
                      ? "✓ Approved"
                      : approval.status === "rejected"
                        ? "Rejected"
                        : "Pending"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {loadingRequest && (
        <div className="text-sm text-muted-foreground">
          Loading request details…
        </div>
      )}

      {/* Security explanation */}
      <section className="card-surface p-6">
        <div className="eyebrow mb-2">Continuum protection</div>

        <h2 className="font-display text-xl">
          Guardians approve. They do not browse.
        </h2>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Guardians only receive the minimum information required to approve
          or reject a release request. Household documents, readiness scores,
          and the knowledge graph remain private to the household.
        </p>
      </section>
    </div>
  );
}
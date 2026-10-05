import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  apiCreateGuardian,
  apiDeleteGuardian,
  apiGetGuardians,
  apiInviteGuardian,
  apiUpdateGuardian,
  type GuardianConfig,
  type GuardianInfo,
  type GuardianInvitationResponse,
} from "@/lib/api";

export const Route = createFileRoute("/guardians")({
  head: () => ({
    meta: [
      { title: "Manage Guardians — Continuum" },
      {
        name: "description",
        content:
          "Add and manage the trusted Guardians who protect your Continuum vault.",
      },
      {
        property: "og:title",
        content: "Manage Guardians — Continuum",
      },
      {
        property: "og:description",
        content:
          "Manage the trusted Guardians who protect your Continuum vault.",
      },
    ],
  }),
  component: Guardians,
});

type GuardianForm = {
  name: string;
  relationship: string;
  email: string;
  phone: string;
};

const EMPTY_FORM: GuardianForm = {
  name: "",
  relationship: "",
  email: "",
  phone: "",
};

function Guardians() {
  const [config, setConfig] = useState<GuardianConfig | null>(null);
  const [form, setForm] = useState<GuardianForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const [invitation, setInvitation] =
    useState<GuardianInvitationResponse | null>(null);

  /*
   * Used to automatically scroll to the invitation card
   * after an invitation is successfully created.
   */
  const invitationRef = useRef<HTMLDivElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadGuardians() {
    try {
      setLoading(true);
      setError(null);

      const data = await apiGetGuardians();
      setConfig(data);
    } catch (err) {
      console.error("Failed to load Guardians:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Guardian configuration.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGuardians();
  }, []);

  /*
   * Whenever a new invitation is created, smoothly scroll
   * the invitation card into the user's viewport.
   */
  useEffect(() => {
    if (!invitation) {
      return;
    }

    invitationRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [invitation]);

  const updateForm = (
    field: keyof GuardianForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const submitGuardian = async () => {
    if (!form.name.trim() || !form.relationship.trim()) {
      setError("Name and relationship are required.");
      return;
    }

    if (!editingId && config && config.guardians.length >= 3) {
      setError(
        "The current prototype supports a maximum of 3 Guardians.",
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      setInvitation(null);

      if (editingId) {
        const updatePayload = {
          name: form.name.trim(),
          relationship: form.relationship.trim(),
          ...(form.email.trim()
            ? { email: form.email.trim() }
            : {}),
          ...(form.phone.trim()
            ? { phone: form.phone.trim() }
            : {}),
        };

        await apiUpdateGuardian(editingId, updatePayload);

        setMessage("Guardian updated successfully.");
      } else {
        const createPayload = {
          name: form.name.trim(),
          relationship: form.relationship.trim(),
          ...(form.email.trim()
            ? { email: form.email.trim() }
            : {}),
          ...(form.phone.trim()
            ? { phone: form.phone.trim() }
            : {}),
        };

        await apiCreateGuardian(createPayload);

        setMessage("Guardian added successfully.");
      }

      resetForm();
      await loadGuardians();
    } catch (err) {
      console.error("Failed to save Guardian:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save Guardian.",
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (guardian: GuardianInfo) => {
    setError(null);
    setMessage(null);
    setInvitation(null);

    setEditingId(guardian.id);

    setForm({
      name: guardian.name,
      relationship: guardian.relationship,
      email: guardian.email ?? "",
      phone: guardian.phone ?? "",
    });
  };

  const removeGuardian = async (guardian: GuardianInfo) => {
    const confirmed = window.confirm(
      `Remove ${guardian.name} as a Guardian?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(guardian.id);
      setError(null);
      setMessage(null);
      setInvitation(null);

      await apiDeleteGuardian(guardian.id);

      if (editingId === guardian.id) {
        resetForm();
      }

      setMessage(`${guardian.name} was removed as a Guardian.`);

      await loadGuardians();
    } catch (err) {
      console.error("Failed to remove Guardian:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove Guardian.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const inviteGuardian = async (guardian: GuardianInfo) => {
    /*
     * Prevent duplicate invitation requests if the user
     * clicks Invite multiple times while the first request
     * is still being processed.
     */
    if (invitingId) {
      return;
    }

    if (!guardian.email) {
      setError(
        `Add an email address for ${guardian.name} before sending an invitation.`,
      );
      return;
    }

    try {
      setInvitingId(guardian.id);
      setError(null);
      setMessage(null);
      setInvitation(null);

      const result = await apiInviteGuardian(guardian.id);

      setInvitation(result);
      setMessage(
        `Invitation created for ${guardian.name}.`,
      );
    } catch (err) {
      console.error("Failed to invite Guardian:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create Guardian invitation.",
      );
    } finally {
      setInvitingId(null);
    }
  };

  const copyInvitationLink = async () => {
    if (!invitation?.invitation_link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        invitation.invitation_link,
      );

      setMessage("Invitation link copied to clipboard.");
    } catch (err) {
      console.error("Failed to copy invitation link:", err);

      setError(
        "Unable to copy the invitation link. Please copy it manually.",
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="eyebrow">
          Guardian management · 2-of-3 threshold
        </p>

        <h1 className="mt-2 text-4xl">
          Choose who protects your continuity.
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Add trusted people who can participate in the Guardian
          release process. Guardians do not automatically receive
          access to your household information.
        </p>
      </div>

      {/* Status messages */}
      {error && (
        <div className="card-surface border-destructive p-5 text-sm text-destructive">
          {error}
        </div>
      )}

      {message && (
        <div className="card-surface border-primary p-5 text-sm">
          {message}
        </div>
      )}

      {/* Invitation result */}
      {invitation && (
        <div
          ref={invitationRef}
          className="card-surface border-primary p-6"
        >
          <div className="eyebrow">
            Guardian invitation created
          </div>

          <h2 className="mt-2 font-display text-2xl">
            Share this invitation with the Guardian
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            This invitation expires on{" "}
            {new Date(invitation.expires_at).toLocaleString()}.
          </p>

          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <input
              readOnly
              value={invitation.invitation_link}
              className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none"
            />

            <button
              type="button"
              onClick={copyInvitationLink}
              className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground whitespace-nowrap"
            >
              Copy link
            </button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            For this local prototype, the invitation link can be
            opened directly in the browser.
          </p>
        </div>
      )}

      {/* Guardian overview */}
      <div className="card-surface p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="eyebrow">Guardian threshold</div>

            <div className="mt-2 font-display text-2xl">
              {config
                ? `${config.guardians.length} Guardian${
                    config.guardians.length === 1 ? "" : "s"
                  } configured`
                : "Loading Guardians…"}
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Any {config?.threshold ?? 2} active Guardians are
              required for the current release prototype.
            </p>
          </div>

          <div className="rounded-md border px-4 py-3 text-sm">
            <div className="font-medium">Current model</div>

            <div className="mt-1 text-muted-foreground">
              2 of 3 Guardians
            </div>
          </div>
        </div>
      </div>

      {/* Add / edit Guardian */}
      <div className="card-surface p-6">
        <div>
          <div className="eyebrow">
            {editingId ? "Edit Guardian" : "Add Guardian"}
          </div>

          <h2 className="mt-2 font-display text-2xl">
            {editingId
              ? "Update Guardian details"
              : "Add someone you trust"}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {editingId
              ? "Update the information associated with this Guardian."
              : "Add a trusted person who may participate in a future vault release."}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">
              Full name *
            </span>

            <input
              value={form.name}
              onChange={(event) =>
                updateForm("name", event.target.value)
              }
              placeholder="e.g. Meera Sharma"
              className="w-full rounded-md border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Relationship *
            </span>

            <input
              value={form.relationship}
              onChange={(event) =>
                updateForm(
                  "relationship",
                  event.target.value,
                )
              }
              placeholder="e.g. Mother, Brother, CA"
              className="w-full rounded-md border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Email
            </span>

            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                updateForm("email", event.target.value)
              }
              placeholder="guardian@example.com"
              className="w-full rounded-md border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Phone
            </span>

            <input
              type="tel"
              value={form.phone}
              onChange={(event) =>
                updateForm("phone", event.target.value)
              }
              placeholder="+91 XXXXX XXXXX"
              className="w-full rounded-md border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={submitGuardian}
            disabled={saving}
            className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground disabled:opacity-40"
          >
            {saving
              ? "Saving…"
              : editingId
                ? "Save changes"
                : "Add Guardian"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="rounded-md border px-5 py-2.5 disabled:opacity-40"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Guardian list */}
      <div>
        <div className="mb-4">
          <div className="eyebrow">Your Guardians</div>

          <h2 className="mt-2 font-display text-2xl">
            Trusted people
          </h2>
        </div>

        {loading ? (
          <div className="card-surface p-6 text-sm text-muted-foreground">
            Loading Guardians…
          </div>
        ) : config && config.guardians.length === 0 ? (
          <div className="card-surface p-8">
            <div className="eyebrow">No Guardians yet</div>

            <h3 className="mt-2 font-display text-xl">
              Your Guardian network is empty.
            </h3>

            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Add trusted people above. For the current prototype,
              the release mechanism is designed around a 2-of-3
              Guardian threshold.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {config?.guardians.map((guardian, index) => (
              <div
                key={guardian.id}
                className="card-surface p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="eyebrow">
                      Guardian G{index + 1}
                    </div>

                    <h3 className="mt-1 font-display text-lg">
                      {guardian.name}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {guardian.relationship}
                    </p>
                  </div>

                  <span className="rounded-full border px-2.5 py-1 text-xs">
                    {guardian.status}
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-sm">
                  {guardian.email && (
                    <div>
                      <span className="text-muted-foreground">
                        Email:{" "}
                      </span>
                      {guardian.email}
                    </div>
                  )}

                  {guardian.phone && (
                    <div>
                      <span className="text-muted-foreground">
                        Phone:{" "}
                      </span>
                      {guardian.phone}
                    </div>
                  )}

                  {!guardian.email && !guardian.phone && (
                    <div className="text-muted-foreground">
                      No contact details added.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(guardian)}
                    disabled={
                      deletingId === guardian.id ||
                      invitingId === guardian.id
                    }
                    className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => removeGuardian(guardian)}
                    disabled={
                      deletingId === guardian.id ||
                      invitingId === guardian.id
                    }
                    className="rounded-md border px-3 py-2 text-sm text-destructive hover:bg-muted disabled:opacity-40"
                  >
                    {deletingId === guardian.id
                      ? "Removing…"
                      : "Remove"}
                  </button>

                  <button
                    type="button"
                    onClick={() => inviteGuardian(guardian)}
                    disabled={
                      deletingId === guardian.id ||
                      invitingId !== null
                    }
                    className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40"
                  >
                    {invitingId === guardian.id
                      ? "Creating…"
                      : "Invite"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security note */}
      <div className="card-surface p-6">
        <div className="eyebrow mb-2">
          Privacy boundary
        </div>

        <p className="max-w-3xl text-sm text-muted-foreground">
          Adding someone as a Guardian does not give them access
          to your documents, readiness score, knowledge graph, or
          household records. The current prototype only records
          their Guardian relationship and uses them for the
          simulated threshold-release workflow.
        </p>
      </div>
    </div>
  );
}
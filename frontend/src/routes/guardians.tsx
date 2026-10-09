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
import {
  Users,
  ShieldCheck,
  UserPlus,
  Mail,
  Phone,
  Copy,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  Send,
  Lock,
  RefreshCw,
  ExternalLink,
  Shield,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/guardians")({
  head: () => ({
    meta: [
      { title: "Manage Guardians — Continuum" },
      {
        name: "description",
        content: "Configure and invite the trusted Guardians who protect your Continuum vault.",
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

  const [invitation, setInvitation] = useState<GuardianInvitationResponse | null>(null);
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
          : "Unable to load Guardian configuration."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGuardians();
  }, []);

  useEffect(() => {
    if (!invitation) return;
    invitationRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [invitation]);

  const updateForm = (field: keyof GuardianForm, value: string) => {
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
      setError("Continuum's threshold model currently supports a maximum of 3 Guardians.");
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
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        };
        await apiUpdateGuardian(editingId, updatePayload);
        setMessage("Guardian details updated successfully.");
      } else {
        const createPayload = {
          name: form.name.trim(),
          relationship: form.relationship.trim(),
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        };
        await apiCreateGuardian(createPayload);
        setMessage("Guardian registered successfully.");
      }

      resetForm();
      await loadGuardians();
    } catch (err) {
      console.error("Failed to save Guardian:", err);
      setError(
        err instanceof Error ? err.message : "Unable to save Guardian record."
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
      `Remove ${guardian.name} as a Guardian?`
    );
    if (!confirmed) return;

    try {
      setDeletingId(guardian.id);
      setError(null);
      setMessage(null);
      setInvitation(null);

      await apiDeleteGuardian(guardian.id);

      if (editingId === guardian.id) {
        resetForm();
      }

      setMessage(`${guardian.name} was removed from the Guardian network.`);
      await loadGuardians();
    } catch (err) {
      console.error("Failed to remove Guardian:", err);
      setError(
        err instanceof Error ? err.message : "Unable to remove Guardian."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const inviteGuardian = async (guardian: GuardianInfo) => {
    if (invitingId) return;

    if (!guardian.email) {
      setError(
        `Please specify an email address for ${guardian.name} before sending an invitation link.`
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
      setMessage(`Secure invitation link generated for ${guardian.name}.`);
    } catch (err) {
      console.error("Failed to invite Guardian:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate Guardian invitation link."
      );
    } finally {
      setInvitingId(null);
    }
  };

  // Ensure link uses the active browser origin (e.g. localhost:8080 or 8081)
  const getNormalizedLink = (rawLink: string) => {
    try {
      const url = new URL(rawLink);
      return `${window.location.origin}${url.pathname}${url.search}`;
    } catch {
      return rawLink;
    }
  };

  const activeInviteUrl = invitation ? getNormalizedLink(invitation.invitation_link) : "";

  const copyInvitationLink = async () => {
    if (!activeInviteUrl) return;
    try {
      await navigator.clipboard.writeText(activeInviteUrl);
      setMessage("Invitation link copied to clipboard.");
    } catch (err) {
      console.error("Failed to copy invitation link:", err);
      setError("Unable to auto-copy link. Please copy directly from the field.");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <p className="eyebrow flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-sky-600" />
          Multi-Party Threshold Cryptography · 2-of-3 Model
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-slate-900 font-display">
          Guardian Network Management
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
          Configure trusted individuals who participate in multi-party vault release verification. Guardians approve or reject release sequences, but never receive access to your private household documents.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Invitation Modal / Card */}
      {invitation && (
        <div
          ref={invitationRef}
          className="card-surface border-sky-300 bg-sky-50/40 p-6 space-y-4 shadow-md"
        >
          <div className="eyebrow flex items-center gap-2 text-sky-800">
            <Send className="h-3.5 w-3.5 text-sky-700" />
            Guardian Invitation Link Ready
          </div>

          <h2 className="text-xl font-semibold text-slate-900 font-display">
            Share this link with your Guardian
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            The Guardian will establish their personal authentication key through this link. This link expires on{" "}
            <span className="font-mono font-semibold text-slate-900">{new Date(invitation.expires_at).toLocaleString()}</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <input
              readOnly
              value={activeInviteUrl}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-mono text-slate-900 outline-none select-all"
            />
            
            <button
              type="button"
              onClick={copyInvitationLink}
              className="cyber-button text-xs py-2.5 px-4 whitespace-nowrap shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Link
            </button>

            <a
              href={activeInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
            >
              <ExternalLink className="h-3.5 w-3.5 text-sky-700" />
              Open Acceptance Page
            </a>
          </div>
        </div>
      )}

      {/* Threshold Status Banner */}
      <div className="card-surface p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="eyebrow">Threshold Topology</div>
            <h2 className="mt-1 text-2xl font-bold font-display text-slate-900">
              {config
                ? `${config.guardians.length} of 3 Guardians Configured`
                : "Loading Network State..."}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Any <span className="font-mono text-sky-800 font-bold">{config?.threshold ?? 2} active Guardians</span> are required to affirmatively authorize a vault release.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5">
            <Lock className="h-5 w-5 text-sky-700" />
            <div>
              <p className="text-[0.65rem] font-mono text-slate-500 uppercase">RELEASE SCHEME</p>
              <p className="text-xs font-semibold text-slate-900 font-mono">2 / 3 THRESHOLD VOTING</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Form */}
      <div className="card-surface p-6 sm:p-7 space-y-5 shadow-sm">
        <div>
          <div className="eyebrow">{editingId ? "Edit Guardian" : "Add New Guardian"}</div>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 font-display">
            {editingId ? "Update Guardian Details" : "Add a Trusted Contact"}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            {editingId
              ? "Modify details for this existing Guardian contact."
              : "Enter details for someone who will be eligible to approve contingency release requests."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              placeholder="e.g. Meera Sharma"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5">
              Relationship / Role *
            </label>
            <input
              value={form.relationship}
              onChange={(e) => updateForm("relationship", e.target.value)}
              placeholder="e.g. Sister, Family Attorney, Advisor"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
              placeholder="guardian@domain.com"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
              placeholder="+1 (555) 019-2834"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={submitGuardian}
            disabled={saving}
            className="cyber-button text-xs py-2.5 px-5"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </span>
            ) : editingId ? (
              "Save Changes"
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Add Guardian
              </>
            )}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Guardians Grid List */}
      <div>
        <div className="mb-4">
          <div className="eyebrow">Active Guardian Network</div>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900 font-display">
            Configured Guardians
          </h2>
        </div>

        {loading ? (
          <div className="card-surface p-8 text-center text-xs text-slate-500">
            Loading Guardian configuration...
          </div>
        ) : config && config.guardians.length === 0 ? (
          <div className="card-surface p-8 text-center space-y-3">
            <Users className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-900">No Guardians Added Yet</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Add up to 3 trusted people above. Two active Guardians will be required to approve any future vault release.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {config?.guardians.map((guardian, index) => (
              <div key={guardian.id} className="card-surface p-5 flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="eyebrow text-[0.62rem]">GUARDIAN G{index + 1}</span>
                      <h3 className="text-base font-semibold text-slate-900 font-display mt-0.5">
                        {guardian.name}
                      </h3>
                      <p className="text-xs text-slate-600">{guardian.relationship}</p>
                    </div>

                    <span className={`rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] uppercase font-semibold border ${
                      guardian.status === "active"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : guardian.status === "invited"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                      {guardian.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs font-mono text-slate-600">
                    {guardian.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{guardian.email}</span>
                      </div>
                    )}
                    {guardian.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{guardian.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(guardian)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => removeGuardian(guardian)}
                    disabled={deletingId === guardian.id}
                    className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>

                  <button
                    type="button"
                    onClick={() => inviteGuardian(guardian)}
                    disabled={invitingId === guardian.id}
                    className="cyber-button text-xs py-1.5 px-3 ml-auto"
                  >
                    {invitingId === guardian.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Invite
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Privacy Boundary Note */}
      <div className="card-surface p-6 shadow-sm border-slate-200">
        <div className="eyebrow mb-2">Cryptographic Privacy Boundary</div>
        <p className="text-xs leading-relaxed text-slate-600 max-w-3xl">
          Guardians never receive access to your raw documents, readiness scores, knowledge graph, or financial balances. They only act as keyholders in the multi-party release verification protocol when contingency activation is requested.
        </p>
      </div>
    </div>
  );
}
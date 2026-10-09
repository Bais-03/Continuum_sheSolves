import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";

import {
  apiAcceptGuardianInvitation,
  apiValidateGuardianInvitation,
  type GuardianInvitationValidationResponse,
} from "@/lib/api";
import { ContinuumMark } from "@/components/ui/ContinuumMark";

export const Route = createFileRoute(
  "/guardian/invite/$token",
)({
  head: () => ({
    meta: [
      {
        title: "Accept Guardian Invitation — Continuum",
      },
      {
        name: "description",
        content: "Secure multi-party threshold guardian invitation acceptance.",
      },
    ],
  }),
  component: GuardianInvitation,
});

function GuardianInvitation() {
  const { token } = Route.useParams();

  const [invitation, setInvitation] =
    useState<GuardianInvitationValidationResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function validateInvitation() {
      try {
        setLoading(true);
        setError(null);

        const result = await apiValidateGuardianInvitation(token);

        if (!cancelled) {
          setInvitation(result);
          if (result.guardian_name) {
            setFullName(result.guardian_name);
          }
        }
      } catch (err) {
        console.error("Failed to validate Guardian invitation:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to validate this invitation.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void validateInvitation();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your entries.");
      return;
    }

    try {
      setAccepting(true);

      const result = await apiAcceptGuardianInvitation(token, {
        full_name: fullName.trim(),
        password,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Failed to accept Guardian invitation:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete invitation acceptance.",
      );
    } finally {
      setAccepting(false);
    }
  };

  // ----------------------------------------------------------
  // Loading
  // ----------------------------------------------------------
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 flex items-center justify-center">
        <div className="card-surface w-full max-w-md p-8 text-center space-y-4">
          <ContinuumMark size={36} className="mx-auto" />
          <div className="eyebrow">Cryptographic Verification</div>
          <h1 className="text-xl font-semibold text-slate-900 font-display">
            Validating Guardian Invitation…
          </h1>
          <p className="text-xs text-slate-600">
            Checking invitation signature and expiration status against the vault repository.
          </p>
          <div className="pt-2">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // Validation request failed / Network error
  // ----------------------------------------------------------
  if (error && !invitation) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 flex items-center justify-center">
        <div className="card-surface w-full max-w-md p-8 text-center space-y-4 border-red-200">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-200">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="eyebrow text-red-700">Verification Failure</div>
          <h1 className="text-xl font-semibold text-slate-900 font-display">
            Invitation Link Unavailable
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error}
          </p>
          <p className="text-[0.7rem] text-slate-500">
            This invitation link may be malformed, expired, already accepted, or revoked by the household owner.
          </p>
          <div className="pt-2">
            <Link to="/login" className="cyber-button text-xs py-2 px-4 inline-flex">
              Return to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // Invalid invitation response (e.g. expired or already used)
  // ----------------------------------------------------------
  if (!invitation || !invitation.valid) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 flex items-center justify-center">
        <div className="card-surface w-full max-w-md p-8 text-center space-y-4 border-amber-200">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="eyebrow text-amber-700">Token Expired or Invalid</div>
          <h1 className="text-xl font-semibold text-slate-900 font-display">
            Invitation No Longer Valid
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            {invitation?.message ?? "This Guardian invitation has expired or has already been accepted."}
          </p>
          <div className="pt-2">
            <Link to="/login" className="cyber-button text-xs py-2 px-4 inline-flex">
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // Successful account creation
  // ----------------------------------------------------------
  if (success) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 flex items-center justify-center">
        <div className="card-surface w-full max-w-md p-8 text-center space-y-5 border-emerald-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <div>
            <div className="eyebrow text-emerald-700">Credentials Configured</div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 font-display">
              Guardian Credential Activated
            </h1>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              You are now registered as a designated Guardian keyholder for this household repository.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left space-y-1 font-mono text-xs">
            <div className="text-[0.65rem] text-slate-500 uppercase">Registered Identity</div>
            <p className="font-semibold text-slate-900">{invitation.guardian_name}</p>
            <p className="text-slate-600">{invitation.invited_email}</p>
          </div>

          <div className="pt-2">
            <Link
              to="/guardian/portal"
              className="cyber-button w-full py-3 text-xs font-semibold"
            >
              Enter Guardian Verification Portal <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // Invitation acceptance form
  // ----------------------------------------------------------
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 md:py-16">
      <div className="mx-auto max-w-lg">
        
        {/* Header */}
        <div className="mb-8 text-center space-y-3">
          <ContinuumMark size={44} className="mx-auto" />
          <div className="eyebrow">Threshold Security Protocol</div>
          <h1 className="text-3xl font-semibold text-slate-900 font-display">
            Guardian Onboarding
          </h1>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            You have been nominated as a trusted contingency Guardian. Establish your secure key credentials below to participate in multi-party vault release verification.
          </p>
        </div>

        {/* Card */}
        <div className="card-surface p-6 sm:p-8 space-y-6">
          
          {/* Guardian role info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Designated Guardian</span>
              <span className="rounded-full bg-sky-100 border border-sky-200 px-2.5 py-0.5 text-[0.65rem] font-mono font-semibold text-sky-800">
                2-OF-3 THRESHOLD
              </span>
            </div>
            
            <p className="text-base font-semibold text-slate-900">
              {invitation.guardian_name}
            </p>
            
            <div className="text-xs font-mono text-slate-600 space-y-0.5">
              <p>Email: {invitation.invited_email}</p>
              {invitation.expires_at && (
                <p className="text-[0.68rem] text-slate-500">
                  Invitation Valid Until: {new Date(invitation.expires_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-sky-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Zero-Knowledge Guarantee:</span> As a Guardian, you only authorize or reject release requests. You will never be granted access to private household assets, passwords, or documents.
            </div>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="full-name"
                className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="full-name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Confirm your name"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Create Guardian Key Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[0.68rem] text-slate-500">
                Minimum 8 characters. Used to authorize vault release requests.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Confirm Key Password
              </label>
              <input
                id="confirm-password"
                required
                type="password"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={accepting}
              className="cyber-button w-full py-3 text-xs font-semibold"
            >
              {accepting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Activating Credential…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Accept Guardian Role & Initialize
                </span>
              )}
            </button>
          </form>

        </div>
      </div>
    </main>
  );
}
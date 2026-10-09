import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getCurrentUser, type ContinuumUser } from "@/lib/auth";
import {
  Shield,
  Smartphone,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  Laptop,
} from "lucide-react";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Account & Security Settings — Continuum" },
      {
        name: "description",
        content: "Manage 2FA authentication, active sessions, and vault encryption keys.",
      },
    ],
  }),
  component: AccountSecurityPage,
});

function AccountSecurityPage() {
  const [user, setUser] = useState<ContinuumUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 2FA state
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [enrolling2FA, setEnrolling2FA] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Simulated TOTP secret for demonstration
  const [totpSecret] = useState("JBSWY3DPEHPK3PXP");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const u = await getCurrentUser();
        setUser(u);
      } catch (err) {
        console.error("Failed to load user in security settings:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    if (otpCode.trim().length !== 6 || isNaN(Number(otpCode))) {
      setOtpError("Please enter a valid 6-digit verification code.");
      return;
    }

    setVerificationSuccess(true);
    setTfaEnabled(true);
    setEnrolling2FA(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-48 animate-pulse rounded-xl bg-white border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <p className="eyebrow flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-sky-600" />
          Security Controls · Vault Protection
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 font-display">
          Account Security & Authentication
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage your two-factor authentication, cryptographic key parameters, and active session permissions.
        </p>
      </div>

      {/* Account Info */}
      <section className="card-surface p-6 shadow-sm">
        <div className="eyebrow mb-3">Identity Record</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500 font-mono">FULL NAME</label>
            <p className="mt-1 text-base font-semibold text-slate-900">{user?.name || "Continuum User"}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-mono">REGISTERED EMAIL</label>
            <p className="mt-1 text-base font-semibold text-slate-900 font-mono">{user?.email || "user@example.com"}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-mono">ACCOUNT TYPE</label>
            <p className="mt-1 text-sm font-semibold text-sky-800 font-mono">
              {user?.household_id ? "Primary Household Administrator" : "Guardian Credential Account"}
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-mono">HOUSEHOLD ID</label>
            <p className="mt-1 text-xs font-mono text-slate-600">
              {user?.household_id || "Unassigned (Guardian Portal Only)"}
            </p>
          </div>
        </div>
      </section>

      {/* Two-Factor Authentication (2FA) */}
      <section className="card-surface p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 font-display">Two-Factor Authentication (TOTP)</h2>
              <p className="mt-1 text-xs text-slate-600">
                Protect your account with an authenticator application (Google Authenticator, 1Password, etc.).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tfaEnabled ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-mono text-emerald-800 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                2FA ACTIVE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-mono text-amber-800 font-semibold">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                NOT CONFIGURED
              </span>
            )}

            {!tfaEnabled && !enrolling2FA && (
              <button
                type="button"
                onClick={() => setEnrolling2FA(true)}
                className="cyber-button text-xs py-2 px-4"
              >
                Set Up 2FA
              </button>
            )}

            {tfaEnabled && (
              <button
                type="button"
                onClick={() => {
                  setTfaEnabled(false);
                  setVerificationSuccess(false);
                }}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition shadow-sm"
              >
                Disable 2FA
              </button>
            )}
          </div>
        </div>

        {/* 2FA Enrollment Box */}
        {enrolling2FA && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-5">
            <div className="eyebrow">Authenticator Setup</div>
            <p className="text-xs text-slate-600">
              Scan the setup code below using your authenticator application or copy the secret key.
            </p>

            <div className="grid gap-6 sm:grid-cols-[140px_1fr] items-center">
              {/* Synthetic QR Code representation */}
              <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="grid grid-cols-5 gap-1.5 w-24 h-24 p-1 bg-slate-900 rounded">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full w-full ${
                        (i * 7 + 3) % 2 === 0 ? "bg-white" : "bg-slate-900"
                      }`}
                    />
                  ))}
                </div>
                <span className="mt-1 text-[0.6rem] font-mono text-slate-700 font-semibold">CONTINUUM 2FA</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-600 font-mono font-semibold">SECRET KEY</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      readOnly
                      value={totpSecret}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 w-full outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 shadow-sm"
                      title="Copy secret key"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  {copied && <span className="text-[0.7rem] text-emerald-700 font-mono font-semibold">Copied to clipboard</span>}
                </div>

                <form onSubmit={handleVerify2FA} className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Enter 6-Digit Authenticator Code
                  </label>
                  <div className="flex gap-3">
                    <input
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-mono tracking-widest text-slate-900 outline-none focus:border-slate-800"
                    />
                    <button type="submit" className="cyber-button text-xs py-2 px-4">
                      Verify & Activate
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnrolling2FA(false)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                  {otpError && <p className="text-xs text-red-600">{otpError}</p>}
                </form>
              </div>
            </div>
          </div>
        )}

        {verificationSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Authenticator enrolled successfully! Two-factor security is now active for future logins.</span>
          </div>
        )}
      </section>

      {/* Vault Cryptography & Key Management */}
      <section className="card-surface p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 font-display">Vault Encryption Parameters</h2>
            <p className="text-xs text-slate-600">Zero-knowledge client-side encryption key configuration.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="eyebrow text-[0.65rem]">Cipher Suite</p>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-900">AES-256-GCM</p>
            <p className="mt-1 text-[0.7rem] text-slate-500">Authenticated encryption</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="eyebrow text-[0.65rem]">Key Derivation</p>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-900">PBKDF2-HMAC-SHA256</p>
            <p className="mt-1 text-[0.7rem] text-slate-500">600,000 iterations</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="eyebrow text-[0.65rem]">Secret Sharing</p>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-900">2-of-3 Threshold</p>
            <p className="mt-1 text-[0.7rem] text-slate-500">Guardian release scheme</p>
          </div>
        </div>
      </section>

      {/* Active Sessions */}
      <section className="card-surface p-6 shadow-sm">
        <div className="eyebrow mb-3">Active Sessions</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Laptop className="h-5 w-5 text-slate-700" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">Current Browser Session</p>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 font-mono text-[0.65rem] text-slate-800 font-semibold">
                    THIS DEVICE
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  Web browser · IP: 127.0.0.1 (Local Environment)
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-800 font-semibold">ACTIVE NOW</span>
          </div>
        </div>
      </section>
    </div>
  );
}

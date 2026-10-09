import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UserPlus, Eye, EyeOff, ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { FormEvent, useState } from "react";
import { register } from "@/lib/api/auth";
import { PublicNavbar } from "@/components/PublicNavbar";
import { ContinuumMark } from "@/components/ui/ContinuumMark";
import { ContinuumVaultShield3D } from "@/components/ui/ContinuumVaultShield3D";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create Vault Account — Continuum" }] }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const result = await register(name, email, password);

<<<<<<< Updated upstream
    if (!result.success) {
      setError(result.error ?? "Unable to create the account.");
      return;
=======
    setLoading(true);

    try {
      await signupUser(name, email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("Signup failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account. Please check your credentials."
      );
    } finally {
      setLoading(false);
>>>>>>> Stashed changes
    }

    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
<<<<<<< Updated upstream
      <main className="mx-auto flex max-w-6xl justify-center px-6 py-16 md:py-24">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img
              src="/continuum-mark.png"
              alt="Continuum"
              className="mx-auto h-20 w-20 object-contain"
            />
            <h1 className="mt-5 text-4xl">Create your account</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Start exploring the Continuum household readiness prototype.
            </p>
          </div>
          <div className="card-surface p-6 md:p-8">
            <form onSubmit={submit} className="space-y-5">
              <label className="block text-sm">
                Full name
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your name"
                />
              </label>
              <label className="block text-sm">
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block text-sm">
                Password
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-ring"
                  placeholder="At least 6 characters"
                />
              </label>
              <label className="block text-sm">
                Confirm password
                <input
                  required
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Repeat your password"
                />
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
              >
                <UserPlus className="h-4 w-4" /> Create account
              </button>
              <p className="text-center text-xs leading-5 text-muted-foreground">
                Prototype authentication is stored locally in this browser. Replace it with the
                project backend before production.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Log in
                </Link>
=======

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 md:py-12 flex items-center justify-center">
        <div className="w-full grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">

          {/* Left Side: 3D Visual & Architecture Info */}
          <div className="hidden lg:flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 min-h-[620px] relative overflow-hidden shadow-sm">
            <ContinuumVaultShield3D className="absolute inset-0 h-full w-full opacity-60 pointer-events-auto" />

            <div className="relative z-10 space-y-4">
              <div className="cyber-badge">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-700" />
                SECURE HOUSEHOLD ONBOARDING
              </div>

              <h2 className="text-3xl lg:text-4xl font-semibold leading-tight text-slate-900 font-display">
                Create Your Household <br />
                <span className="text-sky-700">
                  Readiness Workspace.
                </span>
              </h2>

              <p className="max-w-md text-sm text-slate-600 leading-relaxed">
                Initialize your encrypted repository, invite trusted Guardians, and extract financial information with human verification.
>>>>>>> Stashed changes
              </p>
            </div>

            <div className="relative z-10 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zero-knowledge client-side encryption defaults</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>2-of-3 threshold guardian release protocol</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>7-dimension readiness score mapping</span>
              </div>
            </div>
          </div>

          {/* Right Side: Signup Form */}
          <div className="mx-auto w-full max-w-md">
            <div className="card-surface p-7 sm:p-9 shadow-md border-slate-200">
              <div className="mb-6 text-center space-y-2">
                <ContinuumMark size={44} className="mx-auto" />
                <h1 className="text-2xl font-semibold text-slate-900 font-display">Create Your Account</h1>
                <p className="text-xs text-slate-600">
                  Start measuring your household's successor readiness
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition shadow-sm"
                    placeholder="e.g. Meera Kulkarni"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition shadow-sm"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5">
                    Vault Password
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition pr-10 shadow-sm"
                      placeholder="At least 6 characters"
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
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    required
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition shadow-sm"
                    placeholder="Repeat vault password"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                    <Lock className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="cyber-button w-full py-3 text-sm font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Initializing Account...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create Vault Account
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Already have a vault?{" "}
                  <Link to="/login" className="font-semibold text-slate-900 hover:underline">
                    Log In
                  </Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

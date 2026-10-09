import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogIn, Eye, EyeOff, ShieldCheck, Lock, KeyRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { login } from "@/lib/api/auth";
import { PublicNavbar } from "@/components/PublicNavbar";
import { ContinuumMark } from "@/components/ui/ContinuumMark";
import { ContinuumVaultShield3D } from "@/components/ui/ContinuumVaultShield3D";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — Continuum Vault" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
<<<<<<< Updated upstream
    const result = await login(email, password);

    if (!result.success) {
      setError(
        result.error ??
          "No matching account was found. Create an account first.",
      );
      return;
=======
    setLoading(true);

    try {
      await loginUser(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
>>>>>>> Stashed changes
    }
    navigate({ to: "/dashboard" });
  };

  // Demo helper for hackathon evaluators
  const fillDemoAccount = () => {
    setEmail("demo@continuum.sec");
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 md:py-12 flex items-center justify-center">
        <div className="w-full grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">

          {/* Left Side: 3D Visual & Brand Hero */}
          <div className="hidden lg:flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 min-h-[580px] relative overflow-hidden shadow-sm">
            {/* Background 3D Canvas */}
            <ContinuumVaultShield3D className="absolute inset-0 h-full w-full opacity-60 pointer-events-auto" />

            <div className="relative z-10 space-y-4">
              <div className="cyber-badge">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-700" />
                ZERO-KNOWLEDGE VAULT REPOSITORY
              </div>

              <h2 className="text-3xl lg:text-4xl font-semibold leading-tight text-slate-900 font-display">
                Household Continuity & <br />
                <span className="text-sky-700">
                  Successor Readiness.
                </span>
              </h2>

              <p className="max-w-md text-sm text-slate-600 leading-relaxed">
                Continuum measures readiness through human-verified document extraction, threshold guardian release, and automated gap analysis.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-3 pt-8 border-t border-slate-100">
              <div className="space-y-1">
                <p className="text-[0.65rem] font-mono text-slate-500 uppercase">CALCULATED SCORE</p>
                <p className="text-sm font-semibold text-slate-900">7 Dimensions</p>
              </div>
              <div className="space-y-1">
                <p className="text-[0.65rem] font-mono text-slate-500 uppercase">GUARDIAN MATRIX</p>
                <p className="text-sm font-semibold text-slate-900">2-of-3 Threshold</p>
              </div>
              <div className="space-y-1">
                <p className="text-[0.65rem] font-mono text-slate-500 uppercase">VERIFICATION</p>
                <p className="text-sm font-semibold text-slate-900">Human Confirmed</p>
              </div>
            </div>
          </div>

          {/* Right Side: Authentication Form Card */}
          <div className="mx-auto w-full max-w-md">
            <div className="card-surface p-7 sm:p-9 shadow-md border-slate-200 relative">
              <div className="mb-8 text-center space-y-2">
                <ContinuumMark size={44} className="mx-auto" />
                <h1 className="text-2xl font-semibold text-slate-900 font-display">Welcome to Continuum</h1>
                <p className="text-xs text-slate-600">
                  Sign in to access your encrypted household readiness vault
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider mb-2">
                    Account Email
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition shadow-sm"
                    placeholder="you@domain.com"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-mono text-slate-700 uppercase tracking-wider">
                      Vault Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition pr-10 shadow-sm"
                      placeholder="••••••••••••"
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

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                    <Lock className="h-4 w-4 shrink-0 mt-0.5" />
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
                      Authenticating...
                    </span>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Access Vault
                    </>
                  )}
                </button>
              </form>

              {/* Quick filling for demo evaluation */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
                <button
                  type="button"
                  onClick={fillDemoAccount}
                  className="inline-flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-800 transition font-mono font-medium"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Auto-fill demo credentials
                </button>

                <p className="text-xs text-slate-500">
                  Need a new vault?{" "}
                  <Link to="/signup" className="font-semibold text-slate-900 hover:underline">
                    Create Household Account
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

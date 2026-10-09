import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useState } from "react";
<<<<<<< Updated upstream
import { getDemoUser, logoutDemoUser } from "@/lib/auth";

const NAV = [
  { to: "/dashboard", label: "1 Dashboard" },
  { to: "/upload", label: "2 Upload & confirm" },
  { to: "/graph", label: "3 Knowledge graph" },
  { to: "/playbook", label: "4 Day-Zero" },
  { to: "/guardian", label: "5 Guardian release" },
] as const;

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const user = getDemoUser();
=======
import { logoutUser, type ContinuumUser } from "@/lib/auth";
import { ContinuumMark } from "@/components/ui/ContinuumMark";
import {
  LayoutDashboard,
  FileCheck2,
  GitGraph,
  ShieldAlert,
  Users2,
  LockKeyhole,
  Shield,
  LogOut,
  ChevronDown,
  Activity,
} from "lucide-react";

const HOUSEHOLD_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload & Confirm", icon: FileCheck2 },
  { to: "/graph", label: "Knowledge Graph", icon: GitGraph },
  { to: "/playbook", label: "Day-Zero Playbook", icon: ShieldAlert },
  { to: "/guardians", label: "Guardians", icon: Users2 },
  { to: "/guardian", label: "Vault Release", icon: LockKeyhole },
] as const;

const GUARDIAN_NAV = [
  { to: "/guardian/portal", label: "Guardian Portal", icon: Shield },
] as const;

export function ProtectedShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: ContinuumUser;
}) {
  const navigate = useNavigate();
  const location = useLocation();
>>>>>>> Stashed changes
  const [profileOpen, setProfileOpen] = useState(false);
  const initial = user?.name?.trim().charAt(0).toUpperCase() || "U";
<<<<<<< Updated upstream

  const logout = () => {
    logoutDemoUser();
    setProfileOpen(false);
    navigate({ to: "/" });
=======
  const isGuardian = !user?.household_id;
  const navItems = isGuardian ? GUARDIAN_NAV : HOUSEHOLD_NAV;
  const homeRoute = isGuardian ? "/guardian/portal" : "/dashboard";

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setProfileOpen(false);
      navigate({ to: "/" });
    }
>>>>>>> Stashed changes
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5">
          {/* Logo */}
          <Link
<<<<<<< Updated upstream
            to="/dashboard"
            className="flex items-center gap-2 font-display text-2xl font-semibold"
          >
            <img src="/continuum-mark.png" alt="Continuum" className="h-9 w-9 object-contain" />
            <span>
              Continuum<span className="text-gold">.</span>
            </span>
          </Link>
          <nav className="flex flex-1 flex-wrap gap-1 text-sm">
            {NAV.map((n) => (
=======
            to={homeRoute}
            className="flex items-center gap-3 font-display text-xl font-bold tracking-tight text-slate-900 hover:opacity-90 transition"
          >
            <ContinuumMark size={32} />
            <span className="flex items-center gap-1.5">
              Continuum
              <span className="text-sky-600 font-mono text-xs font-semibold">.sec</span>
            </span>
          </Link>

          {/* Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((n) => {
              const Icon = n.icon;
              const isActive =
                location.pathname === n.to ||
                (n.to !== "/dashboard" && location.pathname.startsWith(n.to));

              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-sky-400" : "text-slate-500"}`} />
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.7rem] font-mono text-emerald-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>VAULT SECURED</span>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1.5 pr-3 text-sm transition hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                aria-expanded={profileOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 font-bold text-white font-mono text-xs">
                  {initial}
                </span>
                <span className="hidden max-w-28 truncate text-xs font-semibold text-slate-800 sm:block">
                  {user?.name || "User"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="border-b border-slate-100 pb-3">
                    <p className="font-semibold text-sm text-slate-900">
                      {user?.name || "Continuum User"}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-mono text-slate-500">
                      {user?.email || "user@continuum.sec"}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[0.7rem] font-mono">
                      <span className="text-sky-700 font-semibold">
                        {isGuardian ? "GUARDIAN ROLE" : "HOUSEHOLD OWNER"}
                      </span>
                      <span className="text-emerald-700 font-semibold">ACTIVE</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/security"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Shield className="h-4 w-4 text-sky-600" />
                      Account & Security Settings
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden overflow-x-auto border-t border-slate-100 px-4 py-2 gap-1 no-scrollbar">
          {navItems.map((n) => {
            const Icon = n.icon;
            const isActive = location.pathname === n.to;
            return (
>>>>>>> Stashed changes
              <Link
                key={n.to}
                to={n.to}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${isActive ? "bg-slate-900 text-white" : "text-slate-600"
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{n.label}</span>
              </Link>
<<<<<<< Updated upstream
            ))}
          </nav>
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className="flex items-center gap-2 rounded-full border bg-card px-2 py-1.5 text-sm hover:bg-muted"
              aria-expanded={profileOpen}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                {initial}
              </span>
              <span className="hidden max-w-28 truncate sm:block">{user?.name || "Profile"}</span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 z-50 mt-2 w-60 rounded-lg border bg-card p-3 shadow-lg">
                <div className="border-b pb-3">
                  <p className="font-medium">{user?.name || "Continuum user"}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {user?.email || "Demo account"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      <footer className="mx-auto max-w-6xl px-6 pb-10 eyebrow">
        Prototype · synthetic data only · a checklist, not financial or legal advice
=======
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl border-t border-slate-200 px-6 py-6 text-xs text-slate-500 font-mono flex flex-wrap justify-between gap-4">
        <span>CONTINUUM VAULT PLATFORM · SYNTHETIC DEMO VECTORS</span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <Activity className="h-3.5 w-3.5 text-sky-600" />
          End-to-End Cryptographic Readiness Engine
        </span>
>>>>>>> Stashed changes
      </footer>
    </div>
  );
}

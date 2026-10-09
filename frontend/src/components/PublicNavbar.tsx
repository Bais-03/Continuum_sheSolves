import { Link } from "@tanstack/react-router";
import { ContinuumMark } from "@/components/ui/ContinuumMark";
import { ShieldCheck, Lock } from "lucide-react";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3.5">
        <Link
          to="/"
          className="group flex items-center gap-3 font-display text-xl font-bold tracking-tight text-slate-900 transition"
        >
          <ContinuumMark size={32} />
          <span className="flex items-center gap-1.5">
            Continuum
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          </span>
        </Link>

        <nav className="hidden items-center gap-1.5 text-xs font-semibold md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-lg px-3.5 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            activeProps={{
              className: "rounded-lg bg-slate-100 px-3.5 py-2 text-slate-900 font-bold",
            }}
          >
            Overview
          </Link>

          <Link
            to="/about"
            className="rounded-lg px-3.5 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            activeProps={{
              className: "rounded-lg bg-slate-100 px-3.5 py-2 text-slate-900 font-bold",
            }}
          >
            Architecture
          </Link>

          <Link
            to="/contact"
            className="rounded-lg px-3.5 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            activeProps={{
              className: "rounded-lg bg-slate-100 px-3.5 py-2 text-slate-900 font-bold",
            }}
          >
            Security & Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-mono text-sky-700 font-medium sm:flex">
            <Lock className="h-3 w-3" />
            <span>256-BIT VAULT</span>
          </div>

          <Link
            to="/login"
            className="cyber-button text-xs font-semibold py-2 px-4 shadow-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            Launch Vault
          </Link>
        </div>
      </div>
    </header>
  );
}
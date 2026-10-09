import { Link } from "@tanstack/react-router";
import { ContinuumMark } from "@/components/ui/ContinuumMark";
import { Lock } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-3 font-display text-xl font-bold text-slate-900">
            <ContinuumMark size={28} />
            <span>Continuum</span>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[0.65rem] font-mono text-emerald-700 font-bold">
              PROTECTED
            </span>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-slate-600">
            Household continuity platform with zero-knowledge vault architecture, multi-party threshold release, and human-verified readiness mapping.
          </p>
        </div>
        <div>
          <p className="eyebrow text-slate-900">Product System</p>
          <div className="mt-3 space-y-2 text-xs">
            <Link to="/" className="block text-slate-600 transition hover:text-sky-600">
              Readiness Overview
            </Link>
            <Link to="/about" className="block text-slate-600 transition hover:text-sky-600">
              Security Framework
            </Link>
            <Link to="/contact" className="block text-slate-600 transition hover:text-sky-600">
              Contact & Support
            </Link>
          </div>
        </div>
        <div>
          <p className="eyebrow text-slate-900">Security Disclaimer</p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Continuum evaluates successor knowledge and document accessibility using synthetic test vectors. Not financial or legal counsel.
          </p>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-sky-600" />
          <span>© {new Date().getFullYear()} Continuum Security Systems</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            System Operational
          </span>
          <span>v2.4.0-production</span>
        </div>
      </div>
    </footer>
  );
}

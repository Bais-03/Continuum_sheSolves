import { createFileRoute, Link } from "@tanstack/react-router";
<<<<<<< Updated upstream
import { computeScores, useStore } from "@/lib/store";
=======
import { useEffect, useState } from "react";
import { apiGetScores, apiRecalculateScores, apiGetGuardians, apiGetDocuments, type GuardianConfig } from "@/lib/api";
import {
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  UploadCloud,
  Users,
  FileText,
  Activity,
  CheckCircle2,
  ChevronRight,
  Shield,
} from "lucide-react";
import { ContinuumVaultShield3D } from "@/components/ui/ContinuumVaultShield3D";
>>>>>>> Stashed changes

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Continuum Vault" },
      {
        name: "description",
        content: "Your household's 7-dimension successor readiness score and active security gaps.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
<<<<<<< Updated upstream
  const s = useStore();
  const { dims, overall } = computeScores(s);
=======
  const [overall, setOverall] = useState<number>(17);
  const [dims, setDims] = useState<DimensionItem[]>([]);
  const [guardianConfig, setGuardianConfig] = useState<GuardianConfig | null>(null);
  const [docCount, setDocCount] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const res = await apiGetScores();
      if (res) {
        setOverall(res.overall_score);
        setDims(res.dimensions || []);
      }

      const [gRes, dRes] = await Promise.allSettled([
        apiGetGuardians(),
        apiGetDocuments(),
      ]);

      if (gRes.status === "fulfilled" && gRes.value) {
        setGuardianConfig(gRes.value);
      }
      if (dRes.status === "fulfilled" && Array.isArray(dRes.value)) {
        setDocCount(dRes.value.length);
      }
    } catch (err) {
      console.warn("Failed to fetch backend scores:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const res = await apiRecalculateScores();
      if (res) {
        setOverall(res.overall_score);
        setDims(res.dimensions || []);
      }
    } catch (err) {
      console.error("Failed to recalculate scores:", err);
    } finally {
      setRecalculating(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

>>>>>>> Stashed changes
  const gaps = [...dims].filter((d) => d.score < 60).sort((a, b) => a.score - b.score);
  const radius = 70;
  const C = 2 * Math.PI * radius;

  const gaugeColor = overall < 50 ? "#d97706" : overall < 75 ? "#0284c7" : "#059669";

  return (
<<<<<<< Updated upstream
    <div className="space-y-10">
      <section className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow">Demo household · the Kulkarnis</p>
          <h1 className="mt-2 text-4xl md:text-5xl">
            If Anil were unavailable tomorrow, could Meera carry on?
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Continuum measures readiness, not storage — what a successor would need to know, and
            what's missing.
          </p>
=======
    <div className="space-y-8">
      
      {/* Top Banner Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-40 pointer-events-none hidden lg:block">
          <ContinuumVaultShield3D interactive={false} className="h-full w-full" />
>>>>>>> Stashed changes
        </div>

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] items-center">
          <div>
            <div className="cyber-badge mb-3">
              <Activity className="h-3.5 w-3.5 text-sky-700" />
              LIVE READINESS ENGINE · BACKEND CONNECTED
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 font-display">
              Successor Readiness Evaluation
            </h1>
            
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              Continuum measures actionable readiness, not static document storage — evaluating what your designated successor can access, verify, and execute during Day-Zero.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/upload" className="cyber-button text-xs py-2.5 px-4">
                <UploadCloud className="h-4 w-4" />
                Upload & Confirm Facts
              </Link>
              <Link to="/guardians" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 shadow-sm">
                <Users className="h-4 w-4 text-sky-700" />
                Manage Guardians ({guardianConfig?.guardians.length ?? 0}/3)
              </Link>
            </div>
          </div>

          {/* Score Gauge Widget */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={gaugeColor}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - overall / 100)}
                  style={{ transition: "stroke-dashoffset 1s ease-in-out, stroke 0.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-5xl font-bold tracking-tight text-slate-900">{overall}</span>
                <span className="eyebrow text-[0.62rem] mt-0.5 text-slate-500">/ 100 INDEX</span>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <span className={`text-xs font-semibold font-mono ${overall < 50 ? "text-amber-800" : overall < 75 ? "text-sky-800" : "text-emerald-800"}`}>
                {overall < 50 ? "ATTENTION NEEDED" : overall < 75 ? "MODERATE READINESS" : "HIGH READINESS"}
              </span>
            </div>
          </div>
        </div>
      </section>

<<<<<<< Updated upstream
      <section className="card-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Seven dimensions</h2>
          <span className="eyebrow">gold = below 60</span>
        </div>
        <div className="mt-5 space-y-3">
          {dims.map((d) => (
            <div key={d.key} className="grid grid-cols-[180px_1fr_40px] items-center gap-4 text-sm">
              <span>{d.label}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${d.score < 60 ? "bg-gold" : "bg-primary"}`}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <span className="text-right font-mono">{d.score}</span>
=======
      {/* Overview Metric Quick Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card-surface p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="eyebrow">Documents Extracted</p>
            <p className="mt-1 text-2xl font-bold font-display text-slate-900">{docCount}</p>
            <p className="mt-1 text-xs text-slate-500">Household files analyzed</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="card-surface p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="eyebrow">Guardian Protection</p>
            <p className="mt-1 text-2xl font-bold font-display text-slate-900">
              {guardianConfig ? `${guardianConfig.guardians.length} of 3` : "Loading..."}
            </p>
            <p className="mt-1 text-xs text-slate-500">2-of-3 threshold release</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="card-surface p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="eyebrow">Critical Gaps</p>
            <p className="mt-1 text-2xl font-bold font-display text-amber-700">{gaps.length}</p>
            <p className="mt-1 text-xs text-slate-500">Dimensions scoring &lt; 60</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </section>

      {/* 7 Readiness Dimensions Section */}
      <section className="card-surface p-6 sm:p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 font-display">Seven Readiness Dimensions</h2>
            <p className="mt-1 text-xs text-slate-600">
              Evaluates asset coverage, nominee registration, contact availability, and document access.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${recalculating ? "animate-spin" : ""}`} />
              {recalculating ? "Recalculating..." : "Recalculate Scores"}
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
>>>>>>> Stashed changes
            </div>
          )}

          {!loading && dims.map((d) => {
            const isLow = d.score < 60;
            return (
              <div key={d.dimension} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${isLow ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <span className="font-semibold text-slate-900">{d.label}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-48 sm:w-64 h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isLow
                            ? "bg-amber-500"
                            : "bg-sky-600"
                        }`}
                        style={{ width: `${d.score}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono font-semibold text-slate-900">{d.score}/100</span>
                  </div>
                </div>

                {d.explanations && d.explanations.length > 0 && (
                  <div className="pl-5 text-xs text-slate-500 font-sans border-l border-slate-200">
                    {d.explanations.join(" · ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

<<<<<<< Updated upstream
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="text-xl">Biggest gaps</h2>
          {gaps.length === 0 ? (
            <p className="mt-3 text-muted-foreground">No dimension below 60. Well prepared.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {gaps.map((g) => (
                <li key={g.key} className="flex justify-between border-b pb-2">
                  <span>{g.label}</span>
                  <span className="font-mono text-gold-foreground">{g.score}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card-surface flex flex-col justify-between gap-4 bg-primary p-6 text-primary-foreground">
          <div>
            <h2 className="text-xl">Raise the score</h2>
            <p className="mt-2 text-sm opacity-80">
              Add household documents and confirm what was extracted. Each confirmed fact closes a
              gap.
            </p>
          </div>
          <Link
            to="/upload"
            className="self-start rounded-md bg-gold px-4 py-2 text-sm font-medium text-gold-foreground"
          >
            Upload documents →
          </Link>
=======
      {/* Gaps Resolution & Next Actions Grid */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Biggest Gaps Card */}
        <div className="card-surface p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900 font-display">Top Gaps Requiring Action</h2>
            </div>

            {gaps.length === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 text-center space-y-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                <p className="text-sm font-semibold text-emerald-800">All Dimensions Above 60</p>
                <p className="text-xs text-slate-500">Your household has no unaddressed critical readiness gaps.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {gaps.map((g) => (
                  <li key={g.dimension} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3.5 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{g.label}</p>
                      <p className="text-slate-500 mt-0.5">{g.unconfirmed_count} fields pending manual confirmation</p>
                    </div>
                    <span className="font-mono font-bold text-amber-800 bg-white px-2.5 py-1 rounded border border-amber-300">
                      {g.score}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/playbook"
              className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-sky-700 hover:text-sky-800 transition"
            >
              Simulate Day-Zero Playbook <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Raise Score CTA Card */}
        <div className="card-surface p-6 flex flex-col justify-between border-slate-200 shadow-sm bg-slate-50/40">
          <div>
            <div className="cyber-badge mb-3">ACTION RECOMMENDED</div>
            <h2 className="text-xl font-semibold text-slate-900 font-display">Increase Readiness Score</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Upload household documents (insurance policies, property deeds, bank terms) and confirm extracted nominee names. Each human-verified field directly updates your readiness score.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
            <Link
              to="/upload"
              className="cyber-button text-xs py-2.5 px-4"
            >
              Upload & Confirm Documents <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/graph"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              Explore 3D Knowledge Graph
            </Link>
          </div>
>>>>>>> Stashed changes
        </div>
      </section>

    </div>
  );
}

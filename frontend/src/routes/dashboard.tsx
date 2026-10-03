import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiGetScores, apiRecalculateScores } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Continuum" },
      {
        name: "description",
        content: "Your household's 7-dimension successor readiness score and biggest gaps.",
      },
      { property: "og:title", content: "Continuum" },
      {
        property: "og:description",
        content: "Your household's 7-dimension successor readiness score and biggest gaps.",
      },
    ],
  }),
  component: Dashboard,
});

type DimensionItem = {
  dimension: string;
  label: string;
  score: number;
  weight: number;
  base: number;
  confirmed_count: int;
  unconfirmed_count: int;
  rejected_count: int;
  explanations: string[];
};

function Dashboard() {
  const [overall, setOverall] = useState<number>(17);
  const [dims, setDims] = useState<DimensionItem[]>([]);
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

  const gaps = [...dims].filter((d) => d.score < 60).sort((a, b) => a.score - b.score);
  const C = 2 * Math.PI * 70;

  return (
    <div className="space-y-10">
      <section className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow">Household Readiness · Backend Connected</p>
          <h1 className="mt-2 text-4xl md:text-5xl">
            If Anil were unavailable tomorrow, could Meera carry on?
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Continuum measures readiness, not storage — what a successor would need to know, and
            what's missing.
          </p>
        </div>
        <div className="relative mx-auto h-44 w-44">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="var(--color-muted)"
              strokeWidth="12"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke={overall < 60 ? "var(--color-gold)" : "var(--color-success)"}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - overall / 100)}
              style={{ transition: "stroke-dashoffset .8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl font-semibold">{overall}</span>
            <span className="eyebrow">/ 100 ready</span>
          </div>
        </div>
      </section>

      <section className="card-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Seven dimensions</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="text-xs rounded border px-2.5 py-1 text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              {recalculating ? "Recalculating..." : "Recalculate"}
            </button>
            <span className="eyebrow">gold = below 60</span>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Loading readiness scores...</p>}
          {dims.map((d) => (
            <div key={d.dimension} className="space-y-1">
              <div className="grid grid-cols-[180px_1fr_40px] items-center gap-4 text-sm">
                <span className="font-medium">{d.label}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${d.score < 60 ? "bg-gold" : "bg-primary"}`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                <span className="text-right font-mono">{d.score}</span>
              </div>
              {d.explanations && d.explanations.length > 0 && (
                <div className="pl-[180px] text-xs text-muted-foreground">
                  {d.explanations.join(" · ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="text-xl">Biggest gaps</h2>
          {gaps.length === 0 ? (
            <p className="mt-3 text-muted-foreground">No dimension below 60. Well prepared.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {gaps.map((g) => (
                <li key={g.dimension} className="flex justify-between border-b pb-2">
                  <div>
                    <span className="font-medium">{g.label}</span>
                    <p className="text-xs text-muted-foreground">{g.unconfirmed_count} pending confirmation</p>
                  </div>
                  <span className="font-mono text-gold-foreground font-semibold">{g.score}</span>
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
              gap and automatically updates your readiness score.
            </p>
          </div>
          <Link
            to="/upload"
            className="self-start rounded-md bg-gold px-4 py-2 text-sm font-medium text-gold-foreground hover:opacity-90"
          >
            Upload & Confirm Documents →
          </Link>
        </div>
      </section>
    </div>
  );
}

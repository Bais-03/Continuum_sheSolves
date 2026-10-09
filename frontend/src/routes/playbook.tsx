import { createFileRoute } from "@tanstack/react-router";
<<<<<<< Updated upstream
import { actions, computeScores, useStore, type DimKey } from "@/lib/store";
=======
import { useEffect, useMemo, useState } from "react";
import {
  apiAnalyzeGraph,
  apiUpdateTask,
  type GraphAnalysis,
  type DayZeroAction,
} from "@/lib/api";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
>>>>>>> Stashed changes

export const Route = createFileRoute("/playbook")({
  head: () => ({
    meta: [
      { title: "Day-Zero Playbook — Continuum" },
<<<<<<< Updated upstream
      { name: "description", content: "A prioritized plan for the first 30 days, built from your household's gaps." },
      { property: "og:title", content: "Day-Zero Playbook — Continuum" },
      { property: "og:description", content: "A prioritized plan for the first 30 days, built from your household's gaps." },
=======
      {
        name: "description",
        content: "A prioritized contingency plan generated from your household's actual knowledge gaps.",
      },
>>>>>>> Stashed changes
    ],
  }),
  component: Playbook,
});

<<<<<<< Updated upstream
const GAP_TASKS: Record<DimKey, { title: string; day: string }> = {
  beneficiary: { title: "Register nominees on demat and LIC; verify bank nominees", day: "Day 1–7" },
  successor: { title: "Record who to call first and what each advisor handles", day: "Day 1–3" },
  access: { title: "Note where originals, locker keys and passwords are kept", day: "Day 1" },
  liability: { title: "List every loan and EMI, with lender contact", day: "Day 3–10" },
  deadline: { title: "Put premium and EMI dates on a shared calendar", day: "Day 1–5" },
  asset: { title: "Search RBI UDGAM for forgotten deposits", day: "Day 10–20" },
  contacts: { title: "Share emergency contacts with an adult child", day: "Day 1" },
};
const STANDARD = [
  { id: "std-cert", title: "Obtain 10+ certified death certificate copies", day: "Day 1–7", p: 1 },
  { id: "std-bank", title: "Inform banks; keep joint accounts running for bills", day: "Day 3–14", p: 2 },
  { id: "std-claim", title: "File insurance claims with nominee documents", day: "Day 7–30", p: 2 },
];

function Playbook() {
  const s = useStore();
  const { dims } = computeScores(s);
  const gapTasks = dims
    .filter((d) => d.score < 80)
    .map((d) => ({ id: `gap-${d.key}`, ...GAP_TASKS[d.key], p: d.score < 40 ? 1 : d.score < 60 ? 2 : 3, why: `${d.label}: ${d.score}` }));
  const tasks = [...gapTasks, ...STANDARD.map((t) => ({ ...t, why: "Standard step" }))].sort((a, b) => a.p - b.p);
  const done = tasks.filter((t) => s.completedTasks.includes(t.id)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Simulate · the first 30 days</p>
          <h1 className="mt-2 text-4xl">Day-Zero playbook</h1>
          <p className="mt-2 text-muted-foreground">Each gap becomes a task, ordered by how much it would hurt.</p>
=======
function priorityRank(priority: string): number {
  switch (priority.toLowerCase()) {
    case "high":
      return 1;
    case "medium":
      return 2;
    default:
      return 3;
  }
}

function priorityLabel(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high":
      return "P1 HIGH";
    case "medium":
      return "P2 MED";
    default:
      return "P3 LOW";
  }
}

function priorityBadgeClass(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-amber-50 border-amber-200 text-amber-800 font-mono font-semibold";
    case "medium":
      return "bg-sky-50 border-sky-200 text-sky-800 font-mono font-semibold";
    default:
      return "bg-slate-100 border-slate-200 text-slate-700 font-mono font-medium";
  }
}

function dayWindow(action: DayZeroAction): string {
  switch (action.gap_type.toLowerCase()) {
    case "beneficiary":
      return action.priority === "high" ? "Day 1–7 Window" : "Day 3–10 Window";
    case "contact":
      return "Day 1–3 Immediate";
    default:
      return action.priority === "high"
        ? "Day 1–3 Immediate"
        : action.priority === "medium"
          ? "Day 3–10 Standard"
          : "Day 10–30 Secondary";
  }
}

function Playbook() {
  const [analysis, setAnalysis] = useState<GraphAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadActions = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await apiAnalyzeGraph();
        setAnalysis(result);
      } catch (err) {
        setAnalysis(null);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your Day-Zero playbook."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadActions();
  }, []);

  const tasks = useMemo(() => {
    const backendActions = analysis?.actions ?? [];
    return [...backendActions]
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
      .map((action) => ({
        ...action,
        id: action.task_id,
        day: dayWindow(action),
      }));
  }, [analysis]);

  const done = tasks.filter(
    (task) => task.status.toUpperCase() === "DONE"
  ).length;

  const remaining = tasks.length - done;

  const completion =
    tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);

  const highPriority = tasks.filter(
    (task) => task.priority.toLowerCase() === "high"
  ).length;

  const handleTaskToggle = async (taskId: string, currentStatus: string) => {
    const nextStatus =
      currentStatus.toUpperCase() === "DONE" ? "TODO" : "DONE";

    try {
      setError("");
      const updatedTask = await apiUpdateTask(taskId, nextStatus);

      setAnalysis((current) => {
        if (!current) return current;
        return {
          ...current,
          actions: current.actions.map((action) =>
            action.task_id === taskId
              ? { ...action, status: updatedTask.status }
              : action
          ),
        };
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update Day-Zero task."
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="card-surface min-h-[300px] flex items-center justify-center p-8 text-xs text-slate-500 shadow-sm">
          Generating Day-Zero contingency plan from household graph...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="card-surface p-8 text-center space-y-3 border-red-200 shadow-sm">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-900 font-display">Unable to Build Playbook</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">{error}</p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="border-b border-slate-200 pb-6">
          <p className="eyebrow flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-sky-600" />
            Contingency Execution Engine
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-slate-900 font-display">
            Day-Zero Contingency Playbook
          </h1>
        </div>

        <div className="card-surface p-8 text-center space-y-3 shadow-sm">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-900 font-display">Zero Action Gaps Detected</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Continuum has verified all beneficiary registrations and contact relationships. No urgent contingency tasks are currently open.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-sky-600" />
            Simulated Contingency Timeline · First 30 Days
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-slate-900 font-display">
            Day-Zero Contingency Playbook
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
            Prioritized operational tasks automatically synthesized from unconfirmed relationships and missing beneficiary data in your household knowledge graph.
          </p>
        </div>

        <div className="card-surface px-5 py-3 text-right border-slate-200 shadow-sm">
          <div className="font-mono text-sm font-semibold text-slate-900">
            {done} / {tasks.length} Complete
          </div>
          <div className="text-[0.65rem] font-mono text-sky-800 font-bold mt-0.5">
            {completion}% RESOLVED
          </div>
>>>>>>> Stashed changes
        </div>
        <span className="font-mono text-sm">{done}/{tasks.length} done</span>
      </div>
<<<<<<< Updated upstream
      <ol className="space-y-3">
        {tasks.map((t) => {
          const checked = s.completedTasks.includes(t.id);
          return (
            <li key={t.id} className={`card-surface flex items-start gap-4 p-4 ${checked ? "opacity-50" : ""}`}>
              <input type="checkbox" checked={checked} onChange={() => actions.toggleTask(t.id)} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
              <span className={`rounded px-2 py-0.5 font-mono text-xs ${t.p === 1 ? "bg-gold text-gold-foreground" : t.p === 2 ? "bg-accent text-accent-foreground" : "bg-muted"}`}>P{t.p}</span>
              <div className="flex-1">
                <div className={checked ? "line-through" : ""}>{t.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t.day} · {t.why}</div>
=======

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-surface p-5 space-y-1 shadow-sm">
          <p className="eyebrow text-[0.65rem]">Open Actions</p>
          <p className="text-3xl font-bold font-mono text-slate-900">{remaining}</p>
          <p className="text-[0.7rem] text-slate-500">Gaps requiring resolution</p>
        </div>

        <div className="card-surface p-5 space-y-1 shadow-sm">
          <p className="eyebrow text-[0.65rem]">Priority 1 (P1)</p>
          <p className="text-3xl font-bold font-mono text-amber-700">{highPriority}</p>
          <p className="text-[0.7rem] text-slate-500">High severity gaps</p>
        </div>

        <div className="card-surface p-5 space-y-2 shadow-sm">
          <p className="eyebrow text-[0.65rem]">Execution Progress</p>
          <p className="text-2xl font-bold font-mono text-sky-800">{completion}%</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-sky-600 transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Gap Synthesis Note */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900 flex items-center gap-3">
        <Sparkles className="h-5 w-5 shrink-0 text-sky-700" />
        <div>
          <span className="font-semibold">Automatic Synthesis:</span> These tasks dynamically update as you upload documents and confirm nominee fields on the Upload page.
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const checked = task.status.toUpperCase() === "DONE";

          return (
            <div
              key={task.id}
              className={`card-surface p-5 transition-all flex items-start gap-4 shadow-sm ${
                checked ? "opacity-60 bg-slate-50 border-slate-200" : "hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleTaskToggle(task.task_id, task.status)}
                className="mt-1 h-5 w-5 cursor-pointer accent-slate-900 rounded"
                aria-label={`Mark ${task.title} as complete`}
              />

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] border ${priorityBadgeClass(task.priority)}`}>
                      {priorityLabel(task.priority)}
                    </span>
                    <h3 className={`text-base font-semibold ${checked ? "line-through text-slate-400" : "text-slate-900 font-display"}`}>
                      {task.title}
                    </h3>
                  </div>

                  <span className="font-mono text-xs text-slate-700 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    <Clock className="h-3 w-3 text-slate-500" />
                    {task.day}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {task.description}
                </p>

                <div className="flex items-center gap-3 pt-1 text-[0.68rem] font-mono text-slate-500">
                  <span className="uppercase text-slate-500">GAP CATEGORY: {task.gap_type.replace(/_/g, " ")}</span>
                </div>
>>>>>>> Stashed changes
              </div>
            </div>
          );
        })}
<<<<<<< Updated upstream
      </ol>
=======
      </div>

      {/* Continuum Principle Footer */}
      <div className="card-surface p-6 border-slate-200 shadow-sm space-y-1">
        <p className="eyebrow">Continuum Engineering Principle</p>
        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Documents alone are not readiness. Continuum transforms static policies into executable steps a successor can rehearse before emergency events arise.
        </p>
      </div>
>>>>>>> Stashed changes
    </div>
  );
}

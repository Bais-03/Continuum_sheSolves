import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { actions, useStore } from "@/lib/store";
import {
  apiAnalyzeGraph,
  type GraphAnalysis,
  type DayZeroAction,
} from "@/lib/api";

export const Route = createFileRoute("/playbook")({
  head: () => ({
    meta: [
      { title: "Day-Zero Playbook — Continuum" },
      {
        name: "description",
        content:
          "A prioritized plan for the first 30 days, generated from your household's actual knowledge gaps.",
      },
      {
        property: "og:title",
        content: "Day-Zero Playbook — Continuum",
      },
      {
        property: "og:description",
        content:
          "A prioritized plan for the first 30 days, generated from your household's actual knowledge gaps.",
      },
    ],
  }),
  component: Playbook,
});

/* ============================================================
   HELPERS
   ============================================================ */

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
      return "P1";
    case "medium":
      return "P2";
    default:
      return "P3";
  }
}

function priorityClasses(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-gold text-gold-foreground";
    case "medium":
      return "bg-accent text-accent-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function dayWindow(action: DayZeroAction): string {
  switch (action.gap_type.toLowerCase()) {
    case "beneficiary":
      return action.priority === "high" ? "Day 1–7" : "Day 3–10";

    case "contact":
      return "Day 1–3";

    default:
      return action.priority === "high"
        ? "Day 1–3"
        : action.priority === "medium"
          ? "Day 3–10"
          : "Day 10–30";
  }
}

function actionId(action: DayZeroAction): string {
  return `dayzero-${action.gap_type}-${action.entity_id}`;
}

/* ============================================================
   COMPONENT
   ============================================================ */

function Playbook() {
  const store = useStore();

  const [analysis, setAnalysis] = useState<GraphAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ----------------------------------------------------------
     LOAD REAL BACKEND DAY-ZERO ACTIONS
     ---------------------------------------------------------- */

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
            : "Unable to load your Day-Zero playbook.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadActions();
  }, []);

  /* ----------------------------------------------------------
     CONVERT BACKEND ACTIONS INTO UI TASKS
     ---------------------------------------------------------- */

  const tasks = useMemo(() => {
    const backendActions = analysis?.actions ?? [];

    return [...backendActions]
      .sort(
        (a, b) =>
          priorityRank(a.priority) - priorityRank(b.priority),
      )
      .map((action) => ({
        ...action,
        id: actionId(action),
        day: dayWindow(action),
      }));
  }, [analysis]);

  const done = tasks.filter((task) =>
    store.completedTasks.includes(task.id),
  ).length;

  const remaining = tasks.length - done;

  const completion =
    tasks.length === 0
      ? 0
      : Math.round((done / tasks.length) * 100);

  const highPriority = tasks.filter(
    (task) => task.priority.toLowerCase() === "high",
  ).length;

  /* ----------------------------------------------------------
     LOADING
     ---------------------------------------------------------- */

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">Simulate · the first 30 days</p>

          <h1 className="mt-2 text-4xl">
            Day-Zero playbook
          </h1>

          <p className="mt-2 text-muted-foreground">
            Turning your household's actual knowledge gaps into
            prioritized actions.
          </p>
        </div>

        <div className="card-surface flex min-h-[300px] items-center justify-center p-8 text-center text-muted-foreground">
          Building your Day-Zero playbook from the household graph...
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------
     ERROR
     ---------------------------------------------------------- */

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">Simulate · the first 30 days</p>

          <h1 className="mt-2 text-4xl">
            Day-Zero playbook
          </h1>

          <p className="mt-2 text-muted-foreground">
            We could not build the playbook from your household data.
          </p>
        </div>

        <div className="card-surface space-y-3 p-8">
          <p className="font-medium text-destructive">
            Unable to load Day-Zero actions.
          </p>

          <p className="text-sm text-muted-foreground">
            {error}
          </p>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------
     EMPTY / HEALTHY HOUSEHOLD
     ---------------------------------------------------------- */

  if (tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">Simulate · the first 30 days</p>

          <h1 className="mt-2 text-4xl">
            Day-Zero playbook
          </h1>

          <p className="mt-2 text-muted-foreground">
            No unresolved Day-Zero actions were generated from your
            current household knowledge graph.
          </p>
        </div>

        <div className="card-surface p-8">
          <div className="rounded-lg border border-success/20 bg-success/5 p-6">
            <p className="text-sm font-medium text-success">
              ✓ No current action gaps
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Continuum did not identify any supported beneficiary
              or emergency-contact gaps in the confirmed household data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------
     MAIN PLAYBOOK
     ---------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            Simulate · the first 30 days
          </p>

          <h1 className="mt-2 text-4xl">
            Day-Zero playbook
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            These actions were generated directly from the knowledge
            gaps detected in your household graph.
          </p>
        </div>

        <div className="text-right">
          <div className="font-mono text-sm">
            {done}/{tasks.length} done
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            {completion}% complete
          </div>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="card-surface p-4">
          <p className="eyebrow">Open actions</p>

          <p className="mt-2 text-3xl font-semibold">
            {remaining}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Actions still requiring attention
          </p>
        </div>

        <div className="card-surface p-4">
          <p className="eyebrow">High priority</p>

          <p className="mt-2 text-3xl font-semibold">
            {highPriority}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Gaps that should be addressed first
          </p>
        </div>

        <div className="card-surface p-4">
          <p className="eyebrow">Readiness response</p>

          <p className="mt-2 text-3xl font-semibold">
            {completion}%
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      {/* EXPLANATION */}

      <div className="rounded-lg border border-gold/30 bg-gold/5 p-4">
        <p className="text-sm font-medium">
          Why these actions?
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          Continuum detected missing household relationships and
          converted them into prioritized Day-Zero actions. Higher-risk
          gaps appear first.
        </p>
      </div>

      {/* ACTIONS */}

      <ol className="space-y-3">
        {tasks.map((task) => {
          const checked = store.completedTasks.includes(task.id);

          return (
            <li
              key={task.id}
              className={`card-surface flex items-start gap-4 p-4 transition-opacity ${
                checked ? "opacity-50" : ""
              }`}
            >
              {/* CHECKBOX */}

              <input
                type="checkbox"
                checked={checked}
                onChange={() => actions.toggleTask(task.id)}
                className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                aria-label={`Mark ${task.title} as complete`}
              />

              {/* PRIORITY */}

              <span
                className={`rounded px-2 py-0.5 font-mono text-xs ${priorityClasses(
                  task.priority,
                )}`}
              >
                {priorityLabel(task.priority)}
              </span>

              {/* ACTION CONTENT */}

              <div className="flex-1">
                <div
                  className={
                    checked
                      ? "line-through font-medium"
                      : "font-medium"
                  }
                >
                  {task.title}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {task.description}
                </p>

                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{task.day}</span>

                  <span>·</span>

                  <span>
                    {task.gap_type.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* FOOTER */}

      <div className="card-surface p-5">
        <p className="eyebrow">Continuum principle</p>

        <p className="mt-2 text-sm text-muted-foreground">
          Documents are not readiness. Continuum turns missing
          relationships into concrete actions a successor can actually
          rehearse.
        </p>
      </div>
    </div>
  );
}
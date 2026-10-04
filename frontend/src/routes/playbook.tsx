import { createFileRoute } from "@tanstack/react-router";
import { actions, computeScores, useStore, type DimKey } from "@/lib/store";

export const Route = createFileRoute("/playbook")({
  head: () => ({
    meta: [
      { title: "Day-Zero Playbook — Continuum" },
      { name: "description", content: "A prioritized plan for the first 30 days, built from your household's gaps." },
      { property: "og:title", content: "Day-Zero Playbook — Continuum" },
      { property: "og:description", content: "A prioritized plan for the first 30 days, built from your household's gaps." },
    ],
  }),
  component: Playbook,
});

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
        </div>
        <span className="font-mono text-sm">{done}/{tasks.length} done</span>
      </div>
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
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

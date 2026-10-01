import { createFileRoute } from "@tanstack/react-router";
import { computeScores, useStore } from "@/lib/store";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Household Knowledge Graph — Continuum" },
      { name: "description", content: "People, accounts and documents mapped together, with gaps highlighted." },
      { property: "og:title", content: "Household Knowledge Graph — Continuum" },
      { property: "og:description", content: "People, accounts and documents mapped together, with gaps highlighted." },
    ],
  }),
  component: Graph,
});

type N = { id: string; label: string; x: number; y: number; kind: "person" | "asset" | "liability" | "contact"; gap?: boolean };

function Graph() {
  const s = useStore();
  const { dims } = computeScores(s);
  const score = (k: string) => dims.find((d) => d.key === k)!.score;
  const conf = (label: string) => s.docs.some((d) => d.fields.some((f) => f.confirmed && f.label === label));

  const nodes: N[] = [
    { id: "anil", label: "Anil (holder)", x: 400, y: 230, kind: "person" },
    { id: "meera", label: "Meera (successor)", x: 400, y: 60, kind: "person", gap: score("successor") < 60 },
    { id: "lic", label: "LIC policy", x: 170, y: 120, kind: "asset", gap: !conf("Nominee") },
    { id: "sbi", label: "SBI savings", x: 130, y: 280, kind: "asset" },
    { id: "demat", label: "Zerodha demat", x: 230, y: 410, kind: "asset", gap: score("beneficiary") < 60 },
    { id: "loan", label: "HDFC home loan", x: 570, y: 410, kind: "liability", gap: !conf("Outstanding principal") },
    { id: "ca", label: "CA Deshpande", x: 670, y: 280, kind: "contact", gap: !conf("Who to call first") },
    { id: "locker", label: "Bank locker", x: 630, y: 120, kind: "asset", gap: score("access") < 60 },
  ];
  const edges: [string, string, string][] = [
    ["anil", "meera", "spouse"], ["anil", "lic", "insured"], ["lic", "meera", "nominee?"],
    ["anil", "sbi", "owns"], ["anil", "demat", "owns"], ["anil", "loan", "borrower"],
    ["anil", "ca", "advisor"], ["anil", "locker", "key holder"], ["sbi", "meera", "nominee"],
  ];
  const at = (id: string) => nodes.find((n) => n.id === id)!;
  const fill = (n: N) =>
    n.gap ? "var(--color-gold)" : n.kind === "person" ? "var(--color-primary)" : n.kind === "liability" ? "var(--color-secondary)" : "var(--color-accent)";

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Map</p>
        <h1 className="mt-2 text-4xl">Who holds what — and where knowledge breaks.</h1>
        <p className="mt-2 text-muted-foreground">Gold nodes are gaps. Confirm fields on the upload page to clear them.</p>
      </div>
      <div className="card-surface overflow-x-auto p-4">
        <svg viewBox="0 0 800 470" className="min-w-[640px]">
          {edges.map(([a, b, l]) => {
            const A = at(a), B = at(b);
            return (
              <g key={a + b}>
                <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--color-border)" strokeWidth="2" />
                <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 4} textAnchor="middle" fontSize="10" fill="var(--color-muted-foreground)" fontFamily="var(--font-mono)">{l}</text>
              </g>
            );
          })}
          {nodes.map((n) => (
            <g key={n.id} style={{ transition: "all .5s" }}>
              <rect x={n.x - 70} y={n.y - 20} width="140" height="40" rx="20" fill={fill(n)} stroke="var(--color-foreground)" strokeOpacity=".15" />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="13" fontFamily="var(--font-sans)"
                fill={n.kind === "person" && !n.gap ? "var(--color-primary-foreground)" : "var(--color-foreground)"}>
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

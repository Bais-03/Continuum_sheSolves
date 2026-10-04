import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { apiAnalyzeGraph, type GraphAnalysis, type GraphEntity } from "@/lib/api";

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

type NodeKind = "person" | "asset" | "liability" | "contact" | "document" | "other";
type VisualNode = GraphEntity & { x: number; y: number; kind: NodeKind; gap: boolean };

const kindFor = (entityType: string): NodeKind => {
  switch (entityType.toUpperCase()) {
    case "PERSON": return "person";
    case "ASSET": return "asset";
    case "LIABILITY": return "liability";
    case "CONTACT": return "contact";
    case "DOCUMENT": return "document";
    default: return "other";
  }
};

const labelFor = (entity: GraphEntity) => {
  switch (kindFor(entity.entity_type)) {
    case "person": return entity.name;
    default: return entity.name;
  }
};

function Graph() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<GraphAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadGraph = async () => {
    setLoading(true);
    setError("");
    try {
      setAnalysis(await apiAnalyzeGraph());
    } catch (err) {
      setAnalysis(null);
      setError(err instanceof Error ? err.message : "Unable to load your household graph.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGraph();
  }, []);

  const gapIds = useMemo(
    () => new Set((analysis?.gaps ?? []).map((gap) => gap.entity_id)),
    [analysis],
  );

  const nodes = useMemo<VisualNode[]>(() => {
    const entities = analysis?.entities ?? [];
    if (entities.length === 0) return [];

    const width = 800;
    const height = 470;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(175, 70 + entities.length * 12);

    return entities.map((entity, index) => {
      const angle = (2 * Math.PI * index) / entities.length - Math.PI / 2;
      return {
        ...entity,
        kind: kindFor(entity.entity_type),
        x: entities.length === 1 ? centerX : centerX + Math.cos(angle) * radius,
        y: entities.length === 1 ? centerY : centerY + Math.sin(angle) * radius,
        gap: gapIds.has(entity.id),
      };
    });
  }, [analysis, gapIds]);

  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const fill = (node: VisualNode) => {
    if (node.gap) return "var(--color-gold)";
    if (node.kind === "person") return "var(--color-primary)";
    if (node.kind === "liability") return "var(--color-secondary)";
    return "var(--color-accent)";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">Map</p>
          <h1 className="mt-2 text-4xl">Who holds what — and where knowledge breaks.</h1>
        </div>
        <div className="card-surface flex min-h-[300px] items-center justify-center p-8 text-center text-muted-foreground">
          Building your household knowledge graph...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">Map</p>
          <h1 className="mt-2 text-4xl">Who holds what — and where knowledge breaks.</h1>
        </div>
        <div className="card-surface space-y-4 p-8 text-center">
          <p className="text-destructive">Unable to load your household graph.</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={() => void loadGraph()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analysis || analysis.entities.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">Map</p>
          <h1 className="mt-2 text-4xl">Your household knowledge graph is not ready yet.</h1>
          <p className="mt-2 text-muted-foreground">Upload and confirm household documents to start building your graph.</p>
        </div>
        <div className="card-surface p-8 text-center">
          <button onClick={() => navigate({ to: "/upload" })} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Upload documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Map</p>
        <h1 className="mt-2 text-4xl">Who holds what — and where knowledge breaks.</h1>
        <p className="mt-2 text-muted-foreground">Gold nodes are gaps returned by the household graph analysis.</p>
      </div>

      <div className="card-surface overflow-x-auto p-4">
        <svg viewBox="0 0 800 470" className="min-w-[640px]" role="img" aria-label="Household knowledge graph">
          {analysis.relationships.map((edge, index) => {
            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            if (!source || !target) return null;
            return (
              <g key={`${edge.source}-${edge.target}-${edge.relationship}-${index}`}>
                <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="var(--color-border)" strokeWidth="2" />
                <text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 5} textAnchor="middle" fontSize="10" fill="var(--color-muted-foreground)" fontFamily="var(--font-mono)">
                  {edge.relationship}
                </text>
              </g>
            );
          })}
          {nodes.map((node) => (
            <g key={node.id}>
              <rect x={node.x - 78} y={node.y - 20} width="156" height="40" rx="20" fill={fill(node)} stroke="var(--color-foreground)" strokeOpacity=".15" />
              <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="13" fontFamily="var(--font-sans)" fill={node.kind === "person" && !node.gap ? "var(--color-primary-foreground)" : "var(--color-foreground)"}>
                {labelFor(node)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {analysis.gaps.length > 0 && (
        <section className="card-surface p-5">
          <div className="mb-4">
            <p className="eyebrow">Knowledge gaps</p>
            <h2 className="mt-1 text-2xl">What still needs attention</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {analysis.gaps.map((gap) => (
              <div key={`${gap.gap_type}-${gap.entity_id}`} className="rounded-md border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{gap.title}</p>
                  <span className="eyebrow">{gap.severity}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{gap.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {analysis.actions.length > 0 && (
        <section className="card-surface p-5">
          <div className="mb-4">
            <p className="eyebrow">Day-Zero</p>
            <h2 className="mt-1 text-2xl">Actions generated from these gaps</h2>
          </div>
          <div className="space-y-3">
            {analysis.actions.map((action) => (
              <div key={`${action.gap_type}-${action.entity_id}`} className="rounded-md border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{action.title}</p>
                  <span className="eyebrow">{action.priority}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

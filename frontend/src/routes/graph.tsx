import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  apiAnalyzeGraph,
  type GraphAnalysis,
  type GraphEntity,
} from "@/lib/api";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      {
        title: "Household Knowledge Graph — Continuum",
      },
      {
        name: "description",
        content:
          "People, accounts and documents mapped together, with gaps highlighted.",
      },
      {
        property: "og:title",
        content:
          "Household Knowledge Graph — Continuum",
      },
      {
        property: "og:description",
        content:
          "People, accounts and documents mapped together, with gaps highlighted.",
      },
    ],
  }),
  component: Graph,
});

/* ============================================================
   TYPES
   ============================================================ */

type NodeKind =
  | "person"
  | "asset"
  | "liability"
  | "contact"
  | "document"
  | "other";

type Position = {
  x: number;
  y: number;
};

type VisualNode = GraphEntity & {
  x: number;
  y: number;
  kind: NodeKind;
  gap: boolean;
  role: string;
};

/* ============================================================
   CONSTANTS
   ============================================================ */

const VIEWBOX_WIDTH = 960;
const VIEWBOX_HEIGHT = 600;

const NODE_WIDTH = 174;
const NODE_HEIGHT = 58;

/* ============================================================
   HELPERS
   ============================================================ */

const kindFor = (
  entityType: string,
): NodeKind => {
  switch (entityType.toUpperCase()) {
    case "PERSON":
      return "person";

    case "ASSET":
      return "asset";

    case "LIABILITY":
      return "liability";

    case "CONTACT":
      return "contact";

    case "DOCUMENT":
      return "document";

    default:
      return "other";
  }
};

const kindLabel = (
  kind: NodeKind,
): string => {
  switch (kind) {
    case "person":
      return "PERSON";

    case "asset":
      return "ASSET";

    case "liability":
      return "LIABILITY";

    case "contact":
      return "CONTACT";

    case "document":
      return "DOCUMENT";

    default:
      return "ENTITY";
  }
};

const kindDescription = (
  kind: NodeKind,
): string => {
  switch (kind) {
    case "person":
      return "Household person";

    case "asset":
      return "Household asset";

    case "liability":
      return "Financial liability";

    case "contact":
      return "Emergency contact";

    case "document":
      return "Supporting document";

    default:
      return "Household entity";
  }
};

function distributePositions(
  count: number,
  centerX: number,
  y: number,
  spread = 700,
): Position[] {
  if (count === 0) {
    return [];
  }

  if (count === 1) {
    return [
      {
        x: centerX,
        y,
      },
    ];
  }

  const usableSpread = Math.min(
    spread,
    Math.max(260, count * 190),
  );

  const startX =
    centerX - usableSpread / 2;

  const step =
    usableSpread / (count - 1);

  return Array.from(
    { length: count },
    (_, index) => ({
      x: startX + index * step,
      y,
    }),
  );
}

function distributeVertical(
  count: number,
  x: number,
  centerY: number,
  spacing = 90,
): Position[] {
  if (count === 0) {
    return [];
  }

  const totalHeight =
    (count - 1) * spacing;

  const startY =
    centerY - totalHeight / 2;

  return Array.from(
    { length: count },
    (_, index) => ({
      x,
      y: startY + index * spacing,
    }),
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

function Graph() {
  const navigate = useNavigate();

  const [analysis, setAnalysis] =
    useState<GraphAnalysis | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedNodeId, setSelectedNodeId] =
    useState<string | null>(null);

  /* ----------------------------------------------------------
     LOAD GRAPH
     ---------------------------------------------------------- */

  const loadGraph = async () => {
    setLoading(true);
    setError("");

    try {
      const result =
        await apiAnalyzeGraph();

      setAnalysis(result);
      setSelectedNodeId(null);
    } catch (err) {
      setAnalysis(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your household graph.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGraph();
  }, []);

  /* ----------------------------------------------------------
     GAP IDS
     ---------------------------------------------------------- */

  const gapIds = useMemo(
    () =>
      new Set(
        (analysis?.gaps ?? []).map(
          (gap) => gap.entity_id,
        ),
      ),
    [analysis],
  );

  /* ==========================================================
     SEMANTIC ROLES
     ========================================================== */

  const roleById = useMemo(() => {
    const roles = new Map<
      string,
      string
    >();

    if (!analysis) {
      return roles;
    }

    const ownerIds =
      new Set<string>();

    const beneficiaryIds =
      new Set<string>();

    for (const relationship of analysis.relationships) {
      if (
        relationship.relationship ===
          "OWNS" ||
        relationship.relationship ===
          "BORROWS" ||
        relationship.relationship ===
          "HAS_CONTACT"
      ) {
        ownerIds.add(
          relationship.source,
        );
      }

      if (
        relationship.relationship ===
        "HAS_BENEFICIARY"
      ) {
        beneficiaryIds.add(
          relationship.target,
        );
      }
    }

    for (const entity of analysis.entities) {
      const kind = kindFor(
        entity.entity_type,
      );

      if (kind !== "person") {
        continue;
      }

      if (ownerIds.has(entity.id)) {
        roles.set(
          entity.id,
          "HOUSEHOLD OWNER",
        );
      } else if (
        beneficiaryIds.has(entity.id)
      ) {
        roles.set(
          entity.id,
          "BENEFICIARY",
        );
      } else {
        roles.set(
          entity.id,
          "PERSON",
        );
      }
    }

    return roles;
  }, [analysis]);

  /* ==========================================================
     RELATIONSHIP-AWARE LAYOUT
     ========================================================== */

  const nodes = useMemo<VisualNode[]>(
    () => {
      if (!analysis) {
        return [];
      }

      const entities =
        analysis.entities;

      if (entities.length === 0) {
        return [];
      }

      const ownerIds =
        new Set<string>();

      const beneficiaryIds =
        new Set<string>();

      const contactIds =
        new Set<string>();

      for (const relationship of analysis.relationships) {
        if (
          relationship.relationship ===
            "OWNS" ||
          relationship.relationship ===
            "BORROWS" ||
          relationship.relationship ===
            "HAS_CONTACT"
        ) {
          ownerIds.add(
            relationship.source,
          );
        }

        if (
          relationship.relationship ===
          "HAS_BENEFICIARY"
        ) {
          beneficiaryIds.add(
            relationship.target,
          );
        }

        if (
          relationship.relationship ===
          "HAS_CONTACT"
        ) {
          contactIds.add(
            relationship.target,
          );
        }
      }

      /* --------------------------------------------------------
         OWNER
         -------------------------------------------------------- */

      const owner =
        entities.find(
          (entity) =>
            ownerIds.has(entity.id) &&
            kindFor(
              entity.entity_type,
            ) === "person",
        ) ??
        entities.find(
          (entity) =>
            kindFor(
              entity.entity_type,
            ) === "person",
        );

      /* --------------------------------------------------------
         ASSETS
         -------------------------------------------------------- */

      const assetEntities =
        entities.filter(
          (entity) =>
            kindFor(
              entity.entity_type,
            ) === "asset" &&
            entity.id !== owner?.id,
        );

      /* --------------------------------------------------------
         LIABILITIES
         -------------------------------------------------------- */

      const liabilityEntities =
        entities.filter(
          (entity) =>
            kindFor(
              entity.entity_type,
            ) === "liability",
        );

      /* --------------------------------------------------------
         CONTACTS
         -------------------------------------------------------- */

      const contactEntities =
        entities.filter(
          (entity) =>
            kindFor(
              entity.entity_type,
            ) === "contact" &&
            contactIds.has(entity.id),
        );

      /* --------------------------------------------------------
         BENEFICIARIES
         -------------------------------------------------------- */

      const beneficiaryEntities =
        entities.filter(
          (entity) =>
            kindFor(
              entity.entity_type,
            ) === "person" &&
            beneficiaryIds.has(entity.id) &&
            entity.id !== owner?.id,
        );

      /* --------------------------------------------------------
         OTHER ENTITIES
         -------------------------------------------------------- */

      const otherEntities =
        entities.filter(
          (entity) => {
            const kind =
              kindFor(
                entity.entity_type,
              );

            const isOwner =
              owner?.id === entity.id;

            const isAsset =
              assetEntities.some(
                (item) =>
                  item.id ===
                  entity.id,
              );

            const isLiability =
              liabilityEntities.some(
                (item) =>
                  item.id ===
                  entity.id,
              );

            const isContact =
              contactEntities.some(
                (item) =>
                  item.id ===
                  entity.id,
              );

            const isBeneficiary =
              beneficiaryEntities.some(
                (item) =>
                  item.id ===
                  entity.id,
              );

            return (
              !isOwner &&
              !isAsset &&
              !isLiability &&
              !isContact &&
              !isBeneficiary &&
              kind !== "person"
            );
          },
        );

      /* --------------------------------------------------------
         POSITION MAP
         -------------------------------------------------------- */

      const positionById =
        new Map<string, Position>();

      /* Owner at the top-center */

      if (owner) {
        positionById.set(
          owner.id,
          {
            x:
              VIEWBOX_WIDTH / 2,
            y: 72,
          },
        );
      }

      /* Assets */

      const assetPositions =
        distributePositions(
          assetEntities.length,
          VIEWBOX_WIDTH / 2,
          225,
          680,
        );

      assetEntities.forEach(
        (entity, index) => {
          const position =
            assetPositions[index];

          if (position) {
            positionById.set(
              entity.id,
              position,
            );
          }
        },
      );

      /* Contacts on left */

      const contactPositions =
        distributeVertical(
          contactEntities.length,
          125,
          385,
          92,
        );

      contactEntities.forEach(
        (entity, index) => {
          const position =
            contactPositions[index];

          if (position) {
            positionById.set(
              entity.id,
              position,
            );
          }
        },
      );

      /* Beneficiaries on right */

      const beneficiaryPositions =
        distributeVertical(
          beneficiaryEntities.length,
          835,
          385,
          92,
        );

      beneficiaryEntities.forEach(
        (entity, index) => {
          const position =
            beneficiaryPositions[index];

          if (position) {
            positionById.set(
              entity.id,
              position,
            );
          }
        },
      );

      /* Liabilities at bottom */

      const liabilityPositions =
        distributePositions(
          liabilityEntities.length,
          VIEWBOX_WIDTH / 2,
          495,
          500,
        );

      liabilityEntities.forEach(
        (entity, index) => {
          const position =
            liabilityPositions[index];

          if (position) {
            positionById.set(
              entity.id,
              position,
            );
          }
        },
      );

      /* Other entities */

      const otherPositions =
        distributePositions(
          otherEntities.length,
          VIEWBOX_WIDTH / 2,
          390,
          600,
        );

      otherEntities.forEach(
        (entity, index) => {
          const position =
            otherPositions[index];

          if (position) {
            positionById.set(
              entity.id,
              position,
            );
          }
        },
      );

      /* --------------------------------------------------------
         FINAL FALLBACK
         -------------------------------------------------------- */

      entities.forEach(
        (entity, index) => {
          if (
            !positionById.has(
              entity.id,
            )
          ) {
            positionById.set(
              entity.id,
              {
                x:
                  100 +
                  ((index * 150) %
                    760),
                y: 300,
              },
            );
          }
        },
      );

      /* --------------------------------------------------------
         BUILD VISUAL NODES
         -------------------------------------------------------- */

      return entities.map(
        (entity) => {
          const kind =
            kindFor(
              entity.entity_type,
            );

          const position =
            positionById.get(
              entity.id,
            );

          return {
            ...entity,

            kind,

            x:
              position?.x ??
              VIEWBOX_WIDTH / 2,

            y:
              position?.y ??
              VIEWBOX_HEIGHT / 2,

            gap: gapIds.has(
              entity.id,
            ),

            /*
             * IMPORTANT:
             * role is ALWAYS a string.
             * This fixes the TypeScript
             * string | undefined error.
             */
            role:
              roleById.get(
                entity.id,
              ) ??
              kindLabel(kind),
          };
        },
      );
    },
    [
      analysis,
      gapIds,
      roleById,
    ],
  );

  /* ==========================================================
     NODE LOOKUP
     ========================================================== */

  const nodeById = useMemo(
    () =>
      new Map(
        nodes.map((node) => [
          node.id,
          node,
        ]),
      ),
    [nodes],
  );

  /* ==========================================================
     CONNECTED NODE IDS
     ========================================================== */

  const connectedNodeIds =
    useMemo(() => {
      if (
        !selectedNodeId ||
        !analysis
      ) {
        return new Set<string>();
      }

      const connected =
        new Set<string>([
          selectedNodeId,
        ]);

      for (const relationship of analysis.relationships) {
        if (
          relationship.source ===
          selectedNodeId
        ) {
          connected.add(
            relationship.target,
          );
        }

        if (
          relationship.target ===
          selectedNodeId
        ) {
          connected.add(
            relationship.source,
          );
        }
      }

      return connected;
    }, [
      selectedNodeId,
      analysis,
    ]);

  /* ==========================================================
     NODE COLORS
     ========================================================== */

  const fill = (
    node: VisualNode,
  ): string => {
    if (node.gap) {
      return "var(--color-gold)";
    }

    switch (node.kind) {
      case "person":
        return "var(--color-primary)";

      case "asset":
        return "var(--color-accent)";

      case "liability":
        return "var(--color-secondary)";

      case "contact":
        return "var(--color-accent)";

      case "document":
        return "var(--color-card)";

      default:
        return "var(--color-card)";
    }
  };

  const textFill = (
    node: VisualNode,
  ): string => {
    if (
      node.kind === "person" &&
      !node.gap
    ) {
      return "var(--color-primary-foreground)";
    }

    return "var(--color-foreground)";
  };

  const isNodeDimmed = (
    node: VisualNode,
  ): boolean => {
    if (!selectedNodeId) {
      return false;
    }

    return !connectedNodeIds.has(
      node.id,
    );
  };

  /* ==========================================================
     EDGE PATH
     ========================================================== */

  const edgePath = (
    source: VisualNode,
    target: VisualNode,
    edgeIndex: number,
  ): string => {
    const dx =
      target.x - source.x;

    const dy =
      target.y - source.y;

    const distance = Math.sqrt(
      dx * dx + dy * dy,
    );

    if (distance === 0) {
      return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
    }

    const nx =
      -dy / distance;

    const ny =
      dx / distance;

    const curveAmount =
      edgeIndex % 2 === 0
        ? 18
        : -18;

    const controlX =
      (source.x + target.x) /
        2 +
      nx * curveAmount;

    const controlY =
      (source.y + target.y) /
        2 +
      ny * curveAmount;

    return `
      M ${source.x} ${source.y}
      Q ${controlX} ${controlY}
        ${target.x} ${target.y}
    `;
  };

  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">
            Map
          </p>

          <h1 className="mt-2 text-4xl">
            Who holds what — and where
            knowledge breaks.
          </h1>

          <p className="mt-2 text-muted-foreground">
            Building the household
            responsibility map...
          </p>
        </div>

        <div className="card-surface flex min-h-[420px] items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />

            <p className="font-medium">
              Building your household
              knowledge graph...
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Connecting people, assets,
              liabilities and
              responsibilities.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR
     ========================================================== */

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">
            Map
          </p>

          <h1 className="mt-2 text-4xl">
            Who holds what — and where
            knowledge breaks.
          </h1>
        </div>

        <div className="card-surface space-y-4 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-xl">
            !
          </div>

          <p className="font-medium text-destructive">
            Unable to load your
            household graph.
          </p>

          <p className="text-sm text-muted-foreground">
            {error}
          </p>

          <button
            onClick={() =>
              void loadGraph()
            }
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ==========================================================
     EMPTY STATE
     ========================================================== */

  if (
    !analysis ||
    analysis.entities.length === 0
  ) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">
            Map
          </p>

          <h1 className="mt-2 text-4xl">
            Your household knowledge
            graph is not ready yet.
          </h1>

          <p className="mt-2 text-muted-foreground">
            Upload and confirm household
            documents to start building
            your graph.
          </p>
        </div>

        <div className="card-surface p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl">
            ◎
          </div>

          <p className="font-medium">
            No confirmed household
            relationships yet.
          </p>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Continuum will turn confirmed
            information into a map of
            ownership, responsibility and
            knowledge gaps.
          </p>

          <button
            onClick={() =>
              navigate({
                to: "/upload",
              })
            }
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Upload documents
          </button>
        </div>
      </div>
    );
  }

  const selectedNode =
    selectedNodeId
      ? nodeById.get(
          selectedNodeId,
        )
      : undefined;

  /* ==========================================================
     MAIN UI
     ========================================================== */

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">
            Map
          </p>

          <h1 className="mt-2 text-4xl">
            Who holds what — and where
            knowledge breaks.
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            See how household people,
            assets, liabilities and
            responsibilities connect —
            and where Continuum finds a
            gap.
          </p>
        </div>

        <button
          onClick={() =>
            void loadGraph()
          }
          disabled={loading}
          className="self-start rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 md:self-auto"
        >
          ↻ Refresh map
        </button>
      </div>

      {/* ======================================================
          STATS
          ====================================================== */}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card-surface p-4">
          <p className="eyebrow">
            Entities
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {analysis.entities.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            People, assets and records
          </p>
        </div>

        <div className="card-surface p-4">
          <p className="eyebrow">
            Relationships
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {analysis.relationships.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Known household connections
          </p>
        </div>

        <div className="card-surface p-4">
          <p className="eyebrow">
            Knowledge gaps
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {analysis.gaps.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Requiring attention
          </p>
        </div>

        <div className="card-surface p-4">
          <p className="eyebrow">
            Day-Zero actions
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {analysis.actions.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Generated from gaps
          </p>
        </div>
      </div>

      {/* ======================================================
          GRAPH
          ====================================================== */}

      <div className="card-surface overflow-hidden">
        <div className="border-b px-5 py-4">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">
                Household responsibility map
              </p>

              <p className="text-sm text-muted-foreground">
                Hover over a node to trace
                its relationships. Click to
                keep it selected.
              </p>
            </div>

            {selectedNode && (
              <button
                onClick={() =>
                  setSelectedNodeId(null)
                }
                className="self-start rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted md:self-auto"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            className="min-w-[760px] w-full"
            role="img"
            aria-label="Interactive household knowledge graph"
          >
            <defs>
              {/* Arrow */}
              <marker
                id="graph-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill="var(--color-border)"
                />
              </marker>

              {/* Shadow */}
              <filter
                id="node-shadow"
                x="-30%"
                y="-30%"
                width="160%"
                height="170%"
              >
                <feDropShadow
                  dx="0"
                  dy="3"
                  stdDeviation="4"
                  floodOpacity=".10"
                />
              </filter>
            </defs>

            {/* Graph background */}
            <rect
              x="25"
              y="25"
              width="910"
              height="550"
              rx="20"
              fill="var(--color-background)"
              stroke="var(--color-border)"
              strokeWidth="1"
            />

            {/* Section title */}
            <text
              x="480"
              y="120"
              textAnchor="middle"
              fontSize="10"
              letterSpacing="2"
              fill="var(--color-muted-foreground)"
              fontFamily="var(--font-mono)"
            >
              HOUSEHOLD RESPONSIBILITY
            </text>

            <text
              x="480"
              y="165"
              textAnchor="middle"
              fontSize="10"
              letterSpacing="1.5"
              fill="var(--color-muted-foreground)"
              fontFamily="var(--font-mono)"
            >
              ASSETS
            </text>

            {/* ==================================================
                RELATIONSHIP EDGES
                ================================================== */}

            {analysis.relationships.map(
              (edge, index) => {
                const source =
                  nodeById.get(
                    edge.source,
                  );

                const target =
                  nodeById.get(
                    edge.target,
                  );

                if (
                  !source ||
                  !target
                ) {
                  return null;
                }

                const active =
                  !selectedNodeId ||
                  (connectedNodeIds.has(
                    source.id,
                  ) &&
                    connectedNodeIds.has(
                      target.id,
                    ));

                const path =
                  edgePath(
                    source,
                    target,
                    index,
                  );

                const labelX =
                  (source.x +
                    target.x) /
                  2;

                const labelY =
                  (source.y +
                    target.y) /
                  2;

                const labelWidth =
                  Math.max(
                    62,
                    edge.relationship
                      .length *
                      6.3 +
                      20,
                  );

                return (
                  <g
                    key={`${edge.source}-${edge.target}-${edge.relationship}-${index}`}
                    opacity={
                      active ? 1 : 0.16
                    }
                    className="transition-opacity duration-200"
                  >
                    <path
                      d={path}
                      fill="none"
                      stroke="var(--color-border)"
                      strokeWidth={
                        active ? 2 : 1.5
                      }
                      markerEnd={
                        active
                          ? "url(#graph-arrow)"
                          : undefined
                      }
                    />

                    {/* Relationship badge */}
                    <rect
                      x={
                        labelX -
                        labelWidth / 2
                      }
                      y={
                        labelY - 11
                      }
                      width={
                        labelWidth
                      }
                      height="22"
                      rx="11"
                      fill="var(--color-background)"
                      stroke="var(--color-border)"
                      strokeWidth="1"
                    />

                    <text
                      x={labelX}
                      y={labelY + 3}
                      textAnchor="middle"
                      fontSize="9"
                      letterSpacing=".5"
                      fill="var(--color-muted-foreground)"
                      fontFamily="var(--font-mono)"
                    >
                      {edge.relationship}
                    </text>
                  </g>
                );
              },
            )}

            {/* ==================================================
                NODES
                ================================================== */}

            {nodes.map(
              (node) => {
                const dimmed =
                  isNodeDimmed(node);

                const isSelected =
                  selectedNodeId ===
                  node.id;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    opacity={
                      dimmed ? 0.22 : 1
                    }
                    className="cursor-pointer transition-opacity duration-200"
                    onClick={() =>
                      setSelectedNodeId(
                        isSelected
                          ? null
                          : node.id,
                      )
                    }
                    onMouseEnter={() => {
                      if (
                        !selectedNodeId
                      ) {
                        setSelectedNodeId(
                          node.id,
                        );
                      }
                    }}
                    onMouseLeave={() => {
                      if (
                        !selectedNodeId
                      ) {
                        setSelectedNodeId(
                          null,
                        );
                      }
                    }}
                  >
                    <title>
                      {node.name}
                      {" — "}
                      {kindDescription(
                        node.kind,
                      )}
                      {node.gap
                        ? " — Knowledge gap"
                        : ""}
                    </title>

                    {/* Selected outline */}
                    {isSelected && (
                      <rect
                        x={
                          -NODE_WIDTH /
                            2 -
                          5
                        }
                        y={
                          -NODE_HEIGHT /
                            2 -
                          5
                        }
                        width={
                          NODE_WIDTH + 10
                        }
                        height={
                          NODE_HEIGHT + 10
                        }
                        rx="20"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="2"
                        strokeOpacity=".35"
                      />
                    )}

                    {/* Main node */}
                    <rect
                      x={
                        -NODE_WIDTH / 2
                      }
                      y={
                        -NODE_HEIGHT / 2
                      }
                      width={
                        NODE_WIDTH
                      }
                      height={
                        NODE_HEIGHT
                      }
                      rx={
                        node.kind ===
                        "person"
                          ? 29
                          : 14
                      }
                      fill={fill(node)}
                      stroke={
                        node.gap
                          ? "var(--color-gold)"
                          : "var(--color-foreground)"
                      }
                      strokeOpacity={
                        node.gap
                          ? 0.9
                          : 0.12
                      }
                      strokeWidth={
                        node.gap ? 2 : 1
                      }
                      filter="url(#node-shadow)"
                    />

                    {/* Gap indicator */}
                    {node.gap && (
                      <circle
                        cx={
                          NODE_WIDTH /
                            2 -
                          8
                        }
                        cy={
                          -NODE_HEIGHT /
                            2 +
                          8
                        }
                        r="8"
                        fill="var(--color-background)"
                        stroke="var(--color-gold)"
                        strokeWidth="2"
                      />
                    )}

                    {/* Node role */}
                    <text
                      x="0"
                      y="-7"
                      textAnchor="middle"
                      fontSize="8"
                      letterSpacing="1.4"
                      fontFamily="var(--font-mono)"
                      fill={
                        node.kind ===
                          "person" &&
                        !node.gap
                          ? "var(--color-primary-foreground)"
                          : "var(--color-muted-foreground)"
                      }
                      opacity={
                        node.kind ===
                          "person" &&
                        !node.gap
                          ? 0.75
                          : 1
                      }
                    >
                      {node.gap
                        ? "⚠ GAP"
                        : node.role}
                    </text>

                    {/* Name */}
                    <text
                      x="0"
                      y="12"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight={
                        node.kind ===
                        "person"
                          ? "600"
                          : "500"
                      }
                      fontFamily="var(--font-sans)"
                      fill={textFill(
                        node,
                      )}
                    >
                      {node.name.length >
                      22
                        ? `${node.name.slice(
                            0,
                            21,
                          )}…`
                        : node.name}
                    </text>

                    {/* Gap ! */}
                    {node.gap && (
                      <text
                        x={
                          NODE_WIDTH /
                            2 -
                          8
                        }
                        y={
                          -NODE_HEIGHT /
                            2 +
                          11
                        }
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="700"
                        fill="var(--color-gold)"
                      >
                        !
                      </text>
                    )}
                  </g>
                );
              },
            )}
          </svg>
        </div>

        {/* =====================================================
            LEGEND
            ===================================================== */}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t px-5 py-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            Person
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-accent" />
            Asset
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-secondary" />
            Liability
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-gold" />
            Knowledge gap
          </div>

          <div className="ml-auto">
            Hover or click a node to trace
            relationships.
          </div>
        </div>
      </div>

      {/* ======================================================
          SELECTED NODE DETAILS
          ====================================================== */}

      {selectedNode && (
        <section className="card-surface overflow-hidden">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">
                Selected entity
              </p>

              <h2 className="mt-1 text-2xl">
                {selectedNode.name}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {selectedNode.gap
                  ? "This entity has a knowledge gap that needs attention."
                  : kindDescription(
                      selectedNode.kind,
                    )}
              </p>
            </div>

            <div
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                selectedNode.gap
                  ? "bg-gold/20 text-gold-foreground"
                  : "bg-accent text-accent-foreground"
              }`}
            >
              {selectedNode.gap
                ? "Knowledge gap"
                : selectedNode.role}
            </div>
          </div>

          <div className="border-t px-5 py-4">
            <p className="eyebrow mb-3">
              Connected relationships
            </p>

            <div className="grid gap-2 md:grid-cols-2">
              {analysis.relationships
                .filter(
                  (relationship) =>
                    relationship.source ===
                      selectedNode.id ||
                    relationship.target ===
                      selectedNode.id,
                )
                .map(
                  (
                    relationship,
                    index,
                  ) => {
                    const outgoing =
                      relationship.source ===
                      selectedNode.id;

                    const otherId =
                      outgoing
                        ? relationship.target
                        : relationship.source;

                    const other =
                      nodeById.get(
                        otherId,
                      );

                    if (!other) {
                      return null;
                    }

                    return (
                      <div
                        key={`${relationship.source}-${relationship.target}-${relationship.relationship}-${index}`}
                        className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <span className="truncate font-medium">
                          {outgoing
                            ? relationship.relationship
                            : `← ${relationship.relationship}`}
                        </span>

                        <span className="ml-3 truncate text-muted-foreground">
                          {other.name}
                        </span>
                      </div>
                    );
                  },
                )}

              {analysis.relationships.filter(
                (relationship) =>
                  relationship.source ===
                    selectedNode.id ||
                  relationship.target ===
                    selectedNode.id,
              ).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No relationships recorded
                  for this entity yet.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================
          KNOWLEDGE GAPS
          ====================================================== */}

      {analysis.gaps.length > 0 && (
        <section className="card-surface p-5">
          <div className="mb-4">
            <p className="eyebrow">
              Knowledge gaps
            </p>

            <h2 className="mt-1 text-2xl">
              What still needs attention
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              These gaps are detected from
              the confirmed household graph,
              not from assumptions.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {analysis.gaps.map(
              (gap) => (
                <button
                  key={`${gap.gap_type}-${gap.entity_id}`}
                  onClick={() =>
                    setSelectedNodeId(
                      gap.entity_id,
                    )
                  }
                  className="rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:bg-muted"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {gap.title}
                    </p>

                    <span className="rounded-full bg-gold/20 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-gold-foreground">
                      {gap.severity}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {gap.reason}
                  </p>
                </button>
              ),
            )}
          </div>
        </section>
      )}

      {/* ======================================================
          DAY-ZERO ACTIONS
          ====================================================== */}

      {analysis.actions.length > 0 && (
        <section className="card-surface p-5">
          <div className="mb-4">
            <p className="eyebrow">
              Day-Zero
            </p>

            <h2 className="mt-1 text-2xl">
              Actions generated from these
              gaps
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Continuum turns missing
              knowledge into concrete
              next actions.
            </p>
          </div>

          <div className="space-y-3">
            {analysis.actions.map(
              (action, index) => (
                <div
                  key={`${action.gap_type}-${action.entity_id}-${index}`}
                  className="group rounded-lg border p-4 transition hover:bg-muted"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 font-mono text-xs font-semibold text-gold-foreground">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {action.title}
                        </p>

                        <span className="rounded-full bg-accent px-2 py-1 font-mono text-[10px] uppercase tracking-wide">
                          {action.priority}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {/* ======================================================
          HEALTHY STATE
          ====================================================== */}

      {analysis.gaps.length === 0 && (
        <section className="card-surface border-success/30 bg-success/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
              ✓
            </div>

            <div>
              <h2 className="font-medium">
                No knowledge gaps detected
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Continuum currently has a
                complete set of supported
                relationships for the
                confirmed household data.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
<<<<<<< Updated upstream
import { createFileRoute } from "@tanstack/react-router";
import { computeScores, useStore } from "@/lib/store";
=======
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  apiAnalyzeGraph,
  type GraphAnalysis,
  type GraphEntity,
} from "@/lib/api";
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Search,
  Filter,
  AlertTriangle,
  ArrowRight,
  Shield,
  FileText,
  User,
  Landmark,
  CreditCard,
  Phone,
  RefreshCw,
  Info,
  Maximize2,
  Minimize2,
} from "lucide-react";
>>>>>>> Stashed changes

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
<<<<<<< Updated upstream
      { title: "Household Knowledge Graph — Continuum" },
      { name: "description", content: "People, accounts and documents mapped together, with gaps highlighted." },
      { property: "og:title", content: "Household Knowledge Graph — Continuum" },
      { property: "og:description", content: "People, accounts and documents mapped together, with gaps highlighted." },
=======
      {
        title: "3D Knowledge Graph — Continuum Vault",
      },
      {
        name: "description",
        content:
          "Interactive 3D spatial mapping of household people, assets, obligations, and continuity readiness gaps.",
      },
>>>>>>> Stashed changes
    ],
  }),
  component: Graph3DPage,
});

<<<<<<< Updated upstream
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
=======
/* ============================================================
   3D TYPES & MATH
   ============================================================ */

type NodeKind = "person" | "asset" | "liability" | "contact" | "document" | "other";

type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type Node3D = GraphEntity & {
  x: number;
  y: number;
  z: number;
  baseRadius: number;
  kind: NodeKind;
  gap: boolean;
  role: string;
};

type ProjectedNode = Node3D & {
  projX: number;
  projY: number;
  projZ: number;
  scale: number;
  screenRadius: number;
  visible: boolean;
};

const kindFor = (entityType: string): NodeKind => {
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

const kindIcon = (kind: NodeKind) => {
  switch (kind) {
    case "person":
      return User;
    case "asset":
      return Landmark;
    case "liability":
      return CreditCard;
    case "contact":
      return Phone;
    case "document":
      return FileText;
    default:
      return Shield;
  }
};

/* Restrained Editorial Palette */
const getNodeTheme = (kind: NodeKind, hasGap: boolean) => {
  if (hasGap) {
    return {
      fill: "#fffbeb",
      stroke: "#d97706",
      badgeBg: "#fef3c7",
      badgeText: "#92400e",
      label: "#92400e",
      accent: "#b45309",
    };
  }

  switch (kind) {
    case "person":
      return {
        fill: "#f8fafc",
        stroke: "#0f172a",
        badgeBg: "#0f172a",
        badgeText: "#ffffff",
        label: "#0f172a",
        accent: "#334155",
      };
    case "asset":
      return {
        fill: "#f0f9ff",
        stroke: "#0284c7",
        badgeBg: "#e0f2fe",
        badgeText: "#0369a1",
        label: "#0369a1",
        accent: "#0284c7",
      };
    case "liability":
      return {
        fill: "#faf5ff",
        stroke: "#7c3aed",
        badgeBg: "#f3e8ff",
        badgeText: "#6d28d9",
        label: "#6d28d9",
        accent: "#7c3aed",
      };
    case "contact":
      return {
        fill: "#ecfdf5",
        stroke: "#059669",
        badgeBg: "#d1fae5",
        badgeText: "#047857",
        label: "#047857",
        accent: "#059669",
      };
    case "document":
      return {
        fill: "#f1f5f9",
        stroke: "#64748b",
        badgeBg: "#e2e8f0",
        badgeText: "#334155",
        label: "#334155",
        accent: "#64748b",
      };
    default:
      return {
        fill: "#f8fafc",
        stroke: "#94a3b8",
        badgeBg: "#f1f5f9",
        badgeText: "#475569",
        label: "#475569",
        accent: "#64748b",
      };
  }
};

function Graph3DPage() {
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState<GraphAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  // Selection & Hover
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // 3D Canvas Controls
  const [autoRotate, setAutoRotate] = useState(true);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mutable camera rotation angles and pan offsets
  const camState = useRef({
    rotX: 0.28,
    rotY: -0.45,
    targetRotX: 0.28,
    targetRotY: -0.45,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
    zoom: 1,
  });

  /* ----------------------------------------------------------
     LOAD REAL GRAPH DATA
     ---------------------------------------------------------- */
  const loadGraph = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiAnalyzeGraph();
      setAnalysis(result);
      setSelectedNodeId(null);
    } catch (err) {
      setAnalysis(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load household knowledge graph.",
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
  const gapIds = useMemo(() => {
    return new Set((analysis?.gaps ?? []).map((g) => g.entity_id));
  }, [analysis]);

  /* ----------------------------------------------------------
     SEMANTIC ROLES
     ---------------------------------------------------------- */
  const roleById = useMemo(() => {
    const roles = new Map<string, string>();
    if (!analysis) return roles;

    const ownerIds = new Set<string>();
    const beneficiaryIds = new Set<string>();

    for (const rel of analysis.relationships) {
      if (rel.relationship === "OWNS" || rel.relationship === "BORROWS" || rel.relationship === "HAS_CONTACT") {
        ownerIds.add(rel.source);
      }
      if (rel.relationship === "HAS_BENEFICIARY") {
        beneficiaryIds.add(rel.target);
      }
    }

    for (const entity of analysis.entities) {
      const kind = kindFor(entity.entity_type);
      if (kind !== "person") continue;

      if (ownerIds.has(entity.id)) {
        roles.set(entity.id, "HOUSEHOLD OWNER");
      } else if (beneficiaryIds.has(entity.id)) {
        roles.set(entity.id, "BENEFICIARY");
      } else {
        roles.set(entity.id, "PERSON");
      }
    }

    return roles;
  }, [analysis]);

  /* ----------------------------------------------------------
     TRUE 3D SPATIAL COORDINATE ASSIGNMENT
     ---------------------------------------------------------- */
  const nodes3D = useMemo<Node3D[]>(() => {
    if (!analysis || analysis.entities.length === 0) return [];

    const entities = analysis.entities;
    const people = entities.filter((e) => kindFor(e.entity_type) === "person");
    const assets = entities.filter((e) => kindFor(e.entity_type) === "asset");
    const liabilities = entities.filter((e) => kindFor(e.entity_type) === "liability");
    const contacts = entities.filter((e) => kindFor(e.entity_type) === "contact");
    const documents = entities.filter((e) => kindFor(e.entity_type) === "document");
    const others = entities.filter(
      (e) =>
        kindFor(e.entity_type) === "other" ||
        (!people.includes(e) && !assets.includes(e) && !liabilities.includes(e) && !contacts.includes(e) && !documents.includes(e)),
    );

    const result: Node3D[] = [];

    // Layer 1: Primary Persons (center front: z = -120 to -60)
    people.forEach((p, idx) => {
      const angle = (idx / Math.max(people.length, 1)) * Math.PI * 2;
      const r = people.length > 1 ? 90 : 0;
      result.push({
        ...p,
        x: Math.cos(angle) * r,
        y: -100 + Math.sin(angle) * 30,
        z: -100 + (idx * 25),
        baseRadius: 32,
        kind: "person",
        gap: gapIds.has(p.id),
        role: roleById.get(p.id) ?? "PERSON",
      });
    });

    // Layer 2: Assets (orbital mid-ring: z = -40 to 60)
    assets.forEach((a, idx) => {
      const angle = (idx / Math.max(assets.length, 1)) * Math.PI * 2 + 0.3;
      const r = 240;
      result.push({
        ...a,
        x: Math.cos(angle) * r,
        y: 30 + Math.sin(angle * 2) * 40,
        z: -20 + Math.sin(angle) * 110,
        baseRadius: 26,
        kind: "asset",
        gap: gapIds.has(a.id),
        role: "ASSET",
      });
    });

    // Layer 3: Liabilities (lower back plane: y = 140, z = 80)
    liabilities.forEach((l, idx) => {
      const spread = Math.min(300, liabilities.length * 120);
      const startX = -spread / 2;
      const step = liabilities.length > 1 ? spread / (liabilities.length - 1) : 0;
      result.push({
        ...l,
        x: startX + idx * step,
        y: 130,
        z: 70 + (idx % 2 === 0 ? 30 : -20),
        baseRadius: 24,
        kind: "liability",
        gap: gapIds.has(l.id),
        role: "LIABILITY",
      });
    });

    // Layer 4: Emergency Contacts (left wing: x = -260, z = 30)
    contacts.forEach((c, idx) => {
      result.push({
        ...c,
        x: -260 + (idx * 30),
        y: -30 + idx * 70,
        z: 40 + idx * 40,
        baseRadius: 24,
        kind: "contact",
        gap: gapIds.has(c.id),
        role: "CONTACT",
      });
    });

    // Layer 5: Documents (back plane: z = 160)
    documents.forEach((d, idx) => {
      const angle = (idx / Math.max(documents.length, 1)) * Math.PI * 2;
      const r = 180;
      result.push({
        ...d,
        x: Math.cos(angle) * r,
        y: -80 + Math.sin(angle) * 60,
        z: 160 + (idx * 20),
        baseRadius: 22,
        kind: "document",
        gap: gapIds.has(d.id),
        role: "DOCUMENT",
      });
    });

    // Others
    others.forEach((o, idx) => {
      result.push({
        ...o,
        x: 150 + (idx * 40),
        y: 100 + (idx * 30),
        z: 120,
        baseRadius: 22,
        kind: "other",
        gap: gapIds.has(o.id),
        role: "ENTITY",
      });
    });

    return result;
  }, [analysis, gapIds, roleById]);

  const nodeMap = useMemo(() => {
    return new Map<string, Node3D>(nodes3D.map((n) => [n.id, n]));
  }, [nodes3D]);

  // Connected nodes calculation
  const activeFocusId = hoveredNodeId || selectedNodeId;
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusId || !analysis) return new Set<string>();
    const set = new Set<string>([activeFocusId]);

    for (const rel of analysis.relationships) {
      if (rel.source === activeFocusId) set.add(rel.target);
      if (rel.target === activeFocusId) set.add(rel.source);
    }
    return set;
  }, [activeFocusId, analysis]);

  /* ----------------------------------------------------------
     CANVAS 3D RENDER LOOP
     ---------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.clientWidth || 900);
    let height = (canvas.height = canvas.clientHeight || 620);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };
    window.addEventListener("resize", onResize);

    // Keep projected nodes in ref for raycast/hit-testing
    const projectedNodesRef: ProjectedNode[] = [];

    // Pointer Event Listeners on Canvas
    const onMouseDown = (e: MouseEvent) => {
      camState.current.isDragging = true;
      camState.current.dragStartX = e.clientX;
      camState.current.dragStartY = e.clientY;
      camState.current.lastMouseX = e.clientX;
      camState.current.lastMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (camState.current.isDragging) {
        const dx = e.clientX - camState.current.lastMouseX;
        const dy = e.clientY - camState.current.lastMouseY;

        // Pan with Shift or right button
        if (e.shiftKey || e.buttons === 2) {
          camState.current.panX += dx;
          camState.current.panY += dy;
        } else {
          // Orbit rotation
          camState.current.targetRotY += dx * 0.007;
          camState.current.targetRotX += dy * 0.007;
          // Clamp pitch to prevent flipping
          camState.current.targetRotX = Math.max(-1.3, Math.min(1.3, camState.current.targetRotX));
        }

        camState.current.lastMouseX = e.clientX;
        camState.current.lastMouseY = e.clientY;
      } else {
        // Hit-test for hover
        let hit: string | null = null;
        // Search in reverse depth order (closest first)
        for (let i = projectedNodesRef.length - 1; i >= 0; i--) {
          const pn = projectedNodesRef[i];
          const dist = Math.hypot(mouseX - pn.projX, mouseY - pn.projY);
          if (dist <= pn.screenRadius + 8) {
            hit = pn.id;
            break;
          }
        }
        setHoveredNodeId(hit);
        canvas.style.cursor = hit ? "pointer" : camState.current.isDragging ? "grabbing" : "grab";
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!camState.current.isDragging) return;

      const totalDist = Math.hypot(
        e.clientX - camState.current.dragStartX,
        e.clientY - camState.current.dragStartY,
      );

      camState.current.isDragging = false;

      // Click detected if mouse didn't drag far
      if (totalDist < 5) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let hitId: string | null = null;
        for (let i = projectedNodesRef.length - 1; i >= 0; i--) {
          const pn = projectedNodesRef[i];
          const dist = Math.hypot(mouseX - pn.projX, mouseY - pn.projY);
          if (dist <= pn.screenRadius + 8) {
            hitId = pn.id;
            break;
          }
        }

        setSelectedNodeId((prev) => (prev === hitId ? null : hitId));
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * -0.0015;
      camState.current.zoom = Math.max(0.45, Math.min(2.4, camState.current.zoom + zoomDelta));
      setCameraZoom(camState.current.zoom);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // ----------------------------------------------------
    // Main 3D Render Loop
    // ----------------------------------------------------
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Auto-rotate if enabled and not currently dragging
      if (autoRotate && !camState.current.isDragging) {
        camState.current.targetRotY += 0.002;
      }

      // Smooth camera interpolation
      camState.current.rotX += (camState.current.targetRotX - camState.current.rotX) * 0.1;
      camState.current.rotY += (camState.current.targetRotY - camState.current.rotY) * 0.1;

      const rotX = camState.current.rotX;
      const rotY = camState.current.rotY;
      const zoom = camState.current.zoom;
      const panX = camState.current.panX;
      const panY = camState.current.panY;

      const cx = width / 2 + panX;
      const cy = height / 2 + panY;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // 3D Perspective Projection Function
      const project3D = (p: Vec3) => {
        // Rotate around Y
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;

        // Rotate around X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Perspective division (Camera FOV distance = 700)
        const cameraDist = 700;
        const depth = cameraDist + z2;
        const fov = 700;
        const scale = (fov / Math.max(80, depth)) * zoom;

        return {
          screenX: cx + x1 * scale,
          screenY: cy + y2 * scale,
          zDepth: z2,
          scale,
        };
      };

      // 1. Draw subtle 3D spatial floor grid
      const gridSize = 400;
      const gridSteps = 4;
      ctx.strokeStyle = "rgba(226, 232, 240, 0.6)";
      ctx.lineWidth = 1;
      for (let i = -gridSteps; i <= gridSteps; i++) {
        const offset = (i / gridSteps) * gridSize;
        const p1 = project3D({ x: offset, y: 160, z: -gridSize });
        const p2 = project3D({ x: offset, y: 160, z: gridSize });
        ctx.beginPath();
        ctx.moveTo(p1.screenX, p1.screenY);
        ctx.lineTo(p2.screenX, p2.screenY);
        ctx.stroke();

        const q1 = project3D({ x: -gridSize, y: 160, z: offset });
        const q2 = project3D({ x: gridSize, y: 160, z: offset });
        ctx.beginPath();
        ctx.moveTo(q1.screenX, q1.screenY);
        ctx.lineTo(q2.screenX, q2.screenY);
        ctx.stroke();
      }

      // 2. Project all nodes into camera space
      projectedNodesRef.length = 0;
      nodes3D.forEach((n) => {
        // Filter check
        const matchesFilter =
          selectedFilter === "ALL" ||
          (selectedFilter === "GAPS" && n.gap) ||
          (selectedFilter === "PERSON" && n.kind === "person") ||
          (selectedFilter === "ASSET" && n.kind === "asset") ||
          (selectedFilter === "LIABILITY" && n.kind === "liability") ||
          (selectedFilter === "CONTACT" && n.kind === "contact") ||
          (selectedFilter === "DOCUMENT" && n.kind === "document");

        const matchesSearch =
          !searchQuery.trim() ||
          n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.role.toLowerCase().includes(searchQuery.toLowerCase());

        const proj = project3D(n);

        projectedNodesRef.push({
          ...n,
          projX: proj.screenX,
          projY: proj.screenY,
          projZ: proj.zDepth,
          scale: proj.scale,
          screenRadius: Math.max(12, n.baseRadius * proj.scale),
          visible: matchesFilter && matchesSearch,
        });
      });

      // Sort nodes by depth (furthest to closest for painter's algorithm)
      projectedNodesRef.sort((a, b) => a.projZ - b.projZ);

      // Create lookup map for projected nodes
      const projMap = new Map<string, ProjectedNode>();
      projectedNodesRef.forEach((pn) => projMap.set(pn.id, pn));

      // 3. Draw 3D Edges
      if (analysis) {
        analysis.relationships.forEach((rel) => {
          const sNode = projMap.get(rel.source);
          const tNode = projMap.get(rel.target);
          if (!sNode || !tNode) return;

          const isConnectedToFocus =
            !activeFocusId || (connectedNodeIds.has(sNode.id) && connectedNodeIds.has(tNode.id));

          const edgeAlpha = isConnectedToFocus ? 0.85 : 0.12;
          const edgeWidth = isConnectedToFocus ? 2 : 1;

          ctx.strokeStyle = isConnectedToFocus
            ? activeFocusId
              ? "#0284c7"
              : "#94a3b8"
            : "rgba(203, 213, 225, 0.4)";
          ctx.lineWidth = edgeWidth;

          ctx.beginPath();
          ctx.moveTo(sNode.projX, sNode.projY);
          ctx.lineTo(tNode.projX, tNode.projY);
          ctx.stroke();

          // Draw small relationship label badge at edge midpoint
          if (isConnectedToFocus && sNode.scale > 0.65) {
            const midX = (sNode.projX + tNode.projX) / 2;
            const midY = (sNode.projY + tNode.projY) / 2;

            ctx.font = `600 ${Math.max(8, 9 * sNode.scale)}px 'IBM Plex Mono', monospace`;
            const textWidth = ctx.measureText(rel.relationship).width;

            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(midX - textWidth / 2 - 6, midY - 9, textWidth + 12, 18, 9);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isConnectedToFocus && activeFocusId ? "#0284c7" : "#475569";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(rel.relationship, midX, midY);
          }
        });
      }

      // 4. Draw 3D Nodes (Painters algorithm: already depth-sorted)
      projectedNodesRef.forEach((node) => {
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeId === node.id;
        const isFocusActive = !!activeFocusId;
        const isConnected = !isFocusActive || connectedNodeIds.has(node.id);

        const theme = getNodeTheme(node.kind, node.gap);
        const radius = node.screenRadius * (isSelected ? 1.25 : isHovered ? 1.15 : 1);

        const nodeOpacity = node.visible ? (isConnected ? 1 : 0.22) : 0.08;
        ctx.globalAlpha = nodeOpacity;

        // Outer focus halo ring
        if (isSelected || isHovered) {
          ctx.strokeStyle = isSelected ? "#0284c7" : "#38bdf8";
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.beginPath();
          ctx.arc(node.projX, node.projY, radius + 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Drop shadow for depth illusion
        ctx.shadowColor = "rgba(15, 23, 42, 0.12)";
        ctx.shadowBlur = 10 * node.scale;
        ctx.shadowOffsetY = 4 * node.scale;

        // Node Circle Body
        ctx.fillStyle = theme.fill;
        ctx.beginPath();
        ctx.arc(node.projX, node.projY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Node Border
        ctx.strokeStyle = theme.stroke;
        ctx.lineWidth = node.gap ? 2.5 : 1.5;
        ctx.stroke();

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Inner Emblem Icon or Initial
        const iconSize = Math.max(10, 14 * node.scale);
        ctx.fillStyle = theme.label;
        ctx.font = `700 ${iconSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const initial = node.name.charAt(0).toUpperCase();
        ctx.fillText(initial, node.projX, node.projY);

        // Gap badge indicator
        if (node.gap) {
          const badgeX = node.projX + radius * 0.7;
          const badgeY = node.projY - radius * 0.7;
          ctx.fillStyle = "#d97706";
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, 6.5 * node.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = `700 ${8 * node.scale}px sans-serif`;
          ctx.fillText("!", badgeX, badgeY);
        }

        // Entity Label Text below node
        if (node.scale > 0.55 && node.visible) {
          const labelY = node.projY + radius + 14 * node.scale;

          // Role pill
          ctx.font = `600 ${Math.max(7, 8 * node.scale)}px 'IBM Plex Mono', monospace`;
          const roleWidth = ctx.measureText(node.role).width;
          ctx.fillStyle = theme.badgeBg;
          ctx.beginPath();
          ctx.roundRect(
            node.projX - roleWidth / 2 - 4,
            labelY - 7 * node.scale,
            roleWidth + 8,
            14 * node.scale,
            4,
          );
          ctx.fill();

          ctx.fillStyle = theme.badgeText;
          ctx.fillText(node.role, node.projX, labelY);

          // Name
          ctx.font = `600 ${Math.max(10, 12 * node.scale)}px 'Plus Jakarta Sans', sans-serif`;
          ctx.fillStyle = "#0f172a";
          const maxLen = 22;
          const displayName =
            node.name.length > maxLen ? `${node.name.slice(0, maxLen - 1)}…` : node.name;
          ctx.fillText(displayName, node.projX, labelY + 14 * node.scale);
        }

        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [nodes3D, analysis, activeFocusId, connectedNodeIds, autoRotate, selectedFilter, searchQuery, selectedNodeId, hoveredNodeId]);

  /* ----------------------------------------------------------
     RESET CAMERA VIEW
     ---------------------------------------------------------- */
  const resetCamera = () => {
    camState.current.targetRotX = 0.28;
    camState.current.targetRotY = -0.45;
    camState.current.panX = 0;
    camState.current.panY = 0;
    camState.current.zoom = 1;
    setCameraZoom(1);
  };

  const handleZoom = (delta: number) => {
    camState.current.zoom = Math.max(0.45, Math.min(2.4, camState.current.zoom + delta));
    setCameraZoom(camState.current.zoom);
  };

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-sky-600" />
            3D Spatial Entity Architecture · Live Topology
          </div>

          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-slate-900 font-display">
            Household 3D Knowledge Graph
          </h1>

          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
            Orbit, inspect, and trace the multi-dimensional relationships between family members, financial assets, obligations, and verified documentation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void loadGraph()}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Graph
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card-surface p-4 shadow-sm">
          <p className="eyebrow">Mapped Entities</p>
          <p className="mt-1 text-2xl font-bold font-display text-slate-900">
            {analysis?.entities.length ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">People, assets, accounts</p>
        </div>

        <div className="card-surface p-4 shadow-sm">
          <p className="eyebrow">Active Relationships</p>
          <p className="mt-1 text-2xl font-bold font-display text-slate-900">
            {analysis?.relationships.length ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">Cross-verified edges</p>
        </div>

        <div className="card-surface p-4 shadow-sm">
          <p className="eyebrow">Identified Gaps</p>
          <p className="mt-1 text-2xl font-bold font-display text-amber-700">
            {analysis?.gaps.length ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">Missing nominees & details</p>
        </div>

        <div className="card-surface p-4 shadow-sm">
          <p className="eyebrow">Day-Zero Actions</p>
          <p className="mt-1 text-2xl font-bold font-display text-sky-800">
            {analysis?.actions.length ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">Auto-generated steps</p>
        </div>
      </div>

      {/* Main 3D Graph Workspace */}
      <div
        ref={containerRef}
        className={`card-surface border-slate-200 overflow-hidden relative shadow-sm flex flex-col ${
          isFullscreen ? "fixed inset-4 z-50 shadow-2xl" : "h-[640px]"
        }`}
      >
        {/* Top Control Bar */}
        <div className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-10">
          
          {/* Search Input */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 3D entities…"
              className="w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-800 transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-[0.7rem] font-mono no-scrollbar">
            {(["ALL", "GAPS", "PERSON", "ASSET", "LIABILITY", "CONTACT", "DOCUMENT"] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setSelectedFilter(filterKey)}
                className={`px-2.5 py-1 rounded-md transition font-semibold ${
                  selectedFilter === filterKey
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {filterKey === "GAPS" ? "⚠ GAPS ONLY" : filterKey}
              </button>
            ))}
          </div>

          {/* 3D Camera Controls */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? "Pause orbit" : "Start auto orbit"}
              className={`p-1.5 rounded-md border transition ${
                autoRotate ? "bg-sky-50 border-sky-200 text-sky-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={() => handleZoom(0.2)}
              title="Zoom In"
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => handleZoom(-0.2)}
              title="Zoom Out"
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={resetCamera}
              title="Reset 3D camera"
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit fullscreen" : "Expand workspace"}
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition ml-1"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* 3D Canvas Rendering Area */}
        <div className="relative flex-1 w-full h-full bg-[#f8fafc] overflow-hidden select-none">
          
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-20">
              <div className="text-center space-y-2">
                <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
                <p className="text-xs font-semibold text-slate-700">Projecting 3D Household Graph…</p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
              <div className="card-surface p-6 max-w-md text-center space-y-3">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto" />
                <h3 className="font-semibold text-slate-900">Knowledge Graph Unavailable</h3>
                <p className="text-xs text-slate-600">{error}</p>
                <button onClick={() => void loadGraph()} className="cyber-button text-xs py-2 px-4">
                  Retry Loading
                </button>
              </div>
            </div>
          ) : null}

          <canvas ref={canvasRef} className="w-full h-full block touch-none" />

          {/* Quick HUD Navigation Hint */}
          <div className="absolute bottom-3 left-3 pointer-events-none rounded-lg bg-white/90 border border-slate-200 px-3 py-1.5 text-[0.68rem] font-mono text-slate-600 shadow-sm backdrop-blur-md">
            <span>Drag: Orbit 3D · Shift+Drag: Pan · Scroll: Zoom · Click: Inspect</span>
          </div>

          {/* Selected Entity Inspector Drawer */}
          {selectedNode && (
            <div className="absolute right-3 top-3 bottom-3 w-80 rounded-xl border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur-md overflow-y-auto space-y-4 animate-fadeIn z-20">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[0.65rem] font-bold uppercase border ${
                    selectedNode.gap
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-slate-100 text-slate-800 border-slate-200"
                  }`}>
                    {selectedNode.role}
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 font-display mt-1">
                    {selectedNode.name}
                  </h3>
                  <p className="text-xs text-slate-500 capitalize">{selectedNode.entity_type.toLowerCase()} entity</p>
                </div>

                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-slate-400 hover:text-slate-800 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Gap Warning if any */}
              {selectedNode.gap && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    Readiness Gap Detected
                  </div>
                  <p className="text-[0.72rem] text-amber-900 leading-relaxed">
                    {analysis?.gaps.find((g) => g.entity_id === selectedNode.id)?.reason ??
                      "Incomplete nominee allocation or missing verification documents."}
                  </p>
                </div>
              )}

              {/* Connected Relationships */}
              <div className="space-y-2">
                <p className="eyebrow text-[0.65rem]">Connected Relationships</p>
                <div className="space-y-1.5">
                  {analysis?.relationships
                    .filter((r) => r.source === selectedNode.id || r.target === selectedNode.id)
                    .map((rel, index) => {
                      const otherId = rel.source === selectedNode.id ? rel.target : rel.source;
                      const other = nodeMap.get(otherId);
                      if (!other) return null;

                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedNodeId(other.id)}
                          className="w-full text-left rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-xs hover:bg-slate-100 transition flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono text-[0.65rem] text-sky-800 font-semibold block">
                              {rel.relationship}
                            </span>
                            <span className="font-medium text-slate-800 truncate block">
                              {other.name}
                            </span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Actions generated */}
              {analysis?.actions.filter((a) => a.entity_id === selectedNode.id).length ? (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="eyebrow text-[0.65rem]">Suggested Actions</p>
                  <div className="space-y-1.5">
                    {analysis.actions
                      .filter((a) => a.entity_id === selectedNode.id)
                      .map((act, i) => (
                        <div key={i} className="rounded-lg border border-slate-200 p-2.5 text-xs bg-white">
                          <p className="font-semibold text-slate-900">{act.title}</p>
                          <p className="text-[0.7rem] text-slate-500 mt-0.5">{act.description}</p>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}

              <div className="pt-2">
                <button
                  onClick={() => navigate({ to: "/upload" })}
                  className="cyber-button w-full text-xs py-2"
                >
                  Upload & Verify Documents
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Detected Gaps List Section */}
      {analysis && analysis.gaps.length > 0 && (
        <section className="card-surface p-6 shadow-sm space-y-4">
          <div>
            <div className="eyebrow">Identified Gaps</div>
            <h2 className="text-xl font-semibold text-slate-900 font-display">
              Critical Continuity Vulnerabilities
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Continuum detected the following missing links across the household network:
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {analysis.gaps.map((gap, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedNodeId(gap.entity_id)}
                className="card-surface p-4 text-left transition hover:border-slate-400 space-y-2 block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900">{gap.title}</span>
                  <span className="font-mono text-[0.65rem] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {gap.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{gap.reason}</p>
                <div className="pt-1 flex items-center gap-1 text-[0.7rem] font-mono font-semibold text-sky-700">
                  <span>Target in 3D Space</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

>>>>>>> Stashed changes
    </div>
  );
}

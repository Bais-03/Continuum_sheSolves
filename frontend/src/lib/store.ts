import { useSyncExternalStore } from "react";

export type DimKey =
  | "asset"
  | "beneficiary"
  | "deadline"
  | "liability"
  | "access"
  | "successor"
  | "contacts";

export const DIMENSIONS: { key: DimKey; label: string; weight: number; base: number }[] = [
  { key: "asset", label: "Asset discovery", weight: 1, base: 97 },
  { key: "beneficiary", label: "Beneficiary completeness", weight: 1.5, base: 17 },
  { key: "deadline", label: "Deadline awareness", weight: 1, base: 83 },
  { key: "liability", label: "Liability awareness", weight: 1, base: 65 },
  { key: "access", label: "Document accessibility", weight: 1.25, base: 38 },
  { key: "successor", label: "Successor knowledge", weight: 1.5, base: 38 },
  { key: "contacts", label: "Emergency contacts", weight: 1, base: 88 },
];

export type Field = {
  id: string;
  label: string;
  value: string;
  confidence: number;
  dim: DimKey;
  points: number;
  confirmed: boolean;
};

export type Doc = {
  id: string;
  name: string;
  type: string;
  fields: Field[];
};

export const SAMPLE_DOCS: Omit<Doc, "id">[] = [
  {
    name: "lic_policy_2019.txt",
    type: "Life insurance policy",
    fields: [
      { id: "", label: "Policy number", value: "LIC-88213409", confidence: 0.96, dim: "asset", points: 2, confirmed: false },
      { id: "", label: "Nominee", value: "Meera Kulkarni (spouse)", confidence: 0.91, dim: "beneficiary", points: 22, confirmed: false },
      { id: "", label: "Premium due", value: "12 March, yearly", confidence: 0.74, dim: "deadline", points: 6, confirmed: false },
      { id: "", label: "Physical copy location", value: "Steel almirah, top shelf", confidence: 0.48, dim: "access", points: 18, confirmed: false },
    ],
  },
  {
    name: "home_loan_hdfc.md",
    type: "Home loan statement",
    fields: [
      { id: "", label: "Outstanding principal", value: "₹18,40,000", confidence: 0.93, dim: "liability", points: 14, confirmed: false },
      { id: "", label: "EMI date", value: "5th of every month", confidence: 0.88, dim: "deadline", points: 6, confirmed: false },
      { id: "", label: "Linked insurance cover", value: "Unclear — possibly HDFC Life", confidence: 0.39, dim: "successor", points: 16, confirmed: false },
    ],
  },
  {
    name: "demat_nominee_form.txt",
    type: "Demat account nomination",
    fields: [
      { id: "", label: "Broker", value: "Zerodha", confidence: 0.97, dim: "asset", points: 1, confirmed: false },
      { id: "", label: "Nominee", value: "Not registered", confidence: 0.82, dim: "beneficiary", points: 10, confirmed: false },
      { id: "", label: "Who to call first", value: "CA: R. Deshpande, 98xxxxxx12", confidence: 0.61, dim: "successor", points: 14, confirmed: false },
    ],
  },
];

type State = { docs: Doc[]; completedTasks: string[] };

let uid = 0;
const mk = () => `id${++uid}`;

let state: State = { docs: [], completedTasks: [] };
const listeners = new Set<() => void>();
const set = (s: State) => {
  state = s;
  listeners.forEach((l) => l());
};

export const actions = {
  addDoc(d: Omit<Doc, "id">) {
    const doc: Doc = { ...d, id: mk(), fields: d.fields.map((f) => ({ ...f, id: mk() })) };
    set({ ...state, docs: [...state.docs, doc] });
  },
  confirm(docId: string, fieldId: string, value?: string) {
    set({
      ...state,
      docs: state.docs.map((d) =>
        d.id !== docId
          ? d
          : {
              ...d,
              fields: d.fields.map((f) =>
                f.id === fieldId ? { ...f, confirmed: true, value: value ?? f.value } : f,
              ),
            },
      ),
    });
  },
  removeDoc(id: string) {
    set({ ...state, docs: state.docs.filter((d) => d.id !== id) });
  },
  toggleTask(id: string) {
    const has = state.completedTasks.includes(id);
    set({
      ...state,
      completedTasks: has ? state.completedTasks.filter((t) => t !== id) : [...state.completedTasks, id],
    });
  },
  reset() {
    set({ docs: [], completedTasks: [] });
  },
};

export function useStore() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

export function computeScores(s: State) {
  const dims = DIMENSIONS.map((d) => {
    const bonus = s.docs
      .flatMap((doc) => doc.fields)
      .filter((f) => f.confirmed && f.dim === d.key)
      .reduce((a, f) => a + f.points, 0);
    return { ...d, score: Math.min(100, d.base + bonus) };
  });
  const tw = dims.reduce((a, d) => a + d.weight, 0);
  const overall = Math.round(dims.reduce((a, d) => a + d.score * d.weight, 0) / tw);
  return { dims, overall };
}

// Mock extractor: "Label: value" lines become fields.
export function mockExtract(name: string, text: string): Omit<Doc, "id"> {
  const dimFor = (l: string): DimKey => {
    const s = l.toLowerCase();
    if (/nominee|beneficiar/.test(s)) return "beneficiary";
    if (/due|date|emi|renew/.test(s)) return "deadline";
    if (/loan|debt|outstanding|credit/.test(s)) return "liability";
    if (/location|kept|locker|password/.test(s)) return "access";
    if (/contact|phone|doctor/.test(s)) return "contacts";
    if (/call|advisor|ca\b|lawyer/.test(s)) return "successor";
    return "asset";
  };
  const fields: Field[] = text
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*[-*]?\s*([^:]{2,40}):\s*(.+)$/))
    .filter(Boolean)
    .slice(0, 12)
    .map((m) => {
      const value = (m![2] ?? "").trim();
      return {
        id: "",
        label: (m![1] ?? "").trim(),
        value,
        confidence: Math.max(0.3, Math.min(0.98, 0.5 + value.length / 60 + (/\d/.test(value) ? 0.15 : 0))),
        dim: dimFor(m![1] ?? ""),
        points: 8,
        confirmed: false,
      };
    });
  return { name, type: "Uploaded document", fields };
}

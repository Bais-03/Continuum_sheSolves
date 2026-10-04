const API_BASE = "http://localhost:8000/api/v1";

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let errorDetail = "API request failed";
    try {
      const data = await res.json();
      errorDetail = data.detail || errorDetail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  if (res.status === 204) return null;
  return res.json();
}

// Auth APIs
export async function apiSignup(full_name: string, email: string, password: string) {
  return apiRequest("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, email, password }),
  });
}

export async function apiLogin(email: string, password: string) {
  return apiRequest("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function apiLogout() {
  return apiRequest("/auth/logout", { method: "POST" });
}

export async function apiMe() {
  return apiRequest("/auth/me");
}


export type GraphEntity = {
  id: string;
  entity_type: string;
  name: string;
};

export type GraphEdge = {
  source: string;
  target: string;
  relationship: string;
};

export type GraphGap = {
  gap_type: string;
  entity_id: string;
  title: string;
  reason: string;
  severity: string;
};

export type DayZeroAction = {
  title: string;
  description: string;
  priority: string;
  gap_type: string;
  entity_id: string;
};

export type GraphAnalysis = {
  entities: GraphEntity[];
  relationships: GraphEdge[];
  gaps: GraphGap[];
  actions: DayZeroAction[];
};

export async function apiAnalyzeGraph(): Promise<GraphAnalysis> {
  return apiRequest("/graph/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

// Domain APIs
export async function apiGetDocuments() {
  return apiRequest("/documents");
}

export async function apiUploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest("/documents/upload", {
    method: "POST",
    body: formData,
  });
}

export async function apiDeleteDocument(id: string) {
  return apiRequest(`/documents/${id}`, { method: "DELETE" });
}

export async function apiGetDocumentFields(docId: string) {
  return apiRequest(`/documents/${docId}/fields`);
}

export async function apiConfirmField(fieldId: string, extracted_value?: string) {
  return apiRequest(`/fields/${fieldId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ extracted_value }),
  });
}

export async function apiRejectField(fieldId: string) {
  return apiRequest(`/fields/${fieldId}/reject`, { method: "POST" });
}

export async function apiUpdateField(fieldId: string, extracted_value?: string, confirmation_status?: string) {
  return apiRequest(`/fields/${fieldId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ extracted_value, confirmation_status }),
  });
}

export async function apiGetScores() {
  return apiRequest("/scores");
}

export async function apiRecalculateScores() {
  return apiRequest("/scores/recalculate", { method: "POST" });
}

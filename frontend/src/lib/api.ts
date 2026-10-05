const API_BASE = "http://localhost:8000/api/v1";

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    /(?:^|;\s*)csrf_token=([^;]*)/,
  );

  return match?.[1]
    ? decodeURIComponent(match[1])
    : null;
}

export async function apiRequest(
  path: string,
  options: RequestInit = {},
) {
  const method = (
    options.method || "GET"
  ).toUpperCase();

  const headers = new Headers(
    options.headers || {},
  );

  // Add CSRF token for state-changing requests
  if (
    ["POST", "PATCH", "PUT", "DELETE"].includes(
      method,
    )
  ) {
    const csrfToken = getCsrfToken();

    if (csrfToken) {
      headers.set(
        "X-CSRF-Token",
        csrfToken,
      );
    }
  }

  const res = await fetch(
    `${API_BASE}${path}`,
    {
      ...options,
      headers,
      credentials: "include",
    },
  );

  if (!res.ok) {
    let errorDetail =
      "API request failed";

    try {
      const data = await res.json();
      errorDetail =
        data.detail || errorDetail;
    } catch {
      // Use default error message
    }

    throw new Error(errorDetail);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}


// ============================================================
// Auth APIs
// ============================================================

export async function apiSignup(
  full_name: string,
  email: string,
  password: string,
) {
  return apiRequest("/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name,
      email,
      password,
    }),
  });
}


export async function apiLogin(
  email: string,
  password: string,
) {
  return apiRequest("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
}


export async function apiLogout() {
  return apiRequest("/auth/logout", {
    method: "POST",
  });
}


export async function apiMe() {
  return apiRequest("/auth/me");
}


// ============================================================
// Knowledge Graph APIs
// ============================================================

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
  task_id: string;
  status: string;
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
}


// ============================================================
// Domain APIs
// ============================================================

export async function apiGetDocuments() {
  return apiRequest("/documents");
}


export async function apiUploadDocument(
  file: File,
) {
  const formData = new FormData();

  formData.append(
    "file",
    file,
  );

  return apiRequest(
    "/documents/upload",
    {
      method: "POST",
      body: formData,
    },
  );
}


export async function apiDeleteDocument(
  id: string,
) {
  return apiRequest(
    `/documents/${id}`,
    {
      method: "DELETE",
    },
  );
}


export async function apiGetDocumentFields(
  docId: string,
) {
  return apiRequest(
    `/documents/${docId}/fields`,
  );
}


export async function apiConfirmField(
  fieldId: string,
  extracted_value?: string,
) {
  return apiRequest(
    `/fields/${fieldId}/confirm`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        extracted_value,
      }),
    },
  );
}


export async function apiRejectField(
  fieldId: string,
) {
  return apiRequest(
    `/fields/${fieldId}/reject`,
    {
      method: "POST",
    },
  );
}


export async function apiUpdateField(
  fieldId: string,
  extracted_value?: string,
  confirmation_status?: string,
) {
  return apiRequest(
    `/fields/${fieldId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        extracted_value,
        confirmation_status,
      }),
    },
  );
}


// ============================================================
// Readiness / Score APIs
// ============================================================

export async function apiGetScores() {
  return apiRequest("/scores");
}


export async function apiRecalculateScores() {
  return apiRequest(
    "/scores/recalculate",
    {
      method: "POST",
    },
  );
}


// ============================================================
// Day-Zero / Task APIs
// ============================================================

export type Task = {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};


export async function apiGetTasks(): Promise<Task[]> {
  return apiRequest("/tasks");
}


export async function apiUpdateTask(
  taskId: string,
  status: string,
): Promise<Task> {
  return apiRequest(
    `/tasks/${taskId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    },
  );
}


// ============================================================
// Guardian APIs
// ============================================================

export type GuardianInfo = {
  id: string;
  name: string;
  relationship: string;
  email: string | null;
  phone: string | null;
  status: string;
};


export type GuardianConfig = {
  guardians: GuardianInfo[];
  threshold: number;
  total_guardians: number;
  status: string;
};


export type GuardianCreateRequest = {
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
};


export type GuardianUpdateRequest = {
  name?: string;
  relationship?: string;
  email?: string;
  phone?: string;
  status?: string;
};


export type GuardianReleaseResponse = {
  success: boolean;
  message: string;
  released_by: string[];
  threshold: number;
};


export async function apiGetGuardians(): Promise<GuardianConfig> {
  return apiRequest("/guardian");
}


// ============================================================
// Guardian Portal
// ============================================================

export type GuardianPortalResponse = {
  guardian_id: string;
  name: string;
  relationship: string;
  email: string | null;
  phone: string | null;
  status: string;

  threshold: number;
  total_guardians: number;

  responsibility: string;
  access_level: string;
};


export async function apiGetGuardianPortal(): Promise<GuardianPortalResponse> {
  return apiRequest("/guardian/me");
}


export async function apiCreateGuardian(
  guardian: GuardianCreateRequest,
): Promise<GuardianInfo> {
  return apiRequest("/guardian", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      guardian,
    ),
  });
}


export async function apiUpdateGuardian(
  guardianId: string,
  guardian: GuardianUpdateRequest,
): Promise<GuardianInfo> {
  return apiRequest(
    `/guardian/${guardianId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        guardian,
      ),
    },
  );
}


export async function apiDeleteGuardian(
  guardianId: string,
): Promise<void> {
  await apiRequest(
    `/guardian/${guardianId}`,
    {
      method: "DELETE",
    },
  );
}


export async function apiReleaseGuardianVault(
  guardianIds: string[],
): Promise<GuardianReleaseResponse> {
  return apiRequest(
    "/guardian/release",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guardian_ids: guardianIds,
      }),
    },
  );
}


// ============================================================
// Guardian Release Request APIs
// ============================================================

export type GuardianReleaseCreateRequest = {
  reason?: string;
};


export type GuardianReleaseApproval = {
  guardian_id: string;
  guardian_name: string;
  status: string;
  responded_at: string | null;
};


export type GuardianReleaseRequest = {
  id: string;
  status: string;
  threshold: number;

  approved_count: number;
  rejected_count: number;
  pending_count: number;

  reason: string | null;

  created_at: string;
  expires_at: string | null;
  released_at: string | null;

  approvals: GuardianReleaseApproval[];
};


export type GuardianReleaseSummary = {
  id: string;
  status: string;
  threshold: number;

  approved_count: number;
  rejected_count: number;
  pending_count: number;

  created_at: string;
  expires_at: string | null;
};


/**
 * Create a new Guardian release request.
 *
 * Household-owner action.
 */
export async function apiCreateGuardianReleaseRequest(
  reason?: string,
): Promise<GuardianReleaseRequest> {
  return apiRequest(
    "/guardian/release-requests",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
      }),
    },
  );
}


/**
 * Get all release requests for the current household.
 *
 * Household-owner action.
 */
export async function apiGetGuardianReleaseRequests(): Promise<
  GuardianReleaseSummary[]
> {
  return apiRequest(
    "/guardian/release-requests",
  );
}


/**
 * Get a specific release request.
 *
 * Household-owner action.
 */
export async function apiGetGuardianReleaseRequest(
  releaseRequestId: string,
): Promise<GuardianReleaseRequest> {
  return apiRequest(
    `/guardian/release-requests/${releaseRequestId}`,
  );
}


/**
 * Get pending release requests assigned to the
 * currently authenticated Guardian.
 */
export async function apiGetPendingGuardianReleaseRequests(): Promise<
  GuardianReleaseSummary[]
> {
  return apiRequest(
    "/guardian/release-requests/pending",
  );
}


/**
 * Approve a release request as the authenticated Guardian.
 */
export async function apiApproveGuardianReleaseRequest(
  releaseRequestId: string,
): Promise<GuardianReleaseRequest> {
  return apiRequest(
    `/guardian/release-requests/${releaseRequestId}/approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );
}


/**
 * Reject a release request as the authenticated Guardian.
 */
export async function apiRejectGuardianReleaseRequest(
  releaseRequestId: string,
): Promise<GuardianReleaseRequest> {
  return apiRequest(
    `/guardian/release-requests/${releaseRequestId}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );
}


// ============================================================
// Guardian Invitation APIs
// ============================================================

export type GuardianInvitationResponse = {
  invitation_id: string;
  guardian_id: string;
  invited_email: string | null;
  status: string;
  expires_at: string;
  invitation_link: string;
};


/**
 * Create a Guardian invitation.
 *
 * This is an authenticated household-owner action.
 */
export async function apiInviteGuardian(
  guardianId: string,
): Promise<GuardianInvitationResponse> {
  return apiRequest(
    `/guardian/${guardianId}/invite`,
    {
      method: "POST",
    },
  );
}


// ============================================================
// Guardian Invitation Validation
// ============================================================

export type GuardianInvitationValidationResponse = {
  valid: boolean;
  guardian_id: string | null;
  guardian_name: string | null;
  invited_email: string | null;
  expires_at: string | null;
  message: string;
};


/**
 * Validate a Guardian invitation token.
 *
 * This endpoint is public because the invited Guardian
 * does not have an account yet.
 */
export async function apiValidateGuardianInvitation(
  token: string,
): Promise<GuardianInvitationValidationResponse> {
  return apiRequest(
    `/guardian/invitation/${encodeURIComponent(token)}`,
  );
}


// ============================================================
// Guardian Invitation Acceptance
// ============================================================

export type GuardianInvitationAcceptRequest = {
  full_name: string;
  password: string;
};


export type GuardianInvitationAcceptResponse = {
  success: boolean;
  message: string;
  user_id: string;
  guardian_id: string;
  email: string;
  full_name: string;
};


/**
 * Accept a Guardian invitation.
 *
 * The backend will:
 * 1. Validate the invitation
 * 2. Create the Guardian's User account
 * 3. Link the User to the Guardian
 * 4. Mark the invitation as accepted
 * 5. Create the authentication session
 */
export async function apiAcceptGuardianInvitation(
  token: string,
  request: GuardianInvitationAcceptRequest,
): Promise<GuardianInvitationAcceptResponse> {
  return apiRequest(
    `/guardian/invitation/${encodeURIComponent(token)}/accept`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );
}
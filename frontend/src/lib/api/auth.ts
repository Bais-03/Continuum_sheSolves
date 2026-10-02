import {
  createDemoUser,
  getDemoUser,
  loginDemoUser,
  logoutDemoUser,
  type ContinuumUser,
} from "@/lib/auth";

export type AuthUser = {
  name: string;
  email: string;
};

export type AuthResult = {
  success: boolean;
  user?: AuthUser;
  error?: string;
};

function toAuthUser(user: ContinuumUser): AuthUser {
  return {
    name: user.name,
    email: user.email,
  };
}

/**
 * Frontend authentication API adapter.
 *
 * Currently uses the browser-local demo authentication layer.
 * This boundary can later be replaced with real backend API calls
 * without changing the login/signup components.
 */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const success = await createDemoUser(name, email, password);

  if (!success) {
    return {
      success: false,
      error: "Unable to create the account.",
    };
  }

  const user = getDemoUser();

  return {
    success: true,
    user: user ? toAuthUser(user) : undefined,
  };
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  const success = await loginDemoUser(email, password);

  if (!success) {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  const user = getDemoUser();

  return {
    success: true,
    user: user ? toAuthUser(user) : undefined,
  };
}

export function getCurrentUser(): AuthUser | null {
  const user = getDemoUser();

  return user ? toAuthUser(user) : null;
}

export function logout(): void {
  logoutDemoUser();
}   
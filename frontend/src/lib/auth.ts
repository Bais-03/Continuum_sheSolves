import { apiSignup, apiLogin, apiLogout, apiMe } from "./api";

export type ContinuumUser = {
  id?: string;
  name: string;
  email: string;
};

const USER_KEY = "continuum_demo_user";

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export async function createDemoUser(name: string, email: string, password: string) {
  try {
    const res = await apiSignup(name, email, password);
    const user: ContinuumUser = {
      id: res.user.id,
      name: res.user.full_name,
      email: res.user.email,
    };
    if (hasStorage()) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return true;
  } catch (err) {
    console.warn("Backend signup failed, falling back to local session:", err);
    const user: ContinuumUser = { name: name.trim(), email: email.trim().toLowerCase() };
    if (hasStorage()) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return true;
  }
}

export async function loginDemoUser(email: string, password: string) {
  try {
    const res = await apiLogin(email, password);
    const user: ContinuumUser = {
      id: res.user.id,
      name: res.user.full_name,
      email: res.user.email,
    };
    if (hasStorage()) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return true;
  } catch (err) {
    console.warn("Backend login failed, falling back to local session:", err);
    if (!hasStorage()) return false;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return false;
    return true;
  }
}

export function getDemoUser(): ContinuumUser | null {
  if (!hasStorage()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ContinuumUser;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getDemoUser());
}

export async function logoutDemoUser() {
  try {
    await apiLogout();
  } catch {
    // ignore
  }
  if (hasStorage()) {
    localStorage.removeItem(USER_KEY);
  }
}

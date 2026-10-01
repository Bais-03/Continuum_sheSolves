export type ContinuumUser = {
  name: string;
  email: string;
  passwordHash: string;
};

const USER_KEY = "continuum_demo_user";
const SESSION_KEY = "continuum_demo_session";

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createDemoUser(name: string, email: string, password: string) {
  if (!hasStorage()) return false;
  const user: ContinuumUser = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: await hashPassword(password),
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_KEY, "active");
  return true;
}

export async function loginDemoUser(email: string, password: string) {
  if (!hasStorage()) return false;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return false;
  const user = JSON.parse(raw) as ContinuumUser;
  const passwordHash = await hashPassword(password);
  if (user.email !== email.trim().toLowerCase() || user.passwordHash !== passwordHash) return false;
  localStorage.setItem(SESSION_KEY, "active");
  return true;
}

export function getDemoUser(): ContinuumUser | null {
  if (!hasStorage() || localStorage.getItem(SESSION_KEY) !== "active") return null;
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

export function logoutDemoUser() {
  if (!hasStorage()) return;
  localStorage.removeItem(SESSION_KEY);
}

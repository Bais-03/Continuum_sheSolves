import { apiSignup, apiLogin, apiLogout, apiMe } from "./api";

export type ContinuumUser = {
  id: string;
  name: string;
  email: string;
  household_id?: string | null;
};

type BackendUser = {
  id: string;
  email: string;
  full_name: string;
  household_id?: string | null;
};

function mapUser(user: BackendUser): ContinuumUser {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    household_id: user.household_id ?? null,
  };
}

export async function signupUser(
  name: string,
  email: string,
  password: string,
): Promise<ContinuumUser> {
  const response = await apiSignup(name, email, password);
  return mapUser(response);
}

export async function loginUser(
  email: string,
  password: string,
): Promise<ContinuumUser> {
  const response = await apiLogin(email, password);
  return mapUser(response);
}

export async function getCurrentUser(): Promise<ContinuumUser> {
  const response = await apiMe();
  return mapUser(response);
}

export async function logoutUser(): Promise<void> {
  await apiLogout();
}
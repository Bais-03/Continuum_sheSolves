import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { logoutUser, type ContinuumUser } from "@/lib/auth";

const HOUSEHOLD_NAV = [
  { to: "/dashboard", label: "1 Dashboard" },
  { to: "/upload", label: "2 Upload & confirm" },
  { to: "/graph", label: "3 Knowledge graph" },
  { to: "/playbook", label: "4 Day-Zero" },
  { to: "/guardians", label: "5 Guardians" },
  { to: "/guardian", label: "6 Guardian release" },
] as const;

const GUARDIAN_NAV = [
  { to: "/guardian/portal", label: "Guardian Portal" },
] as const;

export function ProtectedShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: ContinuumUser;
}) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const initial = user?.name?.trim().charAt(0).toUpperCase() || "U";

  /*
   * Primary household users have a household_id.
   * Guardian accounts are intentionally not household owners,
   * so their household_id is null/undefined.
   */
  const isGuardian = !user?.household_id;

  const navItems = isGuardian ? GUARDIAN_NAV : HOUSEHOLD_NAV;

  const homeRoute = isGuardian ? "/guardian/portal" : "/dashboard";

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setProfileOpen(false);
      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
          <Link
            to={homeRoute}
            className="flex items-center gap-2 font-display text-2xl font-semibold"
          >
            <img
              src="/continuum-mark.png"
              alt="Continuum"
              className="h-9 w-9 object-contain"
            />

            <span>
              Continuum<span className="text-gold">.</span>
            </span>
          </Link>

          <nav className="flex flex-1 flex-wrap gap-1 text-sm">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: true }}
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted"
                activeProps={{
                  className:
                    "bg-primary !text-primary-foreground hover:bg-primary rounded-md px-3 py-1.5",
                }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className="flex items-center gap-2 rounded-full border bg-card px-2 py-1.5 text-sm hover:bg-muted"
              aria-expanded={profileOpen}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                {initial}
              </span>

              <span className="hidden max-w-28 truncate sm:block">
                {user?.name || "Profile"}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-2 w-60 rounded-lg border bg-card p-3 shadow-lg">
                <div className="border-b pb-3">
                  <p className="font-medium">
                    {user?.name || "Continuum user"}
                  </p>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {user?.email || "Demo account"}
                  </p>

                  {isGuardian && (
                    <p className="mt-2 text-xs font-medium text-muted-foreground">
                      Guardian account
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {children}
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 eyebrow">
        Prototype · synthetic data only · a checklist, not financial or legal
        advice
      </footer>
    </div>
  );
}
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getDemoUser, logoutDemoUser } from "@/lib/auth";

const NAV = [
  { to: "/dashboard", label: "1 Dashboard" },
  { to: "/upload", label: "2 Upload & confirm" },
  { to: "/graph", label: "3 Knowledge graph" },
  { to: "/playbook", label: "4 Day-Zero" },
  { to: "/guardian", label: "5 Guardian release" },
] as const;

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const user = getDemoUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const initial = user?.name?.trim().charAt(0).toUpperCase() || "U";

  const logout = () => {
    logoutDemoUser();
    setProfileOpen(false);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-display text-2xl font-semibold"
          >
            <img src="/continuum-mark.png" alt="Continuum" className="h-9 w-9 object-contain" />
            <span>
              Continuum<span className="text-gold">.</span>
            </span>
          </Link>
          <nav className="flex flex-1 flex-wrap gap-1 text-sm">
            {NAV.map((n) => (
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
              <span className="hidden max-w-28 truncate sm:block">{user?.name || "Profile"}</span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 z-50 mt-2 w-60 rounded-lg border bg-card p-3 shadow-lg">
                <div className="border-b pb-3">
                  <p className="font-medium">{user?.name || "Continuum user"}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {user?.email || "Demo account"}
                  </p>
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
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      <footer className="mx-auto max-w-6xl px-6 pb-10 eyebrow">
        Prototype · synthetic data only · a checklist, not financial or legal advice
      </footer>
    </div>
  );
}

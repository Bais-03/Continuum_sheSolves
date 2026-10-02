import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { login } from "@/lib/api/auth";
import { PublicNavbar } from "@/components/PublicNavbar";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Continuum" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const result = await login(email, password);

    if (!result.success) {
      setError(
        result.error ??
          "No matching account was found. Create an account first.",
      );
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthPage title="Welcome back" subtitle="Sign in to continue your household readiness journey.">
      <form onSubmit={submit} className="space-y-5">
        <label className="block text-sm">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-md border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-ring"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-md border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-ring"
            placeholder="Your password"
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
        >
          <LogIn className="h-4 w-4" /> Log in
        </button>
        <p className="text-center text-sm text-muted-foreground">
          New to Continuum?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthPage>
  );
}

function AuthPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main className="mx-auto flex max-w-6xl justify-center px-6 py-16 md:py-24">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img
              src="/continuum-mark.png"
              alt="Continuum"
              className="mx-auto h-20 w-20 object-contain"
            />
            <h1 className="mt-5 text-4xl">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
          </div>
          <div className="card-surface p-6 md:p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { signupUser } from "@/lib/auth";
import { PublicNavbar } from "@/components/PublicNavbar";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Continuum" }] }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await signupUser(name, email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("Signup failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account",
      );
    }
  };

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
            <h1 className="mt-5 text-4xl">Create your account</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Start exploring the Continuum household readiness prototype.
            </p>
          </div>
          <div className="card-surface p-6 md:p-8">
            <form onSubmit={submit} className="space-y-5">
              <label className="block text-sm">
                Full name
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your name"
                />
              </label>
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
                  placeholder="At least 6 characters"
                />
              </label>
              <label className="block text-sm">
                Confirm password
                <input
                  required
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Repeat your password"
                />
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
              >
                <UserPlus className="h-4 w-4" /> Create account
              </button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

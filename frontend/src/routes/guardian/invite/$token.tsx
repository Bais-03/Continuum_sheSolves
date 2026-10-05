import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";

import {
  apiAcceptGuardianInvitation,
  apiValidateGuardianInvitation,
  type GuardianInvitationValidationResponse,
} from "@/lib/api";

export const Route = createFileRoute(
  "/guardian/invite/$token",
)({
  head: () => ({
    meta: [
      {
        title: "Guardian Invitation — Continuum",
      },
      {
        name: "description",
        content:
          "Accept your Continuum Guardian invitation.",
      },
    ],
  }),
  component: GuardianInvitation,
});

function GuardianInvitation() {
  const { token } = Route.useParams();

  const [invitation, setInvitation] =
    useState<GuardianInvitationValidationResponse | null>(
      null,
    );

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState<string | null>(
    null,
  );

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function validateInvitation() {
      try {
        setLoading(true);
        setError(null);

        const result =
          await apiValidateGuardianInvitation(token);

        if (!cancelled) {
          setInvitation(result);
        }
      } catch (err) {
        console.error(
          "Failed to validate Guardian invitation:",
          err,
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to validate this invitation.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void validateInvitation();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setAccepting(true);

      const result =
        await apiAcceptGuardianInvitation(token, {
          full_name: fullName.trim(),
          password,
        });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error(
        "Failed to accept Guardian invitation:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to accept this invitation.",
      );
    } finally {
      setAccepting(false);
    }
  };

  // ----------------------------------------------------------
  // Loading
  // ----------------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="card-surface w-full p-8 text-center">
            <div className="eyebrow">
              Continuum Guardian
            </div>

            <h1 className="mt-3 font-display text-3xl">
              Checking your invitation…
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              Please wait while we securely validate your
              invitation.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // Validation request failed
  // ----------------------------------------------------------

  if (error && !invitation) {
    return (
      <main className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="card-surface w-full p-8 text-center">
            <div className="eyebrow">
              Guardian invitation
            </div>

            <h1 className="mt-3 font-display text-3xl">
              Invitation unavailable
            </h1>

            <p className="mt-4 text-sm text-muted-foreground">
              {error}
            </p>

            <p className="mt-4 text-xs text-muted-foreground">
              The invitation may have expired, already been
              accepted, or been revoked.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // Invalid invitation response
  // ----------------------------------------------------------

  if (!invitation || !invitation.valid) {
    return (
      <main className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="card-surface w-full p-8 text-center">
            <div className="eyebrow">
              Guardian invitation
            </div>

            <h1 className="mt-3 font-display text-3xl">
              This invitation is no longer valid
            </h1>

            <p className="mt-4 text-sm text-muted-foreground">
              {invitation?.message ??
                "This invitation could not be validated."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // Successful account creation
  // ----------------------------------------------------------

  if (success) {
    return (
      <main className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="card-surface w-full p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary text-primary">
              ✓
            </div>

            <div className="eyebrow mt-6">
              Guardian account created
            </div>

            <h1 className="mt-3 font-display text-3xl">
              Welcome to Continuum.
            </h1>

            <p className="mt-4 text-sm text-muted-foreground">
              Your Guardian account has been created
              successfully.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              You are now connected as{" "}
              <span className="font-medium text-foreground">
                {invitation.guardian_name}
              </span>
              .
            </p>

            <div className="mt-6 rounded-md border p-4 text-left">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Account
              </div>

              <div className="mt-2 text-sm">
                {invitation.invited_email}
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Your Guardian portal will be available here
              once the Guardian release workspace is enabled.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // Invitation acceptance form
  // ----------------------------------------------------------

  return (
    <main className="min-h-screen bg-background px-6 py-12 md:py-20">
      <div className="mx-auto flex min-h-[75vh] max-w-xl items-center justify-center">
        <div className="w-full">
          <div className="mb-8 text-center">
            <img
              src="/continuum-mark.png"
              alt="Continuum"
              className="mx-auto h-16 w-16 object-contain"
            />

            <p className="eyebrow mt-6">
              Guardian invitation
            </p>

            <h1 className="mt-3 font-display text-4xl">
              You’ve been trusted with someone’s continuity.
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Create your Guardian account to participate
              in Continuum’s future release process.
            </p>
          </div>

          <div className="card-surface p-6 md:p-8">
            {/* Guardian information */}

            <div className="rounded-md border p-5">
              <div className="eyebrow">
                Your Guardian role
              </div>

              <h2 className="mt-2 font-display text-2xl">
                {invitation.guardian_name}
              </h2>

              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>
                  Invited email:{" "}
                  <span className="text-foreground">
                    {invitation.invited_email}
                  </span>
                </p>

                {invitation.expires_at && (
                  <p>
                    Invitation expires:{" "}
                    <span className="text-foreground">
                      {new Date(
                        invitation.expires_at,
                      ).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Privacy explanation */}

            <div className="mt-6 rounded-md border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm leading-6">
                As a Guardian, you do{" "}
                <strong>not</strong> automatically receive
                access to the household’s documents or private
                information.
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your account allows you to participate in the
                controlled Guardian release process when
                required.
              </p>
            </div>

            {/* Account creation form */}

            <form
              onSubmit={submit}
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="full-name"
                  className="block text-sm font-medium"
                >
                  Full name
                </label>

                <input
                  id="full-name"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  className="mt-2 w-full rounded-md border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                >
                  Create password
                </label>

                <input
                  id="password"
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 8 characters"
                  className="mt-2 w-full rounded-md border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-primary"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Minimum 8 characters.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium"
                >
                  Confirm password
                </label>

                <input
                  id="confirm-password"
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Enter your password again"
                  className="mt-2 w-full rounded-md border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive p-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={accepting}
                className="w-full rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {accepting
                  ? "Creating Guardian account…"
                  : "Accept invitation"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By accepting this invitation, you become a
              designated Guardian for the Continuum household.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
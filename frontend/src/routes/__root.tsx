import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useLocation,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { getCurrentUser, type ContinuumUser } from "../lib/auth";
import { ContinuumLoader } from "../components/ui/ContinuumLoader";
import { ProtectedShell } from "../components/ProtectedShell";

/* ============================================================
   PUBLIC ROUTES
   ============================================================ */

const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/contact",
  "/login",
  "/signup",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  /*
   * Guardian invitation pages are public because the invited
   * Guardian does not have an account yet.
   *
   * Example:
   * /guardian/invite/<token>
   */
  if (pathname.startsWith("/guardian/invite/")) {
    return true;
  }

  return false;
}

/* ============================================================
   GUARDIAN ROUTE PROTECTION
   ============================================================ */

/*
 * These routes belong to the primary household workspace.
 *
 * Guardians have a separate restricted account and must not
 * access these routes.
 */
const HOUSEHOLD_ONLY_PATHS = new Set([
  "/dashboard",
  "/upload",
  "/graph",
  "/playbook",
  "/guardians",
  "/guardian",
]);

function isHouseholdOnlyPath(pathname: string): boolean {
  return HOUSEHOLD_ONLY_PATHS.has(pathname);
}

/*
 * A Guardian account does not own a household.
 *
 * Primary household users have a household_id.
 * Guardian accounts intentionally have no household_id.
 */
function isGuardianUser(user: ContinuumUser): boolean {
  return !user.household_id;
}

/* ============================================================
   NOT FOUND
   ============================================================ */

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <img
          src="/continuum-mark.png"
          alt="Continuum"
          className="mx-auto h-16 w-16 object-contain"
        />

        <h1 className="mt-6 text-6xl">404</h1>

        <p className="mt-2 text-muted-foreground">
          This page doesn't exist.
        </p>

        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
   ERROR BOUNDARY
   ============================================================ */

function ErrorComponent({
  error,
  reset,
}: ErrorComponentProps) {
  console.error(error);

  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, {
      boundary: "tanstack_root_error_component",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-xl">This page didn't load</h1>

        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   ROOT ROUTE
   ============================================================ */

export const Route =
  createRootRouteWithContext<{
    queryClient: QueryClient;
  }>()({
    head: () => ({
      meta: [
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          title: "Continuum",
        },
        {
          name: "description",
          content:
            "Measure how ready your household is if the person who manages money becomes unavailable.",
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
      ],

      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
        },
        {
          rel: "stylesheet",
          href:
            "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
        },
        {
          rel: "icon",
          href: "/favicon.ico",
          type: "image/x-icon",
        },
      ],
    }),

    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  });

/* ============================================================
   HTML SHELL
   ============================================================ */

function RootShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>

      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/* ============================================================
   ROOT COMPONENT
   ============================================================ */

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const location = useLocation();
  const navigate = useNavigate();

  const [authChecked, setAuthChecked] =
    useState(false);

  const [user, setUser] =
    useState<ContinuumUser | null>(null);

  /*
   * Public pages do not require an authenticated session.
   *
   * This includes Guardian invitation pages because the
   * Guardian creates their account through the invitation.
   */
  const isPublic = isPublicPath(
    location.pathname,
  );

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      /*
       * Public routes do not need authentication.
       */
      if (isPublic) {
        if (!cancelled) {
          setUser(null);
          setAuthChecked(true);
        }

        return;
      }

      setAuthChecked(false);

      try {
        const currentUser =
          await getCurrentUser();

        if (cancelled) {
          return;
        }

        /*
         * Guardian route protection
         *
         * A Guardian may only access the Guardian Portal.
         * Household-owner routes are blocked at the frontend
         * even if the user manually types the URL.
         */
        if (
          isGuardianUser(currentUser) &&
          isHouseholdOnlyPath(location.pathname)
        ) {
          setUser(currentUser);
          setAuthChecked(true);

          navigate({
            to: "/guardian/portal",
            replace: true,
          });

          return;
        }

        setUser(currentUser);
        setAuthChecked(true);
      } catch (error) {
        console.warn(
          "Backend session is not valid:",
          error,
        );

        if (!cancelled) {
          setUser(null);
          setAuthChecked(true);

          navigate({
            to: "/login",
          });
        }
      }
    }

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, [
    isPublic,
    location.pathname,
    navigate,
  ]);

  return (
    <QueryClientProvider client={queryClient}>
      <ContinuumLoader />

      {isPublic ? (
        <Outlet />
      ) : authChecked && user ? (
        <ProtectedShell user={user}>
          <Outlet />
        </ProtectedShell>
      ) : (
        <div className="min-h-screen bg-background" />
      )}
    </QueryClientProvider>
  );
}
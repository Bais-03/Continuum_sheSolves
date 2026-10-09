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
import { getDemoUser } from "../lib/auth";
import { ContinuumLoader } from "../components/ui/ContinuumLoader";
import { ContinuumMark } from "../components/ui/ContinuumMark";
import { ProtectedShell } from "../components/ProtectedShell";

const PUBLIC_PATHS = new Set(["/", "/about", "/contact", "/login", "/signup"]);

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
<<<<<<< Updated upstream
        <img
          src="/continuum-mark.png"
          alt="Continuum"
          className="mx-auto h-16 w-16 object-contain"
        />
=======
        <ContinuumMark size={56} className="mx-auto" />

>>>>>>> Stashed changes
        <h1 className="mt-6 text-6xl">404</h1>
        <p className="mt-2 text-muted-foreground">This page doesn't exist.</p>
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

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
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

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Continuum" },
      {
        name: "description",
        content:
          "Measure how ready your household is if the person who manages money becomes unavailable.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

<<<<<<< Updated upstream
function RootShell({ children }: { children: ReactNode }) {
=======
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
            "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
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
>>>>>>> Stashed changes
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const isPublic = PUBLIC_PATHS.has(location.pathname);

  useEffect(() => {
    setAuthChecked(true);
    if (!isPublic && !getDemoUser()) {
      navigate({ to: "/login" });
    }
  }, [isPublic, location.pathname, navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <ContinuumLoader />
      {isPublic ? (
        <Outlet />
      ) : authChecked && getDemoUser() ? (
        <ProtectedShell>
          <Outlet />
        </ProtectedShell>
      ) : (
        <div className="min-h-screen bg-background" />
      )}
    </QueryClientProvider>
  );
}

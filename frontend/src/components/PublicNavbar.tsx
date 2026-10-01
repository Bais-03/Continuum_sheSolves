import { Link } from "@tanstack/react-router";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-2xl font-semibold"
        >
          <img
            src="/continuum-mark.png"
            alt="Continuum"
            className="h-10 w-10 object-contain"
          />
          <span>
            Continuum<span className="text-gold">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted"
            activeProps={{
              className:
                "rounded-md bg-muted px-3 py-2 !text-foreground",
            }}
          >
            Home
          </Link>

          <Link
            to="/about"
            className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted"
            activeProps={{
              className:
                "rounded-md bg-muted px-3 py-2 !text-foreground",
            }}
          >
            About
          </Link>

          <Link
            to="/contact"
            className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted"
            activeProps={{
              className:
                "rounded-md bg-muted px-3 py-2 !text-foreground",
            }}
          >
            Contact
          </Link>
        </nav>

        <Link
          to="/login"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}
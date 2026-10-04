import { Link } from "@tanstack/react-router";

export function PublicFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-display text-xl font-semibold">
            <img src="/continuum-mark.png" alt="" className="h-8 w-8 object-contain" />
            Continuum<span className="text-gold">.</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Household readiness, not storage. Continuum helps families understand what exists, what
            is missing, and what a successor would need to do.
          </p>
        </div>
        <div>
          <p className="eyebrow">Explore</p>
          <div className="mt-3 space-y-2 text-sm">
            <Link to="/" className="block hover:text-primary">
              Home
            </Link>
            <Link to="/about" className="block hover:text-primary">
              About
            </Link>
            <Link to="/contact" className="block hover:text-primary">
              Contact
            </Link>
          </div>
        </div>
        <div>
          <p className="eyebrow">Prototype note</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This demo uses synthetic household data. It is a product prototype, not financial or
            legal advice.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl border-t px-6 py-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Continuum · Household continuity prototype
      </div>
    </footer>
  );
}

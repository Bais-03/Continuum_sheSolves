import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileText, GitBranch, ShieldCheck, Sparkles } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicNavbar } from "@/components/PublicNavbar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Continuum — Household readiness" },
      {
        name: "description",
        content: "Know what exists, what matters, and what your successor would need to do.",
      },
      { property: "og:title", content: "Continuum — Household readiness" },
      {
        property: "og:description",
        content: "Know what exists, what matters, and what your successor would need to do.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div>
      <PublicNavbar />
      <main>
        <section className="border-b">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-10 md:grid-cols-[1.15fr_.85fr] md:items-center md:py-12">
            <div>
              <p className="eyebrow">Household continuity · successor readiness</p>
              <h1 className="mt-4 max-w-4xl text-5xl leading-[1.04] md:text-7xl">
                Documents are not readiness.{" "}
                <span className="text-primary">Continuum measures it.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Continuum turns scattered household financial knowledge into a clear readiness
                picture — then rehearses what a successor would need to do if the person who manages
                money becomes unavailable.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/about"
                  className="rounded-md border px-5 py-3 text-sm font-medium hover:bg-muted"
                >
                  Explore Continuum
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span>7 readiness dimensions</span>
                <span>Human-confirmed extraction</span>
                <span>Day-Zero playbook</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute inset-8 rounded-full bg-gold/20 blur-3xl" />
              <div className="relative rounded-2xl border bg-card p-7 shadow-sm">
                <div className="flex items-center gap-3 border-b pb-5">
                  <img
                    src="/continuum-mark.png"
                    alt="Continuum"
                    className="h-14 w-14 object-contain"
                  />
                  <div>
                    <p className="font-display text-xl">
                      Continuum<span className="text-gold">.</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Successor readiness</p>
                  </div>
                </div>
                <div className="mt-7 flex items-end justify-between">
                  <div>
                    <p className="eyebrow">Demo household</p>
                    <p className="mt-2 font-display text-2xl">The Kulkarnis</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-5xl font-semibold">56</p>
                    <p className="eyebrow">/ 100 ready</p>
                  </div>
                </div>
                <div className="mt-7 space-y-3">
                  {[
                    "Beneficiary completeness",
                    "Document accessibility",
                    "Successor knowledge",
                  ].map((label, i) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs">
                        <span>{label}</span>
                        <span>{[17, 38, 38][i]}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${[17, 38, 38][i]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-lg bg-primary p-4 text-primary-foreground">
                  <p className="text-xs uppercase tracking-[0.16em] opacity-70">Next action</p>
                  <p className="mt-1 font-medium">
                    Register nominees and record where originals are kept.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Why Continuum</p>
            <h2 className="mt-3 text-4xl">
              The hard part is not storing information. It is making it usable.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={<FileText className="h-5 w-5" />}
              title="Understand what exists"
              text="Extract important facts from household documents and let a human confirm what matters."
            />
            <FeatureCard
              icon={<GitBranch className="h-5 w-5" />}
              title="See how things connect"
              text="Map people, assets, liabilities, contacts and documents so missing relationships become visible."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Rehearse Day-Zero"
              text="Turn readiness gaps into prioritized actions and a simulated guardian release flow."
            />
          </div>
        </section>

        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-[.9fr_1.1fr] md:items-start">
              <div>
                <p className="eyebrow !text-primary-foreground/70">How it works</p>
                <h2 className="mt-3 text-4xl">From documents to decisions.</h2>
                <p className="mt-4 max-w-lg text-primary-foreground/75">
                  Continuum follows a simple flow designed around what a successor would actually
                  need at the moment knowledge becomes critical.
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  "UPLOAD — bring together household documents",
                  "EXTRACT + CONFIRM — identify and verify important facts",
                  "MAP + SCORE — connect information and measure readiness",
                  "SIMULATE + ACT — rehearse Day-Zero and close the gaps",
                ].map((step, i) => (
                  <div
                    key={step}
                    className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 p-5"
                  >
                    <div className="flex gap-4">
                      <span className="font-mono text-gold">0{i + 1}</span>
                      <p className="text-sm leading-6">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="rounded-2xl border bg-card p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="eyebrow">Built for clarity</p>
                <h2 className="mt-3 text-4xl">A calmer answer to a difficult question.</h2>
                <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
                  Who knows what your household owns, owes, renews, protects and needs to do next?
                  Continuum makes that answer visible before it becomes urgent.
                </p>
              </div>
              <Sparkles className="h-12 w-12 text-gold" />
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center md:py-20">
            <p className="eyebrow">Start with the demo</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-4xl">
              See how Continuum turns readiness into a plan.
            </h2>
            <Link
              to="/signup"
              className="mt-7 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
            >
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="card-surface p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
        {icon}
      </div>
      <h3 className="mt-5 text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

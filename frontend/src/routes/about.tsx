import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, GitBranch, LockKeyhole, Network, ShieldCheck, Target } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicNavbar } from "@/components/PublicNavbar";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Continuum" },
      {
        name: "description",
        content: "How Continuum turns household information into successor readiness.",
      },
    ],
  }),
  component: About,
});

const dimensions = [
  "Asset discovery",
  "Beneficiary completeness",
  "Deadline awareness",
  "Liability awareness",
  "Document accessibility",
  "Successor knowledge",
  "Emergency contacts",
];

function About() {
  return (
    <div>
      <PublicNavbar />
      <main>
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <p className="eyebrow">About Continuum</p>
            <h1 className="mt-4 max-w-4xl text-5xl md:text-6xl">
              A household can have every document and still be unprepared.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              Continuum is a prototype for successor financial and administrative readiness. It
              focuses on the knowledge behind the documents: what exists, who knows it, what is
              missing, and what should happen next.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="grid gap-6 md:grid-cols-2">
            <InfoBlock
              icon={<Target />}
              title="The problem"
              text="Household financial information is often distributed across policies, accounts, loans, nominees, advisors, deadlines and physical documents. A successor may have access to some of the paperwork without knowing how the pieces fit together."
            />
            <InfoBlock
              icon={<CheckCircle2 />}
              title="The Continuum approach"
              text="Instead of treating storage as the finish line, Continuum checks whether critical facts are discoverable, confirmed, connected and actionable for the person who may need to take over."
            />
          </div>
        </section>

        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[.8fr_1.2fr]">
              <div>
                <p className="eyebrow !text-primary-foreground/70">Seven dimensions</p>
                <h2 className="mt-3 text-4xl">Readiness is multidimensional.</h2>
                <p className="mt-4 leading-7 text-primary-foreground/75">
                  The prototype combines several practical questions into a single readiness picture
                  instead of relying on a document count.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {dimensions.map((dimension) => (
                  <div
                    key={dimension}
                    className="flex items-center gap-3 rounded-lg border border-primary-foreground/15 p-4 text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-gold" />
                    {dimension}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <p className="eyebrow">What the product offers</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <InfoBlock
              icon={<GitBranch />}
              title="Document extraction + confirmation"
              text="Bring in supported prototype documents, identify fields, inspect confidence, and confirm or edit the extracted information."
            />
            <InfoBlock
              icon={<Network />}
              title="Knowledge graph"
              text="Visualize the relationships among people, assets, liabilities, contacts and household records, with gaps highlighted."
            />
            <InfoBlock
              icon={<ShieldCheck />}
              title="Day-Zero playbook"
              text="Turn readiness gaps into prioritized actions for the first days and weeks after a disruptive event."
            />
            <InfoBlock
              icon={<LockKeyhole />}
              title="Guardian release"
              text="Demonstrate an AES-GCM encrypted vault with a simulated Shamir 2-of-3 release flow, so no single guardian is sufficient."
            />
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center">
            <h2 className="text-4xl">Ready to see the prototype?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Create a demo account and explore the same dashboard, graph, Day-Zero playbook and
              guardian flow.
            </p>
            <Link
              to="/signup"
              className="mt-7 inline-block rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
            >
              Get started
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function InfoBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
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

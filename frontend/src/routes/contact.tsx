import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageSquare, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicNavbar } from "@/components/PublicNavbar";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Continuum" },
      { name: "description", content: "Contact the Continuum project team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <div>
      <PublicNavbar />
      <main>
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <p className="eyebrow">Contact</p>
            <h1 className="mt-4 max-w-4xl text-5xl md:text-6xl">
              Let's talk about household continuity.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Questions, feedback, collaboration ideas or demo requests — send a note to the
              Continuum project team.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[.75fr_1.25fr] md:py-20">
          <div className="space-y-4">
            <ContactCard
              icon={<MessageSquare />}
              title="Project feedback"
              text="Tell us what is clear, what is confusing, or what would make the readiness journey more useful."
            />
            <ContactCard
              icon={<Mail />}
              title="Team contact"
              text="The production contact channel can be connected here when the project moves beyond the prototype."
            />
          </div>

          <form onSubmit={submit} className="card-surface p-6 md:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm">
                Name
                <input
                  required
                  name="name"
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your name"
                />
              </label>
              <label className="text-sm">
                Email
                <input
                  required
                  type="email"
                  name="email"
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@example.com"
                />
              </label>
            </div>
            <label className="mt-5 block text-sm">
              Subject
              <input
                required
                name="subject"
                className="mt-2 w-full rounded-md border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                placeholder="How can we help?"
              />
            </label>
            <label className="mt-5 block text-sm">
              Message
              <textarea
                required
                name="message"
                rows={7}
                className="mt-2 w-full resize-none rounded-md border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                placeholder="Write your message..."
              />
            </label>
            <button
              type="submit"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
            >
              <Send className="h-4 w-4" /> Send message
            </button>
            {sent && (
              <p className="mt-4 text-sm text-success">
                Thanks — your message is captured in this prototype. Connect a backend email service
                to deliver it.
              </p>
            )}
          </form>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function ContactCard({
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
      <h2 className="mt-5 font-display text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

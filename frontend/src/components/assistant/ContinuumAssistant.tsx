
import { useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type Message = {
  role: "assistant" | "user";
  text: string;
};

type ChatResponse = {
  answer: string;
};

const suggestions = [
  "What is readiness integrity?",
  "How do I resolve conflicting records?",
  "How does guardian release work?",
  "How can I improve my readiness?",
];

function getAnswer(question: string): string {
  const q = question.toLowerCase();

  if (
    q.includes("conflict") ||
    q.includes("conflicting") ||
    q.includes("inconsisten")
  ) {
    return "Continuum checks confirmed information across household documents. When supported fields contain different values, it flags a conflict for human review. Open Knowledge Graph → Household Analysis to inspect the reported gap and recommended action. The system should not automatically choose which value is correct.";
  }

  if (
    q.includes("guardian") ||
    q.includes("release") ||
    q.includes("successor") ||
    q.includes("approval")
  ) {
    return "Controlled release uses a guardian approval workflow. The household owner creates a release request, and assigned active guardians approve it. In this prototype, the release threshold is two approvals. After release, an authorized guardian can access the permitted confirmed, non-empty successor information. Open Guardian Release or Guardian Portal to use the workflow.";
  }

  if (
    q.includes("readiness") ||
    q.includes("score") ||
    q.includes("integrity") ||
    q.includes("improve")
  ) {
    return "Readiness integrity is about making scores reflect meaningful evidence, not merely the number of fields present. Continuum can report evidence coverage, duplicate evidence, empty confirmed values, and missing or unconfirmed information. Open Dashboard to review your dimension scores and explanations. To improve readiness, resolve missing information, confirm valid facts, and investigate conflicts.";
  }

  if (
    q.includes("graph") ||
    q.includes("day-zero") ||
    q.includes("playbook") ||
    q.includes("action")
  ) {
    return "The Knowledge Graph helps organize household entities and relationships, while analysis identifies gaps and produces suggested Day-Zero actions. Open Knowledge Graph to review the analysis, then open Day-Zero to explore the resulting action plan.";
  }

  if (
    q.includes("upload") ||
    q.includes("document") ||
    q.includes("file")
  ) {
    return "Open Upload & Confirm to add a supported document. Review the extracted fields and confirm only information that is accurate. Then revisit Dashboard and Knowledge Graph to see the information reflected in readiness and gap analysis.";
  }

  if (
    q.includes("hello") ||
    q.includes("hi") ||
    q.includes("hey")
  ) {
    return "Hello! I'm the Continuum Assistant. I can explain readiness scores, missing information, conflicting records, guardian release, and Day-Zero actions. What would you like help with?";
  }

  return "I couldn't reach the AI service, so I can still help with common Continuum questions. Try asking about readiness integrity, conflicting records, document uploads, the Knowledge Graph, Day-Zero actions, or guardian release.";
}

export function ContinuumAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm the Continuum Assistant. I can help you understand readiness, resolve data gaps, explore conflicts, and learn about controlled release. Ask me anything about Continuum!",
    },
  ]);

  async function sendMessage(text: string) {
    const question = text.trim();

    if (!question || loading) {
      return;
    }

    // Show the user's message immediately.
    setMessages((previous) => [
      ...previous,
      { role: "user", text: question },
    ]);

    setInput("");
    setLoading(true);

    try {
      const result = (await apiRequest("/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: question,
        }),
      })) as ChatResponse;

      const answer =
        typeof result?.answer === "string" && result.answer.trim()
          ? result.answer.trim()
          : getAnswer(question);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: answer,
        },
      ]);
    } catch (error) {
      console.error("Continuum Assistant request failed:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: getAnswer(question),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100]">
      {open && (
        <section
          className="mb-3 flex h-[min(560px,75vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl"
          aria-label="Continuum Assistant chat"
          aria-busy={loading}
        >
          {/* Header */}
          <header className="flex items-center gap-3 border-b bg-primary p-4 text-primary-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
              <Sparkles size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold">Continuum Assistant</p>
              <p className="text-xs opacity-80">
                AI-powered product guidance
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-2 hover:bg-white/15"
            >
              <X size={19} />
            </button>
          </header>

          {/* Messages */}
          <div
            className="flex-1 space-y-4 overflow-y-auto p-4"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`flex gap-2 ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles size={15} />
                  </span>
                )}

                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.text}
                </div>

                {message.role === "user" && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User size={15} />
                  </span>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                role="status"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles size={15} />
                </span>
                <span>Continuum is thinking...</span>
              </div>
            )}

            {/* Suggested questions */}
            {messages.length === 1 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground">
                  Suggested questions
                </p>

                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={loading}
                    onClick={() => void sendMessage(suggestion)}
                    className="block w-full rounded-xl border px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message input */}
          <form
            className="flex items-center gap-2 border-t p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about Continuum..."
              aria-label="Message Continuum Assistant"
              disabled={loading}
              maxLength={1500}
              className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      {/* Floating chat button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-label={open ? "Close chat" : "Open Continuum Assistant"}
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground shadow-lg transition hover:opacity-90"
        >
          {open ? <X size={20} /> : <MessageCircle size={20} />}
          <span>{open ? "Close" : "Ask Continuum"}</span>
        </button>
      </div>
    </div>
  );
}

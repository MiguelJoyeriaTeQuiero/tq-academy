"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { HeartMark } from "@/components/brand/logo";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Msg = {
  role: "assistant",
  content:
    "¡Hola! Soy **tu asistente educativo** de TQ Academy. Pregúntame sobre tus cursos y materiales — respondo basándome en los PDFs cargados.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [docsUsed, setDocsUsed] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    const newHistory: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    // Placeholder for streaming assistant message
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chatbot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: newHistory.slice(0, -1).filter((m) => m !== WELCOME),
        }),
      });

      const docsHeader = res.headers.get("X-Docs-Used");
      if (docsHeader) setDocsUsed(Number(docsHeader));

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Error" }));
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `⚠️ ${err.error ?? "No pude responder ahora mismo."}`,
          };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `⚠️ ${e instanceof Error ? e.message : "Error de red"}`,
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* ── Floating button ───────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        className={cn(
          "fixed bottom-6 right-6 z-50 group",
          "w-14 h-14 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-tq-sky to-tq-ink text-white",
          "shadow-tq-float ring-1 ring-white/30",
          "hover:scale-105 active:scale-95 transition-transform duration-200",
        )}
      >
        {/* gold halo */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-tq-gold/40 blur-xl opacity-60 group-hover:opacity-90 transition-opacity"
        />
        <span className="relative">
          {open ? (
            <X className="w-6 h-6" />
          ) : (
            <Sparkles className="w-6 h-6" />
          )}
        </span>
        {/* pulsing ring */}
        {!open && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full ring-2 ring-tq-gold/50 animate-ping"
          />
        )}
      </button>

      {/* ── Panel ──────────────────────────────────────────── */}
      {open && (
        <div
          className={cn(
            "fixed z-50 bottom-24 right-6",
            "w-[min(92vw,400px)] h-[min(78vh,620px)]",
            "rounded-2xl overflow-hidden flex flex-col",
            "bg-tq-cream border border-tq-ink/15 shadow-tq-float",
            "slide-up",
          )}
        >
          {/* Header */}
          <div className="relative px-4 py-3 bg-gradient-to-br from-[#003B58] to-tq-ink text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-tq-sky flex items-center justify-center ring-1 ring-white/30 shadow-tq-soft">
                <HeartMark className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] leading-none">
                  TQ Asistente
                </p>
                <p className="text-[11px] text-white/80 mt-1 italic">
                  Tu copiloto de formación
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/75 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* gold filet */}
            <div className="absolute left-4 right-4 bottom-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-tq-cream"
          >
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} content={m.content} />
            ))}
            {loading &&
              messages[messages.length - 1]?.content === "" && (
                <div className="flex items-center gap-2 text-tq-ink/60 text-xs px-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Pensando…
                </div>
              )}
          </div>

          {/* Footer note */}
          {docsUsed !== null && (
            <div className="px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] text-tq-ink/50 border-t border-tq-ink/10 bg-tq-paper/60">
              {docsUsed} {docsUsed === 1 ? "documento" : "documentos"} consultados
            </div>
          )}

          {/* Input */}
          <div className="border-t border-tq-ink/10 p-3 bg-tq-paper/40">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Pregúntame sobre tus cursos…"
                disabled={loading}
                className={cn(
                  "flex-1 resize-none bg-white rounded-xl px-3 py-2.5",
                  "text-sm text-tq-ink placeholder:text-tq-ink/40",
                  "border border-tq-ink/15 focus:border-tq-sky focus:ring-2 focus:ring-tq-sky/20 outline-none",
                  "max-h-32",
                )}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="Enviar"
                className={cn(
                  "h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center",
                  "bg-tq-ink text-white hover:bg-tq-deep transition-colors",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-tq-ink/40 mt-2 text-center">
              Respuestas basadas en tus materiales · puede equivocarse
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// ───────────────────────────────────────────────────────────
// Lightweight markdown-ish renderer (bold, inline code, lists, line breaks)
// ───────────────────────────────────────────────────────────
function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-tq-ink text-white rounded-br-md"
            : "bg-white border border-tq-ink/10 text-tq-ink rounded-bl-md shadow-tq-soft",
        )}
      >
        <FormattedText text={content} />
      </div>
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  if (!text) return <span className="text-tq-ink/30">…</span>;
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        const bullet = /^[-*]\s+/.test(trimmed);
        const numbered = /^\d+\.\s+/.test(trimmed);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-tq-gold2 mt-0.5">·</span>
              <span>{renderInline(trimmed.replace(/^[-*]\s+/, ""))}</span>
            </div>
          );
        }
        if (numbered) {
          const m = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (m) {
            return (
              <div key={i} className="flex gap-2">
                <span className="text-tq-gold2 mt-0.5 font-semibold">{m[1]}.</span>
                <span>{renderInline(m[2])}</span>
              </div>
            );
          }
        }
        return <div key={i}>{renderInline(trimmed)}</div>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // **bold** and `code`
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push(text.slice(lastIndex, m.index));
    }
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <code
          key={key++}
          className="font-mono text-[0.85em] px-1 py-0.5 rounded bg-tq-ink/5"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    lastIndex = m.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

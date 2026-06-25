"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

type ChatMessage = { role: "user" | "assistant"; content: string };

type ChatMode = "member" | "public" | "admin";

interface ChatWidgetProps {
  mode?: ChatMode;
  className?: string;
}

const MEMBER_SUGGESTIONS = [
  "What's my membership status?",
  "Which events am I registered for?",
  "How do I renew my membership?",
];

const PUBLIC_SUGGESTIONS = [
  "What membership tiers are available?",
  "What events are coming up?",
  "How do I join the chamber?",
];

const ADMIN_SUGGESTIONS = [
  "Give me a dashboard summary",
  "Who has pending applications?",
  "Who hasn't paid yet?",
];

const MODE_CONFIG: Record<
  ChatMode,
  { title: string; intro: string; suggestions: string[]; needsAuth: boolean }
> = {
  member: {
    title: "Member Assistant",
    intro: "Ask about your membership, events, or payments.",
    suggestions: MEMBER_SUGGESTIONS,
    needsAuth: true,
  },
  public: {
    title: "DHCC Assistant",
    intro: "Ask about joining DHCC or upcoming events.",
    suggestions: PUBLIC_SUGGESTIONS,
    needsAuth: false,
  },
  admin: {
    title: "Admin Assistant",
    intro: "Ask about members, payments, events, and analytics.",
    suggestions: ADMIN_SUGGESTIONS,
    needsAuth: true,
  },
};

export function ChatWidget({ mode = "member", className }: ChatWidgetProps) {
  const { getIdToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const config = MODE_CONFIG[mode];
  const { title, intro, suggestions, needsAuth } = config;

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setError("");
      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput("");
      setLoading(true);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (needsAuth) {
          const token = await getIdToken();
          if (!token) {
            setError("Please sign in to use the assistant.");
            setMessages(messages);
            return;
          }
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({ messages: nextMessages, mode }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to send message");
        }

        setMessages([
          ...nextMessages,
          { role: "assistant", content: data.message },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setMessages(messages);
      } finally {
        setLoading(false);
      }
    },
    [getIdToken, loading, messages, mode]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className={cn("fixed bottom-4 right-4 z-40", className)}>
      {open && (
        <div className="mb-3 flex h-[min(28rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                {title}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
          >
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {intro}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-teal-700 text-white"
                    : "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200"
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}

            {loading && (
              <div className="max-w-[90%] rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                Thinking…
              </div>
            )}
          </div>

          {error && (
            <p className="px-3 pb-1 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 border-t border-gray-200 p-2 dark:border-slate-700"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={1}
              placeholder="Type a message…"
              className="max-h-24 flex-1 resize-none rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              disabled={loading}
            />
            <Button type="submit" size="sm" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <Button
        onClick={() => setOpen((v) => !v)}
        className="h-11 w-11 rounded-full shadow-lg"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>
    </div>
  );
}

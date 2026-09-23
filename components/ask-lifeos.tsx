'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X, Send } from 'lucide-react';
import { Button } from './ui/button';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const QUICK_PROMPTS = [
  'What should I study today?',
  'Am I on track?',
  'Plan my next 2 hours',
  'Help me revise',
];

export function AskLifeOS() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;

    const next: Message[] = [
      ...messages,
      {
        role: 'user',
        content: text,
      },
    ];

    setMessages(next);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: next.slice(0, -1),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.answer,
        },
      ]);

      if (data.action) {
        router.refresh();
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-line bg-surface px-4 py-3.5 text-left transition-colors hover:bg-line/30 focus-ring"
      >
        <span className="flex items-center gap-2 text-sm text-ink">
          <Sparkles size={15} className="text-moss" />
          Ask LifeOS
        </span>

        <span className="text-muted">→</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="flex items-center gap-2 text-sm text-ink">
          <Sparkles size={15} className="text-moss" />
          Ask LifeOS
        </span>

        <button
          onClick={() => setOpen(false)}
          className="p-1 text-muted hover:text-ink focus-ring"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="max-h-80 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-moss hover:text-ink focus-ring"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={message.role === 'user' ? 'text-right' : ''}
          >
            <p
              className={
                message.role === 'user'
                  ? 'inline-block max-w-[85%] rounded-lg bg-ink px-3 py-2 text-left text-sm text-paper'
                  : 'inline-block max-w-[85%] whitespace-pre-line rounded-lg bg-line/50 px-3 py-2 text-left text-sm text-ink'
              }
            >
              {message.content}
            </p>
          </div>
        ))}

        {loading && (
          <p className="text-xs text-muted">
            Thinking…
          </p>
        )}

        {error && (
          <p className="text-xs text-rust">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-line p-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              send(input);
            }
          }}
          placeholder="Ask anything about your plan…"
          className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus-ring"
        />

        <Button
          onClick={() => send(input)}
          disabled={loading}
          aria-label="Send"
        >
          <Send size={14} />
        </Button>
      </div>
    </div>
  );
}
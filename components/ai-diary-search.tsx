'use client';

import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Sparkles } from 'lucide-react';

export function AiDiarySearch() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        setAnswer(data.answer);
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-sm text-ink"><Sparkles size={14} className="text-moss" /> Ask your diary</p>
      <div className="mt-3 flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder="When did I first write about..."
        />
        <Button onClick={ask} disabled={loading}>{loading ? 'Thinking…' : 'Ask'}</Button>
      </div>
      {error && <p className="mt-3 text-xs text-rust">{error}</p>}
      {answer && <p className="mt-3 whitespace-pre-line text-sm text-ink/90">{answer}</p>}
    </div>
  );
}

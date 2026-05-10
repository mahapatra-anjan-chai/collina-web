'use client';

import { useState } from 'react';
import { parseRoster, RosterMatchResult } from '@/lib/parseRoster';
import { Player } from '@/lib/types';

type Props = {
  players: Player[];
  onApply: (matchedNames: string[]) => void;
};

export default function PasteRosterPanel({ players, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<RosterMatchResult | null>(null);

  function handleApply() {
    const result = parseRoster(text, players);
    setFeedback(result);
    onApply(result.matched);
  }

  function handleClear() {
    setText('');
    setFeedback(null);
  }

  const total = feedback
    ? feedback.matched.length + feedback.unmatched.length + feedback.ambiguous.length
    : 0;
  const hasIssues =
    !!feedback && (feedback.unmatched.length > 0 || feedback.ambiguous.length > 0);

  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-semibold tracking-tight">📋 Paste from WhatsApp</span>
        <span className="text-white/40 text-sm">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={6}
            placeholder="Paste tonight's WhatsApp roster here…"
            className="w-full rounded-xl bg-zinc-900 border border-white/10 p-3 text-sm font-mono leading-relaxed focus:outline-none focus:border-white/30"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              disabled={!text.trim()}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 active:scale-95 transition-all disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed"
            >
              Apply →
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
            >
              Clear
            </button>
          </div>

          {feedback && (
            <div
              className={`rounded-xl px-4 py-3 text-sm leading-relaxed border ${
                hasIssues
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200/80'
              }`}
            >
              <p className="font-semibold">
                ✓ Matched {feedback.matched.length} of {total}
              </p>
              {feedback.unmatched.length > 0 && (
                <p className="text-xs mt-1.5 opacity-90">
                  Couldn&apos;t find: {feedback.unmatched.join(', ')}
                </p>
              )}
              {feedback.ambiguous.length > 0 && (
                <p className="text-xs mt-1.5 opacity-90">
                  Ambiguous:{' '}
                  {feedback.ambiguous
                    .map(a => `${a.input} (${a.candidates.join(' / ')})`)
                    .join('; ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

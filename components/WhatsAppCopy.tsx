'use client';

import { useState } from 'react';
import { GenerateResult } from '@/lib/types';

interface WhatsAppCopyProps {
  result: GenerateResult;
}

function formatForWhatsApp(result: GenerateResult): string {
  const a = result.teamA.players.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
  const b = result.teamB.players.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
  return `Team A\n${a}\n\nTeam B\n${b}`;
}

export default function WhatsAppCopy({ result }: WhatsAppCopyProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = formatForWhatsApp(result);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers / Android WebViews
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      onClick={handleCopy}
      className={`
        w-full py-4 rounded-2xl font-bold text-base transition-all duration-200
        ${copied
          ? 'bg-emerald-500 text-white'
          : 'bg-white text-black hover:bg-white/90 active:scale-95'
        }
      `}
    >
      {copied ? '✓ Copied!' : 'Copy for WhatsApp'}
    </button>
  );
}

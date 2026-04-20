'use client';
// DEMO PAGE — delete after approval

// Collina silhouette as inline SVG (referee raising card)
function CollinaAvatar({ size = 48, rounded = 'full' }: { size?: number; rounded?: string }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-${rounded} bg-zinc-700 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden`}
    >
      <svg viewBox="0 0 48 48" width={size * 0.75} height={size * 0.75} fill="none">
        {/* Head */}
        <circle cx="24" cy="12" r="7" fill="#d1d5db" />
        {/* Body — referee shirt */}
        <path d="M14 28 C14 20 34 20 34 28 L34 40 L14 40 Z" fill="#374151" />
        {/* Raised arm with card */}
        <path d="M34 26 L42 18" stroke="#d1d5db" strokeWidth="3.5" strokeLinecap="round" />
        {/* Yellow card */}
        <rect x="39" y="12" width="7" height="9" rx="1" fill="#fbbf24" />
        {/* Other arm */}
        <path d="M14 26 L8 30" stroke="#d1d5db" strokeWidth="3.5" strokeLinecap="round" />
        {/* Legs */}
        <path d="M19 40 L17 48" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
        <path d="M29 40 L31 48" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function BrandingDemo() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white px-4 py-10 space-y-16 max-w-lg mx-auto">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">Branding Preview</h1>
        <p className="text-white/30 text-sm">3 options — tell me which you prefer (or mix)</p>
        <p className="text-white/20 text-xs">Swap in your own Collina photo — placeholder shown here</p>
      </div>

      {/* ── OPTION A: Portrait badge in the home header ── */}
      <div className="space-y-3">
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Option A — Portrait in header (home page)</p>
        <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10">
          <div className="px-5 pt-6 pb-4 space-y-4">
            <div className="flex items-center gap-3">
              <CollinaAvatar size={52} />
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-none">Collina</h2>
                <p className="text-white/30 text-xs mt-0.5">Named after Pierluigi Collina</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white/30 text-sm">Sunday 20 Apr</p>
              <div className="flex gap-3 text-xs text-white/40">
                <span>⚖️ Ratings</span><span>📋 History</span><span>⚙️ Manager</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 px-5 py-2.5 flex items-center justify-between">
            <span className="text-white/20 text-xs">collina-web.vercel.app</span>
            <span className="text-white/20 text-xs">by <span className="text-white/35 font-medium">Anjan</span></span>
          </div>
        </div>
        <p className="text-white/25 text-xs px-1">Photo sits next to the app name. "by Anjan" in the footer strip. Clean and permanent.</p>
      </div>

      {/* ── OPTION B: Subtle footer watermark ── */}
      <div className="space-y-3">
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Option B — Persistent footer watermark (every page)</p>
        <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10">
          <div className="px-5 pt-5 pb-4 space-y-3">
            <h2 className="text-xl font-black">VeloCT</h2>
            <div className="grid grid-cols-3 gap-2">
              {['Anjan', 'Santi', 'Hardik', 'Akhil', 'Palash', 'Vivek'].map(n => (
                <div key={n} className="bg-white/5 rounded-xl px-3 py-2 text-xs text-white/60">{n}</div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/5 px-4 py-3 flex items-center gap-3">
            <CollinaAvatar size={28} rounded="lg" />
            <p className="text-white/20 text-xs flex-1">
              Inspired by <span className="text-white/40 font-medium">Pierluigi Collina</span>
            </p>
            <p className="text-white/20 text-xs">Made by <span className="text-white/40 font-medium">Anjan</span></p>
          </div>
        </div>
        <p className="text-white/25 text-xs px-1">Small photo + credit bar appears at the bottom of every page. Discreet, always present.</p>
      </div>

      {/* ── OPTION C: About card at bottom of home ── */}
      <div className="space-y-3">
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Option C — About card (home page, below player grid)</p>
        <div className="space-y-2">
          <div className="bg-zinc-900 rounded-2xl border border-white/10 px-5 py-3">
            <p className="text-white/20 text-xs text-center">… player grid …</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-start">
            <CollinaAvatar size={64} rounded="xl" />
            <div className="space-y-1.5 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Named after<br />Pierluigi Collina</p>
              <p className="text-white/40 text-xs leading-relaxed">
                The legendary Italian referee known for fearless authority and total fairness — just like your Sunday game deserves.
              </p>
              <p className="text-white/25 text-xs pt-0.5">
                Built by <span className="text-white/45 font-semibold">Anjan</span> · VeloCT FC
              </p>
            </div>
          </div>
        </div>
        <p className="text-white/25 text-xs px-1">A mini "About" card. Tells the story of the name. Swap in a real photo of Collina for best effect.</p>
      </div>

      {/* ── Combo suggestion ── */}
      <div className="space-y-3">
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Recommended combo: A + B</p>
        <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10">
          <div className="px-5 pt-6 pb-4 space-y-4">
            <div className="flex items-center gap-3">
              <CollinaAvatar size={52} />
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-none">Collina</h2>
                <p className="text-white/30 text-xs mt-0.5">Named after Pierluigi Collina</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white/30 text-sm">Sunday 20 Apr</p>
              <div className="flex gap-3 text-xs text-white/40">
                <span>⚖️ Ratings</span><span>📋 History</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['Anjan', 'Santi', 'Hardik', 'Akhil'].map(n => (
                <div key={n} className="bg-white/5 rounded-xl px-2 py-2 text-xs text-white/60 text-center">{n}</div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/5 px-4 py-3 flex items-center gap-3">
            <CollinaAvatar size={24} rounded="md" />
            <p className="text-white/20 text-xs flex-1">Inspired by <span className="text-white/35 font-medium">Pierluigi Collina</span></p>
            <p className="text-white/20 text-xs">by <span className="text-white/35 font-medium">Anjan</span></p>
          </div>
        </div>
        <p className="text-white/25 text-xs px-1">Photo in the header tells the story at a glance. Footer credit is always present. Most impactful combo.</p>
      </div>

      <p className="text-center text-white/15 text-xs pb-8">Demo only — not committed. Tell me which option you want.</p>
    </main>
  );
}

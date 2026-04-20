'use client';

const PLAYERS = ['Anjan', 'Santi', 'Hardik', 'Akhil', 'Palash', 'Vivek', 'Rohan', 'Sterbin', 'Iknoor', 'Kavi'];
const SELECTED = new Set(['Santi', 'Hardik']);

const THEMES = [
  {
    name: 'Option 1 — Pitch Night',
    desc: 'Deep green-black + lime accent. Feels like a floodlit pitch.',
    bg: '#0d1f13',
    card: '#122a1a',
    cardBorder: '#1e4a2a',
    accent: '#4ade80',
    accentText: '#000000',
    accentMuted: 'rgba(74,222,128,0.15)',
    accentBorder: 'rgba(74,222,128,0.35)',
    textPrimary: '#f0fdf4',
    textMuted: 'rgba(240,253,244,0.45)',
    navBg: 'rgba(240,253,244,0.08)',
    selectedBg: 'rgba(74,222,128,0.12)',
    selectedBorder: '#4ade80',
    footerBg: '#0a1a0f',
  },
  {
    name: 'Option 2 — Classic Kit',
    desc: 'Navy + gold. Timeless matchday programme feel.',
    bg: '#0f172a',
    card: '#1e293b',
    cardBorder: '#2d3f55',
    accent: '#f59e0b',
    accentText: '#000000',
    accentMuted: 'rgba(245,158,11,0.15)',
    accentBorder: 'rgba(245,158,11,0.35)',
    textPrimary: '#f8fafc',
    textMuted: 'rgba(248,250,252,0.45)',
    navBg: 'rgba(248,250,252,0.08)',
    selectedBg: 'rgba(245,158,11,0.12)',
    selectedBorder: '#f59e0b',
    footerBg: '#0a1020',
  },
  {
    name: 'Option 3 — Sunday League',
    desc: 'Charcoal + red & yellow. Passion + captain\'s armband energy.',
    bg: '#111827',
    card: '#1f2937',
    cardBorder: '#374151',
    accent: '#ef4444',
    accentText: '#ffffff',
    accentMuted: 'rgba(239,68,68,0.15)',
    accentBorder: 'rgba(239,68,68,0.35)',
    textPrimary: '#f9fafb',
    textMuted: 'rgba(249,250,251,0.45)',
    navBg: 'rgba(249,250,251,0.08)',
    selectedBg: 'rgba(239,68,68,0.12)',
    selectedBorder: '#ef4444',
    footerBg: '#0d1117',
    accent2: '#fbbf24',
  },
];

function ThemeCard({ theme }: { theme: typeof THEMES[0] }) {
  const t = theme;
  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: '0' }}>
      {/* Label */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${t.cardBorder}`, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: t.accent, fontWeight: 700, fontSize: 13 }}>{t.name}</span>
        <span style={{ color: t.textMuted, fontSize: 12 }}>{t.desc}</span>
      </div>

      {/* App header */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h1 style={{ color: t.textPrimary, fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>VeloCT</h1>
            <p style={{ color: t.textMuted, fontSize: 11, margin: '2px 0 0' }}>Sunday 20 Apr</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Ratings', 'History', 'Manager'].map(label => (
              <button key={label} style={{ background: t.navBg, color: t.textPrimary, border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Suggested banner */}
        <div style={{ background: t.accentMuted, border: `1px solid ${t.accentBorder}`, borderRadius: 12, padding: '10px 14px', marginBottom: 14, cursor: 'pointer' }}>
          <div style={{ color: t.accent, fontWeight: 700, fontSize: 13 }}>⚡ A team split has been suggested</div>
          <div style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>Tap to view or swap — manager hasn't locked it yet</div>
        </div>

        {/* Section label */}
        <p style={{ color: t.textMuted, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Regulars · 8 / 10</p>

        {/* Player chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
          {PLAYERS.map(name => {
            const sel = SELECTED.has(name);
            return (
              <div key={name} style={{
                background: sel ? t.selectedBg : 'rgba(255,255,255,0.05)',
                border: `1px solid ${sel ? t.selectedBorder : t.cardBorder}`,
                borderRadius: 10,
                padding: '9px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: sel ? `0 0 10px ${t.selectedBorder}33` : 'none',
              }}>
                <span style={{ color: sel ? t.accent : t.textPrimary, fontSize: 13, fontWeight: sel ? 700 : 500 }}>{name}</span>
                {sel && <span style={{ color: t.accent, fontSize: 14 }}>✓</span>}
              </div>
            );
          })}
        </div>

        {/* Generate button */}
        <div style={{ padding: '10px 0 16px' }}>
          <div style={{ fontSize: 11, color: t.textMuted, textAlign: 'center', marginBottom: 8 }}>2 selected · select 14–16 to generate</div>
          <button style={{
            width: '100%',
            background: t.accent,
            color: t.accentText,
            border: 'none',
            borderRadius: 14,
            padding: '14px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '-0.2px',
          }}>
            Generate Teams (8v8)
          </button>
          {'accent2' in t && (
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 4, background: (t as any).accent2 }} />
              <div style={{ flex: 1, height: 3, borderRadius: 4, background: t.accent }} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: t.footerBg, borderTop: `1px solid ${t.cardBorder}`, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: t.textMuted, fontSize: 11 }}>collina-web.vercel.app</span>
        <span style={{ color: t.textMuted, fontSize: 11 }}>by <span style={{ color: t.accent, fontWeight: 600 }}>Anjan</span></span>
      </div>
    </div>
  );
}

export default function ColorDemo() {
  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <div style={{ padding: '20px 16px 8px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0 }}>Color Theme Preview</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>Pick the one you want — I'll apply it to the whole app</p>
      </div>
      {THEMES.map(theme => (
        <div key={theme.name} style={{ marginTop: 16 }}>
          <ThemeCard theme={theme} />
        </div>
      ))}
    </div>
  );
}

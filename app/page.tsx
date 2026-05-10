import Link from 'next/link';
import Image from 'next/image';

export default function OnboardingPage() {
  return (
    <main className="min-h-screen px-6 py-10 max-w-md mx-auto flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center pt-8 pb-10">
        <div className="mb-6 rounded-full overflow-hidden ring-2 ring-white/10 w-48 h-48 relative">
          <Image
            src="/collina.jpeg"
            alt="Pierluigi Collina"
            fill
            sizes="192px"
            className="object-cover"
            priority
          />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Collina</h1>
        <p className="mt-3 text-white/50 text-base leading-relaxed">
          Balanced teams. Every game.
        </p>
      </div>

      {/* Widgets */}
      <div className="space-y-3 pb-8">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-1">
          I am a…
        </p>

        <Link
          href="/play"
          className="block w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-5 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">👤</div>
            <div className="flex-1 text-left">
              <p className="font-bold text-base tracking-tight">Player</p>
              <p className="text-white/50 text-sm mt-0.5">Pick tonight's squad and see the split</p>
            </div>
            <span className="text-white/30 text-xl">→</span>
          </div>
        </Link>

        <Link
          href="/manager"
          className="block w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-5 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">🛡️</div>
            <div className="flex-1 text-left">
              <p className="font-bold text-base tracking-tight">Team Manager</p>
              <p className="text-white/50 text-sm mt-0.5">Sign in to lock teams and record results</p>
            </div>
            <span className="text-white/30 text-xl">→</span>
          </div>
        </Link>
      </div>

      <p className="text-center text-white/20 text-xs pb-2">
        Crafted by Anjan Mahapatra
      </p>
    </main>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Top nav */}
      <header className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-sm" />
          <span className="font-semibold tracking-tight">Save Game</span>
        </div>

        <nav className="flex items-center gap-4 text-sm">
          <a className="text-slate-300 hover:text-white" href="#how">
            How it works
          </a>
          <a className="text-slate-300 hover:text-white" href="#pricing">
            Pricing
          </a>
          <a className="underline underline-offset-4" href="/login">
            Sign in
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-fuchsia-500" />
              Daily saves. Private by default. No judgement.
            </p>

            <h1 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
              Your gaming life, <span className="text-fuchsia-400">remembered</span>.
            </h1>

            <p className="text-lg text-slate-300">
              Save Game is a tiny daily journal for gamers. Log what you played, how it felt,
              and what mattered — even if today’s “session” was just thinking about playing
              while scrolling your backlog.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-fuchsia-600 px-5 py-3 font-medium text-white hover:bg-fuchsia-500"
              >
                Start saving for free
              </a>
              <a
                href="/today"
                className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 py-3 font-medium text-white hover:bg-white/10"
              >
                Go to Today
              </a>
            </div>

            <p className="text-sm text-slate-400">
              No social feed. No “grindset” charts. Just you, keeping the good bits.
            </p>
          </div>

          {/* Hero mock card */}
          <div className="lg:justify-self-end">
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-6 shadow-sm">
              <div className="absolute -top-3 left-6 rounded-full border border-white/10 bg-black px-3 py-1 text-xs text-slate-300">
                Today
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">🔥 Streak: <strong className="text-white">7</strong></span>
                  <span className="text-slate-400">Last saved: yesterday</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Game</p>
                      <p className="text-lg font-semibold">Baldur’s Gate 3</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Time</p>
                      <p className="text-lg font-semibold">90m</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300 border border-white/10">PC</span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300 border border-white/10">Mood: 😌</span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300 border border-white/10">Notes</span>
                  </div>

                  <p className="mt-3 text-sm text-slate-300">
                    “Finally beat that boss. Felt unfair. Felt great. Both can be true.”
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    One entry a day keeps the streak alive.
                  </span>
                  <span className="text-xs text-fuchsia-300">
                    Game saved. Streak safe.
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              (Yes, this is a journal app. For gamers. You’re allowed one soft hobby.)
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
        <p className="mt-2 text-slate-300">
          It’s deliberately simple. The point is to show up — not optimise yourself into a spreadsheet.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-fuchsia-300">1</p>
            <h3 className="mt-2 font-semibold">Log today</h3>
            <p className="mt-1 text-sm text-slate-300">
              Game (optional), platform, mood, minutes, notes. Done in under a minute.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-fuchsia-300">2</p>
            <h3 className="mt-2 font-semibold">Keep your streak</h3>
            <p className="mt-1 text-sm text-slate-300">
              Don’t play today? Log that anyway. Streaks are about showing up, not hours logged.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-fuchsia-300">3</p>
            <h3 className="mt-2 font-semibold">Look back</h3>
            <p className="mt-1 text-sm text-slate-300">
              Your history becomes a timeline of games, moods, and little moments you’d otherwise forget.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-bold tracking-tight">Pricing</h2>
        <p className="mt-2 text-slate-300">
          Free is genuinely useful. Pro just removes the limits once you’re invested.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-1 text-sm text-slate-300">Start the habit. Keep it simple.</p>

            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>• Daily saves + streak tracking</li>
              <li>• One platform per day</li>
              <li>• Basic history (last 30 days)</li>
              <li>• Ads (later)</li>
            </ul>

            <a
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 py-3 font-medium hover:bg-white/10"
            >
              Start free
            </a>
          </div>

          <div className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-b from-fuchsia-500/10 to-white/[0.02] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pro</h3>
              <span className="rounded-full bg-fuchsia-600/30 px-3 py-1 text-xs text-fuchsia-200 border border-fuchsia-500/30">
                Coming soon
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-300">For people with multiple platforms and long memories.</p>

            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>• Multi-platform entries</li>
              <li>• Unlimited history</li>
              <li>• Deeper stats & trends</li>
              <li>• Streak protection (freezes)</li>
              <li>• Ad-free</li>
            </ul>

            <button
              disabled
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-fuchsia-600/40 px-5 py-3 font-medium text-white/80 cursor-not-allowed"
              title="We’ll wire payments later."
            >
              Upgrade (soon)
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-500">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Save Game</p>
          <p>
            Web-first now. Mobile later. (We’ll pretend that’s a plan, not a coping mechanism.)
          </p>
        </div>
      </footer>
    </main>
  );
}

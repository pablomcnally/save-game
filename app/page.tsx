"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600/20 border border-fuchsia-500/40 text-fuchsia-200 text-xs">
        ✓
      </span>
      <span className="text-slate-200">{children}</span>
    </li>
  );
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSignedIn(!!data.session);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* CSS: animated streak flame */}
      <style>{`
        @keyframes flameFlicker {
          0%   { transform: translateY(0) scale(1) rotate(-2deg); filter: blur(0px); opacity: .95; }
          20%  { transform: translateY(-1px) scale(1.04) rotate(2deg); filter: blur(.2px); opacity: 1; }
          40%  { transform: translateY(0) scale(.98) rotate(-1deg); filter: blur(.1px); opacity: .92; }
          60%  { transform: translateY(-2px) scale(1.06) rotate(1deg); filter: blur(.25px); opacity: 1; }
          80%  { transform: translateY(-1px) scale(1.02) rotate(-2deg); filter: blur(.15px); opacity: .96; }
          100% { transform: translateY(0) scale(1) rotate(1deg); filter: blur(0px); opacity: .95; }
        }
        .flame {
          position: relative;
          width: 18px;
          height: 18px;
          display: inline-block;
        }
        .flame::before,
        .flame::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: radial-gradient(circle at 35% 35%, rgba(255,255,255,.9), rgba(244,63,94,.85) 35%, rgba(217,70,239,.75) 70%, rgba(0,0,0,0) 75%);
          transform-origin: 50% 70%;
          animation: flameFlicker 1.2s infinite ease-in-out;
        }
        .flame::after {
          inset: 2px;
          background: radial-gradient(circle at 40% 35%, rgba(255,255,255,.95), rgba(244,63,94,.7) 40%, rgba(217,70,239,.55) 75%, rgba(0,0,0,0) 80%);
          animation-duration: 1.5s;
          mix-blend-mode: screen;
          opacity: .9;
        }
      `}</style>

      {/* Brand bar (matches app vibe) */}
      <header className="border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-sm" />
            <span className="font-semibold tracking-tight">Save Game</span>
          </a>

          <nav className="flex items-center gap-4 text-sm">
            <a className="text-slate-300 hover:text-white hidden sm:inline" href="#how">
              How it works
            </a>
            <a className="text-slate-300 hover:text-white hidden sm:inline" href="#pricing">
              Pricing
            </a>
            <a className="text-slate-300 hover:text-white hidden sm:inline" href="#faq">
              FAQ
            </a>

            {!loading && (
              signedIn ? (
                <a className="underline underline-offset-4" href="/today">
                  Go to Today
                </a>
              ) : (
                <a className="underline underline-offset-4" href="/login">
                  Sign in
                </a>
              )
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 sm:pt-14 pb-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 w-fit">
              <span className="flame" aria-hidden="true" />
              Streaks without guilt. Private by default.
            </p>

            <h1 className="text-4xl sm:text-5xl leading-tight font-bold tracking-tight">
              Your gaming life, <span className="text-fuchsia-400">remembered</span>.
            </h1>

            <p className="text-base sm:text-lg text-slate-300">
              Save Game is a tiny daily journal for gamers. Log what you played, how it felt,
              and what mattered — even if today’s “session” was just thinking about playing
              while staring at your backlog.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {!loading && (
                signedIn ? (
                  <a
                    href="/today"
                    className="inline-flex items-center justify-center rounded-xl bg-fuchsia-600 px-5 py-3 font-medium text-white hover:bg-fuchsia-500"
                  >
                    Go to Today
                  </a>
                ) : (
                  <a
                    href="/login"
                    className="inline-flex items-center justify-center rounded-xl bg-fuchsia-600 px-5 py-3 font-medium text-white hover:bg-fuchsia-500"
                  >
                    Start saving for free
                  </a>
                )
              )}

              <a
                href="#how"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white hover:bg-white/10"
              >
                See how it works
              </a>

              <a
                href="/today"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-transparent px-5 py-3 font-medium text-slate-200 hover:bg-white/5 sm:hidden"
              >
                Open the app
              </a>
            </div>

            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-fuchsia-300">•</span> No social feed. No performance pressure.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-fuchsia-300">•</span> “Didn’t play today” still counts.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-fuchsia-300">•</span> History + stats to spot patterns later.
              </li>
            </ul>
          </div>

          {/* Hero mock */}
          <div className="lg:justify-self-end">
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-5 sm:p-6 shadow-sm">
              <div className="absolute -top-3 left-6 rounded-full border border-white/10 bg-black px-3 py-1 text-xs text-slate-300 flex items-center gap-2">
                <span className="flame" aria-hidden="true" />
                Today
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">
                    <span className="inline-flex items-center gap-2">
                      <span className="flame" aria-hidden="true" />
                      Streak: <strong className="text-white">7</strong>
                    </span>
                  </span>
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
                    <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300 border border-white/10">
                      PC
                    </span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300 border border-white/10">
                      Mood: 😄
                    </span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300 border border-white/10">
                      Notes
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-300">
                    “Finally beat that boss. Felt unfair. Felt great. Both can be true.”
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    One entry a day keeps the streak alive.
                  </span>
                  <span className="text-xs text-fuchsia-300">Game saved. Streak safe.</span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              (Yes, it’s a journal app. For gamers. You’re allowed one soft hobby.)
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
          <p className="mt-2 text-slate-300">
            Save Game is built for consistency, not perfection. Log the day, protect the streak,
            and look back when you’re curious.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-sm text-slate-300">1) Log the day</p>
              <p className="mt-2 text-slate-200">
                Pick a platform, add mood, and drop a quick note. Done.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-sm text-slate-300">2) Keep the streak alive</p>
              <p className="mt-2 text-slate-200">
                Didn’t play? Log it anyway. The habit is the point.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-sm text-slate-300">3) Review later</p>
              <p className="mt-2 text-slate-200">
                History filters and stats help you spot patterns across time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Pricing</h2>
            <p className="mt-2 text-slate-300">
              Start free. Upgrade when you want deeper tracking and streak protection.
            </p>
          </div>
          <p className="hidden sm:block text-sm text-slate-400">
            (Payments can come later — the structure’s here.)
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Free</h3>
              <span className="text-sm text-slate-300">£0</span>
            </div>
            <p className="mt-2 text-slate-300">Everything you need to build the habit.</p>

            <ul className="mt-4 space-y-2">
              <Check>Daily entries</Check>
              <Check>Emoji moods</Check>
              <Check>“Didn’t play today” still counts</Check>
              <Check>History (last 30 days)</Check>
              <Check>One platform per day</Check>
            </ul>

            <div className="mt-6">
              {!loading && !signedIn ? (
                <a
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-white/10 px-5 py-3 font-medium text-white hover:bg-white/15"
                >
                  Start free
                </a>
              ) : (
                <a
                  href="/today"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-white/10 px-5 py-3 font-medium text-white hover:bg-white/15"
                >
                  Open app
                </a>
              )}
            </div>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-b from-fuchsia-500/10 to-white/[0.02] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Pro</h3>
              <span className="text-sm text-slate-200">£3/mo (idea)</span>
            </div>
            <p className="mt-2 text-slate-200">
              For multi-platform folks and anyone who’d rather not lose a streak.
            </p>

            <ul className="mt-4 space-y-2">
              <Check>Multi-platform entries</Check>
              <Check>All-time history</Check>
              <Check>Streak Freeze protection</Check>
              <Check>Deeper stats (next)</Check>
              <Check>Export (later)</Check>
            </ul>

            <div className="mt-6">
              <a
                href="/#pricing"
                className="inline-flex w-full items-center justify-center rounded-xl bg-fuchsia-600 px-5 py-3 font-medium text-white hover:bg-fuchsia-500"
              >
                Upgrade (coming soon)
              </a>
              <p className="mt-2 text-xs text-slate-300">
                For now, Pro is “soft launched” — we’ll wire Stripe when you’re ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight">FAQ</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="font-semibold">Do I have to play every day?</p>
              <p className="mt-2 text-slate-300">
                Nope. Log anything. A rest day can still be a “save.”
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="font-semibold">Is this public?</p>
              <p className="mt-2 text-slate-300">
                No. It’s a personal journal. No feed. No followers.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="font-semibold">Will there be a mobile app?</p>
              <p className="mt-2 text-slate-300">
                That’s the plan once the web version is nailed.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="font-semibold">What’s the point of streaks?</p>
              <p className="mt-2 text-slate-300">
                They’re a nudge to reflect. Not a punishment system.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-sm text-slate-500 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Save Game</p>
          <p className="text-slate-500">
            Built to remember the good bits.
          </p>
        </div>
      </footer>
    </main>
  );
}

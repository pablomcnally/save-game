"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import MobileNav from "@/components/MobileNav";

type Entry = {
  entry_date: string;
  platforms: string[];
  mood: number;
  minutes_played: number | null;
};

function isoFromDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function StatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }

      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("plan, streak_count, longest_streak")
        .eq("id", data.user.id)
        .single();

      const p = (prof?.plan ?? "free") === "pro" ? "pro" : "free";
      setPlan(p);

      if (!pErr && prof) {
        setStreak(prof.streak_count ?? 0);
        setBest(prof.longest_streak ?? 0);
      }

      const fromISO = p === "pro" ? isoFromDaysAgo(36500) : isoFromDaysAgo(29);

      const { data: rows, error } = await supabase
        .from("entries")
        .select("entry_date, platforms, mood, minutes_played")
        .gte("entry_date", fromISO)
        .order("entry_date", { ascending: false });

      if (!error) setEntries((rows as Entry[]) ?? []);
      setLoading(false);
    })();
  }, [router]);

  const computed = useMemo(() => {
    const total = entries.length;

    const moodVals = entries.map((e) => e.mood).filter((m) => typeof m === "number");
    const moodAvg = moodVals.length ? moodVals.reduce((a, b) => a + b, 0) / moodVals.length : 0;

    const mins = entries
      .map((e) => e.minutes_played)
      .filter((m): m is number => typeof m === "number" && !Number.isNaN(m));
    const minsTotal = mins.reduce((a, b) => a + b, 0);
    const minsAvg = mins.length ? minsTotal / mins.length : 0;

    const counts = new Map<string, number>();
    for (const e of entries) {
      for (const p of e.platforms ?? []) {
        counts.set(p, (counts.get(p) ?? 0) + 1);
      }
    }
    let topPlatform: string | null = null;
    let topCount = 0;
    for (const [p, c] of counts.entries()) {
      if (c > topCount) {
        topPlatform = p;
        topCount = c;
      }
    }

    return {
      total,
      moodAvg,
      minsTotal,
      minsAvg,
      topPlatform,
      topCount,
    };
  }, [entries]);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6 space-y-4 pb-24 sm:pb-6">
<header className="flex items-start justify-between gap-4">
  <div>
    <h1 className="text-3xl font-bold">Stats</h1>
    <p className="text-slate-600">
      {plan === "free" ? "Based on your last 30 days (Free)." : "Based on all entries (Pro)."}
    </p>
  </div>

  {/* Desktop-only nav */}
  <nav className="hidden sm:flex gap-4 text-sm pt-1">
    <a className="underline" href="/today">Today</a>
    <a className="underline" href="/history">History</a>
  </nav>
</header>


      {loading ? (
        <p className="text-sm text-slate-600">Loading…</p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-slate-600">🔥 Current streak</p>
              <p className="text-3xl font-bold">{streak}</p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-slate-600">🏆 Best streak</p>
              <p className="text-3xl font-bold">{best}</p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-slate-600">🗓️ Entries</p>
              <p className="text-3xl font-bold">{computed.total}</p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-slate-600">🙂 Average mood</p>
              <p className="text-3xl font-bold">{computed.moodAvg ? computed.moodAvg.toFixed(1) : "—"}</p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-slate-600">⏱️ Total minutes</p>
              <p className="text-3xl font-bold">{computed.minsTotal ? Math.round(computed.minsTotal) : "—"}</p>
              {computed.minsTotal ? (
                <p className="text-sm text-slate-500 mt-1">
                  Avg logged session: {Math.round(computed.minsAvg)}m
                </p>
              ) : null}
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-slate-600">🎮 Top platform</p>
              <p className="text-3xl font-bold">{computed.topPlatform ? computed.topPlatform : "—"}</p>
              {computed.topPlatform && (
                <p className="text-sm text-slate-500 mt-1">
                  {computed.topCount} day{computed.topCount === 1 ? "" : "s"} logged
                </p>
              )}
            </div>
          </section>

          {plan === "free" && (
            <div className="border rounded-lg p-4 text-sm">
              Pro unlocks all-time stats, deeper trends, and comparisons across platforms.{" "}
              <a className="underline" href="/#pricing">
                See Pro
              </a>
            </div>
          )}
        </>
      )}

      <MobileNav />
    </main>
  );
}

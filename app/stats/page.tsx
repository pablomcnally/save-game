"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PageShell from "@/components/PageShell";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent } from "@/components/ui/Card";

type Entry = {
  entry_date: string;
  platforms: string[];
  mood: number;
  minutes_played: number | null;
};

function moodEmoji(mood: number) {
  return ["😞", "😐", "🙂", "😄", "🤩"][mood - 1] ?? "🙂";
}

function isoFromDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-slate-300">{label}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
        {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function StatsPage() {
  const router = useRouter();

  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("plan, streak_count, longest_streak")
        .eq("id", data.user.id)
        .single();

      const p = (prof?.plan ?? "free") === "pro" ? "pro" : "free";
      setPlan(p);
      setStreak(prof?.streak_count ?? 0);
      setBest(prof?.longest_streak ?? 0);

      const fromISO = p === "pro" ? isoFromDaysAgo(36500) : isoFromDaysAgo(29);

      const { data: rows } = await supabase
        .from("entries")
        .select("entry_date, platforms, mood, minutes_played")
        .gte("entry_date", fromISO);

      setEntries((rows as Entry[]) ?? []);
    })();
  }, [router]);

  const computed = useMemo(() => {
    const total = entries.length;

    const moodAvg =
      total > 0
        ? entries.reduce((a, b) => a + b.mood, 0) / total
        : null;

    const minutes = entries
      .map((e) => e.minutes_played)
      .filter((m): m is number => typeof m === "number");

    const minutesTotal = minutes.reduce((a, b) => a + b, 0);

    const platformCounts = new Map<string, number>();
    entries.forEach((e) =>
      e.platforms.forEach((p) =>
        platformCounts.set(p, (platformCounts.get(p) ?? 0) + 1)
      )
    );

    let topPlatform: string | null = null;
    let topCount = 0;
    for (const [p, c] of platformCounts.entries()) {
      if (c > topCount) {
        topPlatform = p;
        topCount = c;
      }
    }

    return { total, moodAvg, minutesTotal, topPlatform, topCount };
  }, [entries]);

  return (
    <PageShell
      title="Stats"
      subtitle="All entries."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="🔥 Current streak" value={streak} />
        <Stat label="🏆 Best streak" value={best} />
        <Stat label="🗓️ Entries" value={computed.total} />
        <Stat
          label="🙂 Average mood"
          value={
            computed.moodAvg
              ? `${moodEmoji(Math.round(computed.moodAvg))} ${computed.moodAvg.toFixed(1)}`
              : "—"
          }
        />
        <Stat
          label="⏱️ Total minutes"
          value={computed.minutesTotal || "—"}
        />
        <Stat
          label="🎮 Top platform"
          value={computed.topPlatform ?? "—"}
          sub={
            computed.topPlatform
              ? `${computed.topCount} day${computed.topCount === 1 ? "" : "s"}`
              : undefined
          }
        />
      </div>

      <MobileNav />
    </PageShell>
  );
}

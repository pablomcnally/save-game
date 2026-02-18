"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import MobileNav from "@/components/MobileNav";

const PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile", "Retro", "Cloud", "Other"];
const MOODS = [
  { value: 1, label: "😞 Rough" },
  { value: 2, label: "😐 Meh" },
  { value: 3, label: "🙂 Fine" },
  { value: 4, label: "😄 Good" },
  { value: 5, label: "🤩 Great" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function diffDays(aISO: string, bISO: string) {
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  return Math.round((+b - +a) / (1000 * 60 * 60 * 24));
}

export default function TodayPage() {
  const router = useRouter();
  const entryDate = useMemo(() => todayISO(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");

  const [streakCount, setStreakCount] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastSavedDate, setLastSavedDate] = useState<string | null>(null);

  const [freezeCredits, setFreezeCredits] = useState(0);
  const [freezeTease, setFreezeTease] = useState<string | null>(null);

  const [gameName, setGameName] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [minutes, setMinutes] = useState<number | "">("");
  const [mood, setMood] = useState(3);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }

      setUserId(data.user.id);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      if (prof) {
        const p = (prof.plan ?? "free") === "pro" ? "pro" : "free";
        setPlan(p);
        setStreakCount(prof.streak_count ?? 0);
        setLongestStreak(prof.longest_streak ?? 0);
        setLastSavedDate(prof.last_saved_date ?? null);
        setFreezeCredits(prof.freeze_credits ?? 0);

        if (prof.last_saved_date) {
          const d = diffDays(prof.last_saved_date, entryDate);
          if (d === 2 && p === "free") {
            setFreezeTease("Missed yesterday? Pro can protect your streak with a Streak Freeze.");
          }
        }
      }

      const { data: e } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", data.user.id)
        .eq("entry_date", entryDate)
        .maybeSingle();

      if (e) {
        setGameName(e.game_name ?? "");
        setPlatforms(e.platforms ?? []);
        setMinutes(e.minutes_played ?? "");
        setMood(e.mood ?? 3);
        setNotes(e.notes ?? "");
      }
    })();
  }, [router, entryDate]);

  function togglePlatform(p: string) {
    if (plan === "free") {
      setPlatforms([p]);
    } else {
      setPlatforms((prev) =>
        prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
      );
    }
  }

  async function saveEntry(payloadOverrides?: Partial<any>) {
    if (!userId || saving) return;
    setSaving(true);
    setStatus(null);

    const payload = {
      user_id: userId,
      entry_date: entryDate,
      game_name: gameName || null,
      mood,
      notes: notes || null,
      minutes_played: minutes === "" ? null : minutes,
      platforms,
      ...payloadOverrides,
    };

    const { error } = await supabase
      .from("entries")
      .upsert(payload, { onConflict: "user_id,entry_date" });

    if (error) {
      setSaving(false);
      setStatus(error.message);
      return;
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const last = prof.last_saved_date as string | null;
    let streak = prof.streak_count ?? 0;
    let longest = prof.longest_streak ?? 0;

    if (!last) streak = 1;
    else {
      const d = diffDays(last, entryDate);
      if (d === 1 || d === 0) streak += d === 1 ? 1 : 0;
      else if (d === 2 && plan === "pro" && prof.freeze_credits > 0) {
        streak += 1;
        await supabase.from("profiles").update({
          freeze_credits: prof.freeze_credits - 1,
          freezes_used: (prof.freezes_used ?? 0) + 1,
          last_freeze_date: entryDate,
        }).eq("id", userId);
      } else streak = 1;
    }

    longest = Math.max(longest, streak);

    await supabase.from("profiles").update({
      last_saved_date: entryDate,
      streak_count: streak,
      longest_streak: longest,
    }).eq("id", userId);

    setStreakCount(streak);
    setLongestStreak(longest);
    setLastSavedDate(entryDate);
    setStatus("Saved. Streak safe.");
    setSaving(false);
  }

  function didntPlayToday() {
    saveEntry({
      game_name: null,
      platforms: ["None"],
      minutes_played: 0,
      notes: "Didn’t play today",
    });
  }

  const canSave = platforms.length > 0 && !saving;

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6 space-y-4 pb-44">
    <header className="flex items-start justify-between gap-4">
  <div>
    <h1 className="text-3xl font-bold">Today</h1>

    <div className="mt-2 text-sm text-slate-600 flex gap-4 flex-wrap">
      <span>🔥 <strong>{streakCount}</strong></span>
      <span>🏆 <strong>{longestStreak}</strong></span>
      {plan === "pro" && <span>🧊 <strong>{freezeCredits}</strong></span>}
    </div>
  </div>

  {/* Desktop-only nav */}
  <nav className="hidden sm:flex gap-4 text-sm pt-1">
    <a className="underline" href="/history">History</a>
    <a className="underline" href="/stats">Stats</a>
  </nav>
</header>


      {freezeTease && (
        <div className="border border-fuchsia-500/30 bg-fuchsia-500/10 p-3 rounded">
          {freezeTease}
        </div>
      )}

      <section className="border rounded-lg p-4 space-y-4">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="What did you play?"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              className={`px-4 py-2 rounded-full border ${
                platforms.includes(p) ? "bg-slate-900 text-white" : ""
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`border rounded py-2 ${
                mood === m.value ? "bg-fuchsia-600 text-white" : ""
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <textarea
          className="w-full border rounded px-3 py-2"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={() => saveEntry()}
            disabled={!canSave}
            className="flex-1 bg-fuchsia-600 text-white rounded py-2"
          >
            Save Game
          </button>

          <button
            onClick={didntPlayToday}
            className="border rounded py-2 px-3 text-sm"
          >
            Didn’t play today
          </button>
        </div>

        {status && <p className="text-sm text-slate-600">{status}</p>}
      </section>

      <MobileNav />
    </main>
  );
}

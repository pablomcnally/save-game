"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile", "Retro", "Cloud", "Other"];

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function TodayPage() {
  const router = useRouter();
  const entryDate = useMemo(() => todayISO(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");

  const [gameName, setGameName] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [minutes, setMinutes] = useState<number | "">("");
  const [mood, setMood] = useState(3);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserId(data.user.id);

      // Ensure profile exists
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!prof) {
        await supabase.from("profiles").insert({ id: data.user.id });
        setPlan("free");
      } else {
        setPlan((prof.plan ?? "free") === "pro" ? "pro" : "free");
      }

      // Load today's entry (if any)
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
      setPlatforms([p]); // free: 1 per day
      return;
    }
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function save() {
    if (!userId) return;
    setStatus(null);

    if (platforms.length === 0) {
      setStatus("Pick a platform (free: one per day, pro: multiple).");
      return;
    }

    const payload = {
      user_id: userId,
      entry_date: entryDate,
      game_name: gameName || null,
      mood,
      notes: notes || null,
      minutes_played: minutes === "" ? null : minutes,
      platforms,
    };

    const { error } = await supabase
      .from("entries")
      .upsert(payload, { onConflict: "user_id,entry_date" });

    if (error) {
      setStatus(error.message);
      return;
    }

    // Update streak (simple MVP: free rules)
    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (pErr) {
      setStatus("Saved entry, but couldn't update streak.");
      return;
    }

    const last = prof.last_saved_date as string | null;
    const today = entryDate;

    let streak = prof.streak_count as number;
    let longest = prof.longest_streak as number;

    if (!last) {
      streak = 1;
    } else {
      const lastDate = new Date(last + "T00:00:00");
      const todayDate = new Date(today + "T00:00:00");
      const diffDays = Math.round((+todayDate - +lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // already saved today, keep streak
      } else if (diffDays === 1) {
        streak += 1;
      } else {
        streak = 1; // missed days
      }
    }

    longest = Math.max(longest, streak);

    await supabase
      .from("profiles")
      .update({
        last_saved_date: today,
        streak_count: streak,
        longest_streak: longest,
      })
      .eq("id", userId);

    setStatus("Game saved. Streak safe.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Today</h1>
          <p className="text-slate-600">Save your day in under a minute.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <a className="underline" href="/history">History</a>
          <button className="underline" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <section className="border rounded-lg p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-sm">Game (optional)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="What did you play? (optional)"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Platform{plan === "pro" ? " (multi-select)" : ""}</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const selected = platforms.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  className={`border rounded px-3 py-2 text-sm ${selected ? "bg-slate-900 text-white" : ""}`}
                  onClick={() => togglePlatform(p)}
                >
                  {p}
                </button>
              );
            })}
          </div>
          {plan === "free" && (
            <p className="text-xs text-slate-500">Free: one platform per day. Pro unlocks multiple.</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm">Time played (minutes, optional)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 90"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Mood (1–5)</label>
          <input
            className="w-full"
            type="range"
            min={1}
            max={5}
            value={mood}
            onChange={(e) => setMood(Number(e.target.value))}
          />
          <p className="text-sm text-slate-600">Mood: {mood}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm">Notes (optional)</label>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-32"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything you want to remember…"
          />
        </div>

        <button className="border rounded px-4 py-2" onClick={save}>
          Save Game
        </button>

        {status && <p className="text-sm text-slate-600">{status}</p>}
      </section>
    </main>
  );
}

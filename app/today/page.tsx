"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile", "Retro", "Cloud", "Other"];

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
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

  // Streak display
  const [streakCount, setStreakCount] = useState<number>(0);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [lastSavedDate, setLastSavedDate] = useState<string | null>(null);

  // Freeze (Pro)
  const [freezeCredits, setFreezeCredits] = useState<number>(0);
  const [freezeTease, setFreezeTease] = useState<string | null>(null);

  // Entry fields
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

      if (!prof) {
        await supabase.from("profiles").insert({ id: data.user.id });
        setPlan("free");
        setStreakCount(0);
        setLongestStreak(0);
        setLastSavedDate(null);
        setFreezeCredits(0);
        setFreezeTease(null);
      } else {
        const p = (prof.plan ?? "free") === "pro" ? "pro" : "free";
        setPlan(p);

        setStreakCount(prof.streak_count ?? 0);
        setLongestStreak(prof.longest_streak ?? 0);
        setLastSavedDate(prof.last_saved_date ?? null);

        setFreezeCredits(prof.freeze_credits ?? 0);

        const last = prof.last_saved_date as string | null;
        if (last) {
          const d = diffDays(last, entryDate);
          if (d === 2 && p === "free") {
            setFreezeTease("Missed yesterday? Pro can protect your streak with a Streak Freeze.");
          } else {
            setFreezeTease(null);
          }
        } else {
          setFreezeTease(null);
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
      return;
    }
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function save() {
    if (!userId || saving) return;
    setStatus(null);

    if (platforms.length === 0) {
      setStatus("Pick a platform (free: one per day, pro: multiple).");
      return;
    }

    setSaving(true);

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
      setSaving(false);
      setStatus(error.message);
      return;
    }

    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (pErr) {
      setSaving(false);
      setStatus("Saved entry, but couldn't update streak.");
      return;
    }

    const p = (prof.plan ?? "free") === "pro" ? "pro" : "free";
    const last = prof.last_saved_date as string | null;

    let streak = (prof.streak_count as number) ?? 0;
    let longest = (prof.longest_streak as number) ?? 0;

    let credits = (prof.freeze_credits as number) ?? 0;
    let freezesUsed = (prof.freezes_used as number) ?? 0;
    const lastFreezeDate = (prof.last_freeze_date as string | null) ?? null;

    let usedFreezeNow = false;

    if (!last) {
      streak = 1;
    } else {
      const d = diffDays(last, entryDate);

      if (d === 0) {
        // already saved today
      } else if (d === 1) {
        streak += 1;
      } else if (d === 2) {
        if (p === "pro" && credits > 0 && lastFreezeDate !== entryDate) {
          streak += 1;
          credits -= 1;
          freezesUsed += 1;
          usedFreezeNow = true;
        } else {
          streak = 1;
        }
      } else {
        streak = 1;
      }
    }

    longest = Math.max(longest, streak);

    const updatePayload: any = {
      last_saved_date: entryDate,
      streak_count: streak,
      longest_streak: longest,
    };

    if (usedFreezeNow) {
      updatePayload.freeze_credits = credits;
      updatePayload.freezes_used = freezesUsed;
      updatePayload.last_freeze_date = entryDate;
    }

    await supabase.from("profiles").update(updatePayload).eq("id", userId);

    setPlan(p);
    setStreakCount(streak);
    setLongestStreak(longest);
    setLastSavedDate(entryDate);
    if (usedFreezeNow) setFreezeCredits(credits);

    setFreezeTease(null);

    setStatus(usedFreezeNow ? "Saved — streak protected with a Freeze." : "Game saved. Streak safe.");
    setSaving(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const canSave = platforms.length > 0 && !saving;

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 pb-28 sm:pb-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">Today</h1>
          <p className="text-slate-600">Save your day in under a minute.</p>

          <div className="mt-2 text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
            <span>
              🔥 Streak: <strong className="text-slate-200">{streakCount}</strong>
            </span>
            <span>
              🏆 Best: <strong className="text-slate-200">{longestStreak}</strong>
            </span>
            <span className="truncate">
              Last saved:{" "}
              <strong className="text-slate-200">{lastSavedDate ? lastSavedDate : "never"}</strong>
            </span>
            {plan === "pro" && (
              <span>
                🧊 Freezes: <strong className="text-slate-200">{freezeCredits}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3 text-sm pt-1 shrink-0">
          <a className="underline" href="/history">
            History
          </a>
          <a className="underline" href="/stats">
            Stats
          </a>
          <button className="underline" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      {freezeTease && (
        <div className="border border-fuchsia-500/30 bg-fuchsia-500/10 rounded-lg p-4 text-sm text-slate-200">
          {freezeTease}{" "}
          <a className="underline underline-offset-4 text-fuchsia-200" href="/#pricing">
            See Pro
          </a>
        </div>
      )}

      <section className="border rounded-lg p-4 sm:p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-sm">Game (optional)</label>
          <input
            className="w-full border rounded px-3 py-2 text-base"
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
                  className={`border rounded-full px-4 py-2 text-sm sm:text-sm min-h-11 ${
                    selected ? "bg-slate-900 text-white" : "bg-white/5"
                  }`}
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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm">Time played (minutes, optional)</label>
            <input
              className="w-full border rounded px-3 py-2 text-base"
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
        </div>

        <div className="space-y-2">
          <label className="text-sm">Notes (optional)</label>
          <textarea
            className="w-full border rounded px-3 py-2 text-base min-h-28 sm:min-h-32"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything you want to remember…"
          />
        </div>

        {/* Desktop save button */}
        <div className="hidden sm:block">
          <button
            className="border rounded px-4 py-2"
            onClick={save}
            disabled={!canSave}
            title={platforms.length === 0 ? "Pick a platform to save" : ""}
          >
            {saving ? "Saving…" : "Save Game"}
          </button>
        </div>

        {status && <p className="text-sm text-slate-600">{status}</p>}
      </section>

      {/* Mobile sticky action bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate">
              {platforms.length ? `Ready to save (${platforms.join(", ")})` : "Pick a platform to save"}
            </p>
            {status && <p className="text-xs text-slate-300 truncate">{status}</p>}
          </div>
          <button
            className="rounded-lg bg-fuchsia-600 px-4 py-3 font-medium text-white disabled:opacity-50"
            onClick={save}
            disabled={!canSave}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </main>
  );
}

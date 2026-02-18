"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import MobileNav from "@/components/MobileNav";
import PageShell from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/Card";

const PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile", "Retro", "Cloud", "Other"];
const MOODS = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😐", label: "Meh" },
  { value: 3, emoji: "🙂", label: "Fine" },
  { value: 4, emoji: "😄", label: "Good" },
  { value: 5, emoji: "🤩", label: "Great" },
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
          } else {
            setFreezeTease(null);
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
      return;
    }
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function saveEntry(overrides?: Partial<any>) {
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
      ...overrides,
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

    let credits = prof.freeze_credits ?? 0;
    let freezesUsed = prof.freezes_used ?? 0;
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
        if (plan === "pro" && credits > 0 && lastFreezeDate !== entryDate) {
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

    setStreakCount(streak);
    setLongestStreak(longest);
    setLastSavedDate(entryDate);
    if (usedFreezeNow) setFreezeCredits(credits);

    setFreezeTease(null);
    setStatus(usedFreezeNow ? "Saved — streak protected with a Freeze." : "Saved. Streak safe.");
    setSaving(false);
  }

  function didntPlayToday() {
    // keep it predictable + filterable
    saveEntry({
      game_name: null,
      platforms: ["None"],
      minutes_played: 0,
      notes: "Didn’t play today",
      mood,
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const canSave = platforms.length > 0 && !saving;
  const moodObj = MOODS.find((m) => m.value === mood);

  return (
    <PageShell
      title="Today"
      subtitle="Save your day in under a minute."
      right={
        <div className="flex items-center gap-4 text-sm">
          <a className="underline underline-offset-4" href="/history">
            History
          </a>
          <a className="underline underline-offset-4" href="/stats">
            Stats
          </a>
          <button className="underline underline-offset-4 text-slate-300 hover:text-white" onClick={signOut}>
            Sign out
          </button>
        </div>
      }
    >
      {/* Streak strip */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="text-slate-300">
              🔥 Streak: <strong className="text-white">{streakCount}</strong>
            </span>
            <span className="text-slate-300">
              🏆 Best: <strong className="text-white">{longestStreak}</strong>
            </span>
            <span className="text-slate-300">
              Last saved: <strong className="text-white">{lastSavedDate ?? "never"}</strong>
            </span>
            {plan === "pro" ? (
              <span className="text-slate-300">
                🧊 Freezes: <strong className="text-white">{freezeCredits}</strong>
              </span>
            ) : (
              <span className="text-slate-400">
                Pro: multi-platform + streak freeze
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {freezeTease && (
        <div className="mt-3 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-5 text-sm text-slate-200">
          {freezeTease}{" "}
          <a className="underline underline-offset-4 text-fuchsia-200" href="/#pricing">
            See Pro
          </a>
        </div>
      )}

      {/* Main form */}
      <Card className="mt-3">
        <CardContent className="pt-5 space-y-5">
          {/* Game */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Game (optional)</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-base outline-none focus:border-fuchsia-500/60"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="What did you play?"
            />
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label className="text-sm text-slate-300">
                Platform{plan === "pro" ? " (multi-select)" : ""}
              </label>
              {plan === "free" ? (
                <span className="text-xs text-slate-400">Free: one per day</span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const selected = platforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={[
                      "rounded-full border px-4 py-2 text-sm min-h-11",
                      "border-white/10 bg-white/5 hover:bg-white/10",
                      selected ? "bg-white/15 text-white border-fuchsia-500/40" : "text-slate-200",
                    ].join(" ")}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label className="text-sm text-slate-300">Mood</label>
              <span className="text-xs text-slate-400">
                {moodObj ? `${moodObj.emoji} ${moodObj.label}` : `Mood: ${mood}`}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((m) => {
                const active = mood === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={[
                      "rounded-xl border px-2 py-3 text-center",
                      "border-white/10 bg-black/40 hover:bg-white/10",
                      active ? "bg-fuchsia-600/25 border-fuchsia-500/60" : "",
                    ].join(" ")}
                    title={m.label}
                  >
                    <div className="text-xl leading-none">{m.emoji}</div>
                    <div className="mt-1 text-[11px] text-slate-300">{m.value}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minutes + Notes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Time played (minutes)</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-base outline-none focus:border-fuchsia-500/60"
                type="number"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 90"
              />
              <p className="text-xs text-slate-400">Optional. Leave blank if you can’t be bothered.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Notes</label>
              <textarea
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-base min-h-24 outline-none focus:border-fuchsia-500/60"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you want to remember…"
              />
            </div>
          </div>

          {/* Actions (desktop) */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              className="rounded-xl bg-fuchsia-600 px-5 py-3 font-medium text-white hover:bg-fuchsia-500 disabled:opacity-50"
              onClick={() => saveEntry()}
              disabled={!canSave}
              title={platforms.length === 0 ? "Pick a platform to save" : ""}
            >
              {saving ? "Saving…" : "Save Game"}
            </button>

            <button
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
              onClick={didntPlayToday}
              disabled={saving}
              title="Logs a rest day and keeps the streak alive."
            >
              Didn’t play today
            </button>

            {status ? <span className="text-sm text-slate-300">{status}</span> : null}
          </div>

          {/* Status (mobile in-card) */}
          {status ? <p className="sm:hidden text-sm text-slate-300">{status}</p> : null}
        </CardContent>
      </Card>

      {/* Mobile bottom nav + save bar stack */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="border-t border-white/10 bg-black/90 backdrop-blur">
          <MobileNav />
        </div>

        <div className="border-t border-white/10 bg-black/90 backdrop-blur">
          <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 truncate">
                {platforms.length ? `Ready to save (${platforms.join(", ")})` : "Pick a platform to save"}
              </p>
              {status ? <p className="text-xs text-slate-200 truncate">{status}</p> : null}
            </div>

            <button
              className="rounded-xl bg-fuchsia-600 px-4 py-3 font-medium text-white disabled:opacity-50"
              onClick={() => saveEntry()}
              disabled={!canSave}
            >
              {saving ? "Saving…" : "Save"}
            </button>

            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200"
              onClick={didntPlayToday}
              disabled={saving}
              title="Rest day"
            >
              💤
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PageShell from "@/components/PageShell";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent } from "@/components/ui/Card";

type Entry = {
  id: string;
  entry_date: string; // YYYY-MM-DD
  game_name: string | null;
  platforms: string[];
  mood: number;
  minutes_played: number | null;
  notes: string | null;
};

const PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile", "Retro", "Cloud", "Other"];

function moodEmoji(mood: number) {
  return ["😞", "😐", "🙂", "😄", "🤩"][mood - 1] ?? "🙂";
}

function isDidntPlay(e: Entry) {
  return (
    (e.platforms ?? []).length === 1 &&
    e.platforms[0] === "None" &&
    (e.minutes_played ?? null) === 0 &&
    (e.game_name ?? null) === null
  );
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addMonths(d: Date, delta: number) {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + delta);
  return copy;
}

function monthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function isFuture(dateISO: string) {
  return dateISO > ymd(new Date());
}

export default function HistoryPage() {
  const router = useRouter();

  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const [platformFilter, setPlatformFilter] = useState("All");
  const [moodFilter, setMoodFilter] = useState("All");

  // Calendar controls
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Earliest date fetched (used to disable out-of-range days on Free)
  const [earliestDate, setEarliestDate] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", data.user.id)
        .single();

      const p = (prof?.plan ?? "free") === "pro" ? "pro" : "free";
      setPlan(p);

      const from = new Date();
      if (p === "free") from.setDate(from.getDate() - 29);
      else from.setFullYear(from.getFullYear() - 50);

      const iso = ymd(from);
      setEarliestDate(iso);

      const { data: rows, error } = await supabase
        .from("entries")
        .select("id, entry_date, game_name, platforms, mood, minutes_played, notes")
        .gte("entry_date", iso)
        .order("entry_date", { ascending: false });

      if (!error) setEntries((rows as Entry[]) ?? []);
      setLoading(false);
    })();
  }, [router]);

  const entryByDate = useMemo(() => {
    const m = new Map<string, Entry>();
    for (const e of entries) m.set(e.entry_date, e);
    return m;
  }, [entries]);

  const monthDate = useMemo(() => addMonths(new Date(), monthOffset), [monthOffset]);

  const calendar = useMemo(() => {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const daysInMonth = last.getDate();

    // Monday-start index
    const jsDay = first.getDay(); // 0 Sun..6 Sat
    const mondayStartIndex = (jsDay + 6) % 7;

    const cells: Array<{ date: string | null; dayNum?: number }> = [];

    for (let i = 0; i < mondayStartIndex; i++) cells.push({ date: null });

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
      cells.push({ date: ymd(dt), dayNum: d });
    }

    while (cells.length % 7 !== 0) cells.push({ date: null });

    return cells;
  }, [monthDate]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const dayOk = selectedDate ? e.entry_date === selectedDate : true;
      const platformOk = platformFilter === "All" ? true : (e.platforms ?? []).includes(platformFilter);
      const moodOk = moodFilter === "All" ? true : e.mood === Number(moodFilter);
      return dayOk && platformOk && moodOk;
    });
  }, [entries, selectedDate, platformFilter, moodFilter]);

  const selectedEntry = useMemo(() => {
    if (!selectedDate) return null;
    return entryByDate.get(selectedDate) ?? null;
  }, [selectedDate, entryByDate]);

  function clearFilters() {
    setPlatformFilter("All");
    setMoodFilter("All");
    setSelectedDate(null);
  }

  function toggleDay(dateISO: string) {
    setSelectedDate((prev) => (prev === dateISO ? null : dateISO));
  }

  const today = ymd(new Date());

  return (
    <PageShell
      title="History"
      subtitle={plan === "free" ? "Your last 30 days." : "All entries."}
    >
      {/* Calendar + filters */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-slate-300">Calendar</p>
              <p className="text-xl font-semibold tracking-tight">{monthLabel(monthDate)}</p>
              {selectedDate ? (
                <p className="mt-1 text-xs text-slate-400">
                  Selected: <span className="text-slate-200">{selectedDate}</span>{" "}
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="ml-2 underline underline-offset-4 text-slate-300 hover:text-white"
                  >
                    clear
                  </button>
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                onClick={() => setMonthOffset((n) => n - 1)}
                aria-label="Previous month"
              >
                ←
              </button>

              <button
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                onClick={() => setMonthOffset(0)}
                aria-label="Current month"
              >
                Today
              </button>

              <button
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                onClick={() => setMonthOffset((n) => n + 1)}
                aria-label="Next month"
              >
                →
              </button>
            </div>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-2 text-xs text-slate-400">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendar.map((cell, idx) => {
              if (!cell.date) {
                return <div key={idx} className="h-10 rounded-xl border border-transparent" />;
              }

              const dateISO = cell.date;
              const e = entryByDate.get(dateISO);
              const hasEntry = !!e;
              const restDay = e ? isDidntPlay(e) : false;

              const isToday = dateISO === today;
              const isSelected = selectedDate === dateISO;

              const tooOld = earliestDate ? dateISO < earliestDate : false;
              const future = isFuture(dateISO);
              const disabled = future || (plan === "free" && tooOld);

              const tooltip = hasEntry
                ? restDay
                  ? "Rest day logged"
                  : e?.game_name
                    ? `Played: ${e.game_name}`
                    : "Entry logged"
                : disabled
                  ? future
                    ? "Future day"
                    : "Outside Free range"
                  : "No entry";

              return (
                <button
                  key={dateISO}
                  type="button"
                  onClick={() => !disabled && toggleDay(dateISO)}
                  disabled={disabled}
                  aria-label={`${dateISO}${hasEntry ? " has entry" : " no entry"}`}
                  className={[
                    "h-10 rounded-xl border text-sm flex items-center justify-center relative",
                    "transition duration-150",
                    disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-white/10",
                    hasEntry ? "bg-white/[0.06]" : "bg-black/30",
                    hasEntry ? "border-white/15" : "border-white/10",
                    restDay ? "border-slate-500/40" : "",
                    hasEntry && !restDay ? "border-fuchsia-500/40" : "",
                    isSelected ? "ring-2 ring-fuchsia-500/70" : "",
                    isToday && !isSelected ? "ring-1 ring-white/25" : "",
                  ].join(" ")}
                  title={tooltip}
                >
                  <span className={hasEntry ? "text-white" : "text-slate-400"}>{cell.dayNum}</span>

                  {/* top-right marker */}
                  {restDay ? (
                    <span className="absolute right-1 top-1 text-[11px] opacity-80">💤</span>
                  ) : null}

                  {hasEntry && !restDay ? (
                    <span className="absolute right-1 top-1 text-[11px] opacity-80">
                      {moodEmoji(e!.mood)}
                    </span>
                  ) : null}

                  {/* dot indicator for any entry */}
                  {hasEntry ? (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white/40" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded border border-fuchsia-500/40 bg-white/[0.06]" />
              Entry
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded border border-slate-500/40 bg-white/[0.06]" />
              Rest day 💤
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded border border-white/10 bg-black/30 opacity-40" />
              Disabled
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded ring-1 ring-white/25 border border-white/10 bg-black/30" />
              Today
            </span>
          </div>

          {/* Selected day preview card */}
          {selectedDate ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400">Selected day</p>
                  <p className="text-lg font-semibold text-white">{selectedDate}</p>
                </div>

                {selectedEntry ? (
                  <span className="text-xs text-slate-400">
                    {isDidntPlay(selectedEntry) ? "Rest day" : "Logged"}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">No entry</span>
                )}
              </div>

              {selectedEntry ? (
                <div className="mt-3 space-y-2 text-sm">
                  {isDidntPlay(selectedEntry) ? (
                    <p className="text-slate-300">
                      💤 <em className="text-slate-400">Didn’t play today</em>
                    </p>
                  ) : (
                    <>
                      <p className="text-slate-200">
                        {selectedEntry.game_name ? (
                          <>
                            <span className="text-slate-400">Game:</span>{" "}
                            <span className="text-white font-medium">{selectedEntry.game_name}</span>
                          </>
                        ) : (
                          <span className="text-slate-300">Saved day</span>
                        )}
                      </p>

                      <p className="text-slate-300">
                        <span className="text-slate-400">Platform:</span>{" "}
                        {(selectedEntry.platforms ?? []).join(", ")}{" "}
                        <span className="mx-2 text-slate-600">·</span>
                        <span className="text-slate-400">Mood:</span>{" "}
                        {moodEmoji(selectedEntry.mood)}
                        {selectedEntry.minutes_played != null ? (
                          <>
                            <span className="mx-2 text-slate-600">·</span>
                            <span className="text-slate-400">Time:</span>{" "}
                            {selectedEntry.minutes_played}m
                          </>
                        ) : null}
                      </p>
                    </>
                  )}

                  {selectedEntry.notes ? (
                    <p className={`pt-1 ${isDidntPlay(selectedEntry) ? "italic text-slate-400" : "text-slate-200"}`}>
                      {selectedEntry.notes}
                    </p>
                  ) : (
                    <p className="text-slate-500">No notes.</p>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-sm text-slate-400">
                  No entry logged for this day.
                </div>
              )}
            </div>
          ) : null}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <select
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              <option value="All">All platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value)}
            >
              <option value="All">All moods</option>
              <option value="1">😞</option>
              <option value="2">😐</option>
              <option value="3">🙂</option>
              <option value="4">😄</option>
              <option value="5">🤩</option>
            </select>

            <button
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>

          <div className="text-sm text-slate-300">
            {selectedDate ? (
              <>
                Day: <strong className="text-white">{selectedDate}</strong> ·{" "}
              </>
            ) : null}
            Results: <strong className="text-white">{filtered.length}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Entries list */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-300">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
            No entries match those filters.
          </div>
        ) : (
          filtered.map((e) => {
            const restDay = isDidntPlay(e);

            return (
              <div key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex justify-between gap-4">
                  <strong className="text-white">
                    {restDay ? "Didn’t play today" : e.game_name ?? "Saved day"}
                  </strong>
                  <span className="text-sm text-slate-400">{e.entry_date}</span>
                </div>

                <div className="mt-1 text-sm text-slate-300">
                  {restDay ? (
                    <em className="text-slate-400">Still counted. Streak stays alive.</em>
                  ) : (
                    <>
                      {(e.platforms ?? []).join(", ")} · mood {moodEmoji(e.mood)}
                      {e.minutes_played != null ? ` · ${e.minutes_played}m` : ""}
                    </>
                  )}
                </div>

                {e.notes ? (
                  <p className={`mt-2 text-sm ${restDay ? "italic text-slate-400" : "text-slate-200"}`}>
                    {e.notes}
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <MobileNav />
    </PageShell>
  );
}
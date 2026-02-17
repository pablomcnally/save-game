"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Entry = {
  id: string;
  entry_date: string;
  game_name: string | null;
  platforms: string[];
  mood: number;
  minutes_played: number | null;
  notes: string | null;
};

const PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile", "Retro", "Cloud", "Other"];

export default function HistoryPage() {
  const router = useRouter();

  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [moodFilter, setMoodFilter] = useState<string>("All");

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }

      const { data: prof } = await supabase.from("profiles").select("plan").eq("id", data.user.id).single();
      const p = (prof?.plan ?? "free") === "pro" ? "pro" : "free";
      setPlan(p);

      const fromDate = new Date();
      if (p === "free") fromDate.setDate(fromDate.getDate() - 29);
      else fromDate.setFullYear(fromDate.getFullYear() - 50);
      const iso = fromDate.toISOString().slice(0, 10);

      // Pull the base set (date-limited), then filter client-side for MVP simplicity
      const { data: rows, error } = await supabase
        .from("entries")
        .select("id, entry_date, game_name, platforms, mood, minutes_played, notes")
        .gte("entry_date", iso)
        .order("entry_date", { ascending: false });

      if (error) {
        setEntries([]);
        setLoading(false);
        return;
      }

      setEntries((rows as Entry[]) ?? []);
      setLoading(false);
    })();
  }, [router]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const platformOk =
        platformFilter === "All" ? true : (e.platforms ?? []).includes(platformFilter);

      const moodOk =
        moodFilter === "All" ? true : e.mood === Number(moodFilter);

      return platformOk && moodOk;
    });
  }, [entries, platformFilter, moodFilter]);

  function clearFilters() {
    setPlatformFilter("All");
    setMoodFilter("All");
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">History</h1>
          <p className="text-slate-600">
            {plan === "free" ? "Showing your last 30 days (Free)." : "Showing all entries (Pro)."}
          </p>
        </div>
        <a className="underline text-sm" href="/today">
          Today
        </a>
      </header>

      {/* Filters */}
      <section className="border rounded-lg p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Platform</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <option value="All">All</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Mood</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          </div>

          <button className="border rounded px-4 py-2 text-sm" onClick={clearFilters}>
            Clear
          </button>
        </div>

        <div className="text-sm text-slate-600 flex flex-wrap gap-3">
          <span>
            Results: <strong>{filteredEntries.length}</strong>
          </span>
          <span className="text-slate-400">
            (Filters apply locally — we’ll move this server-side later if needed.)
          </span>
        </div>
      </section>

      {/* List */}
      {loading ? (
        <p className="text-sm text-slate-600">Loading…</p>
      ) : (
        <ul className="space-y-3">
          {filteredEntries.map((e) => (
            <li key={e.id} className="border rounded-lg p-4 space-y-1">
              <div className="flex justify-between gap-4">
                <strong>{e.game_name ?? "Saved day"}</strong>
                <span className="text-sm text-slate-500">{e.entry_date}</span>
              </div>

              <div className="text-sm text-slate-600">
                {(e.platforms ?? []).join(", ")} · mood {e.mood}
                {e.minutes_played != null ? ` · ${e.minutes_played}m` : ""}
              </div>

              {e.notes && <p className="text-sm">{e.notes}</p>}
            </li>
          ))}
        </ul>
      )}

      {plan === "free" && (
        <div className="border rounded-lg p-4 text-sm">
          Want unlimited history, multi-platform entries, and streak protection?{" "}
          <a className="underline" href="/#pricing">
            See Pro
          </a>
        </div>
      )}
    </main>
  );
}

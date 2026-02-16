"use client";

import { useEffect, useState } from "react";
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

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [plan, setPlan] = useState<"free" | "pro">("free");

  useEffect(() => {
    (async () => {
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

      const { data: rows } = await supabase
        .from("entries")
        .select("id, entry_date, game_name, platforms, mood, minutes_played, notes")
        .gte("entry_date", iso)
        .order("entry_date", { ascending: false });

      setEntries((rows as Entry[]) ?? []);
    })();
  }, [router]);

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">History</h1>
          <p className="text-slate-600">
            {plan === "free" ? "Showing your last 30 days (Free)." : "Showing all entries (Pro)."}
          </p>
        </div>
        <a className="underline text-sm" href="/today">Today</a>
      </header>

      <ul className="space-y-3">
        {entries.map((e) => (
          <li key={e.id} className="border rounded-lg p-4 space-y-1">
            <div className="flex justify-between gap-4">
              <strong>{e.game_name ?? "Saved day"}</strong>
              <span className="text-sm text-slate-500">{e.entry_date}</span>
            </div>
            <div className="text-sm text-slate-600">
              {e.platforms?.join(", ")} · mood {e.mood}
              {e.minutes_played != null ? ` · ${e.minutes_played}m` : ""}
            </div>
            {e.notes && <p className="text-sm">{e.notes}</p>}
          </li>
        ))}
      </ul>

      {plan === "free" && (
        <div className="border rounded-lg p-4 text-sm">
          Want unlimited history, multi-platform entries, and streak protection?{" "}
          <a className="underline" href="/upgrade">Go Pro</a>
        </div>
      )}
    </main>
  );
}

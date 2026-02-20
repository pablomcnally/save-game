"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PageShell from "@/components/PageShell";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent } from "@/components/ui/Card";

export default function SettingsPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }

      setEmail(data.user.email ?? null);

      const { data: prof } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", data.user.id)
        .single();

      setPlan((prof?.plan ?? "free") === "pro" ? "pro" : "free");
      setLoading(false);
    })();
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
 <PageShell
      title="Stats"
      subtitle="All entries."
    >
      {loading ? (
        <p className="text-sm text-slate-300">Loading…</p>
      ) : (
        <div className="space-y-4">
          {/* Account */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <h2 className="text-lg font-semibold">Account</h2>

              <div className="text-sm">
                <p className="text-slate-400">Email</p>
                <p className="text-white">{email}</p>
              </div>

              <div className="text-sm">
                <p className="text-slate-400">Plan</p>
                <p className="text-white capitalize">{plan}</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <h2 className="text-lg font-semibold">Subscription</h2>

              {plan === "free" ? (
                <>
                  <p className="text-slate-300 text-sm">
                    You’re on the Free plan. Upgrade to unlock multi-platform entries,
                    full history, and streak freezes.
                  </p>
                  <a
                    href="/#pricing"
                    className="inline-flex items-center justify-center rounded-xl bg-fuchsia-600 px-4 py-2 font-medium text-white hover:bg-fuchsia-500 w-fit"
                  >
                    Upgrade to Pro (coming soon)
                  </a>
                </>
              ) : (
                <p className="text-slate-300 text-sm">
                  You’re on Pro. Thanks for supporting Save Game ❤️
                </p>
              )}
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-red-500/30">
            <CardContent className="pt-5 space-y-3">
              <h2 className="text-lg font-semibold text-red-400">Danger zone</h2>

              <p className="text-sm text-slate-300">
                These actions can’t be undone.
              </p>

              <button
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20"
                disabled
                title="Not implemented yet"
              >
                Delete account (coming soon)
              </button>
            </CardContent>
          </Card>

          {/* Sign out */}
          <div>
            <button
              onClick={signOut}
              className="text-sm underline underline-offset-4 text-slate-300 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      <MobileNav />
    </PageShell>
  );
}

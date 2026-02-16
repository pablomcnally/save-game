"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,

      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the sign-in link.");
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-3xl font-bold">Save Game</h1>
      <p className="text-slate-600">
        Sign in to start saving your gaming days.
      </p>

      <div className="space-y-3">
        <label className="block text-sm">Email address</label>
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={sendMagicLink}
          disabled={loading || !email}
          className="border rounded px-4 py-2 w-full"
        >
          {loading ? "Sending…" : "Send magic link"}
        </button>

        {message && (
          <p className="text-sm text-slate-600">{message}</p>
        )}
      </div>
    </main>
  );
}

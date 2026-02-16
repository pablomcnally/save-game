"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function getHashParam(name: string) {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash).get(name);
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);

      // PKCE flow (recommended): /auth/callback?code=...
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMsg(`Sign-in failed: ${error.message}`);
          return;
        }
        router.replace("/today");
        return;
      }

      // Fallback: implicit flow tokens in hash: #access_token=...
      const accessToken = getHashParam("access_token");
      const refreshToken = getHashParam("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setMsg(`Sign-in failed: ${error.message}`);
          return;
        }

        router.replace("/today");
        return;
      }

      setMsg("No sign-in details found. Try signing in again.");
    })();
  }, [router]);

  return (
    <main className="mx-auto max-w-md p-6">
      <p className="text-slate-700">{msg}</p>
    </main>
  );
}

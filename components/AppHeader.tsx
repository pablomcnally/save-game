"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <a
      href={href}
      className={[
        "text-sm",
        active
          ? "text-white underline underline-offset-4"
          : "text-slate-300 hover:text-white",
      ].join(" ")}
    >
      {children}
    </a>
  );
}

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSignedIn(!!data.session);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <header className="border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Brand */}
        <a href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-sm" />
          <span className="font-semibold tracking-tight">Save Game</span>
        </a>

        {/* Primary nav */}
        <nav className="flex items-center gap-5">
          <NavLink href="/today">Today</NavLink>
          <NavLink href="/history">History</NavLink>
          <NavLink href="/stats">Stats</NavLink>

          {/* Account dropdown */}
          {!loading && (
            signedIn ? (
              <div
                className="relative"
                ref={menuRef}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className={[
                    "text-sm rounded-lg px-3 py-2",
                    "border border-white/10 bg-white/5 hover:bg-white/10",
                    open ? "text-white" : "text-slate-200",
                  ].join(" ")}
                >
                  Account <span className="text-slate-400">▾</span>
                </button>

                {open && (
                  <div className="absolute right-0 top-full mt-1 w-44 translate-x-1 origin-top-right rounded-xl border border-white/10 bg-slate-950/95 shadow-lg overflow-hidden">
                    <a
                      href="/settings"
                      className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                      onClick={() => setOpen(false)}
                    >
                      Settings
                    </a>

                    <button
                      onClick={signOut}
                      className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="/login"
                className="text-sm rounded-lg px-3 py-2 border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              >
                Sign in
              </a>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

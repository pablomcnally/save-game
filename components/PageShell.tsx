"use client";

import React from "react";

export default function PageShell({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Page header (title/subtitle only) */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 pb-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-slate-300">{subtitle}</p> : null}
        </div>
      </div>

      {/* Page body */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 pb-24 sm:pb-10">
        {children}
      </div>
    </main>
  );
}

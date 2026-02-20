import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Save Game · History",
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

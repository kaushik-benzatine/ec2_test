import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bar Battle 🚀 | Multiplayer Face-Clicker Arena",
  description: "Interactive real-time multiplayer bar chart game. Click rival player faces perched on top of vertical bars to boost your own bar height and conquer the daily leaderboard!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

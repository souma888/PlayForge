import type { Metadata } from "next";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Playforge — Worlds worth playing",
  description: "A browser gaming universe for bold worlds, fierce competition and player-made possibilities.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><MotionProvider>{children}</MotionProvider></body></html>;
}

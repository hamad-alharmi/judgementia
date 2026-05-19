import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const legalFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-legal",
  weight: ["400", "600", "700"],
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Judgementia",
  description:
    "Premium court legal thriller multiplayer — argue, persuade, verdict.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${legalFont.variable} ${monoFont.variable} ${sansFont.variable}`}
    >
      <body className="font-sans text-zinc-100">{children}</body>
    </html>
  );
}

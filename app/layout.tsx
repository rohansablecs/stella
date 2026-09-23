import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/site/SmoothScroll";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "STELLA — Intelligent Activity Recognition for Space Experiments",
  description:
    "STELLA is an AI-assisted activity recognition system for autonomous space experiment operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon.png"
        />
        <link
          rel="apple-touch-icon"
          href="/favicon.png"
        />
      </head>

      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
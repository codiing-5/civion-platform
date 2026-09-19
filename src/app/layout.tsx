import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Civion | AI Municipal Intelligence & Ward Issue Dispatch",
  description:
    "Real People. Real Photos. Healthier Cities. Civion is an AI-powered municipal issue reporting and ward management platform created by Rojan Jose with PostGIS spatial deduplication and automated SLA escalation.",
  keywords: [
    "Civion",
    "Rojan Jose",
    "Municipal Issue Reporting",
    "Civic Tech",
    "PostGIS",
    "Kozhikode Municipal Corporation",
    "AI Privacy Scrubbing",
    "Smart Cities Kerala",
  ],
  authors: [{ name: "Rojan Jose" }],
  openGraph: {
    title: "Civion | AI Municipal Intelligence & Ward Issue Dispatch",
    description: "Real People. Real Photos. Healthier Cities. Created by Rojan Jose.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body
        className={`${jakarta.variable} ${syne.variable} ${mono.variable} font-sans antialiased protox-canvas min-h-screen text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200`}
      >
        {children}
      </body>
    </html>
  );
}

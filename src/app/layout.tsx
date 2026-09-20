import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
};

export const metadata: Metadata = {
  title: "Civion | Report Local Problems & Improve Your Community",
  description:
    "Civion makes it easy for citizens to report potholes, waste dumping, broken streetlights, water leaks, and other municipal problems.",
  keywords: [
    "Civion",
    "Municipal Problem Reporting",
    "Citizen Portal",
    "Local Issue Fix",
    "Pothole Report",
    "Public Services",
  ],
  authors: [{ name: "Civion Platform" }],
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${jakarta.variable} ${mono.variable} font-sans antialiased min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-slate-100 transition-colors selection:bg-blue-500/30 selection:text-blue-600`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col w-full">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

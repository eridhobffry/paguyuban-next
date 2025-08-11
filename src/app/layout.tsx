import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { stackServerApp } from "../stack";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientAnalyticsProvider from "@/components/ClientAnalyticsProvider";
import { Suspense } from "react";

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
  title: "Nusantara Messe 2026 | Cultural & Business Expo",
  description:
    "Join us for the premier cultural and business expo connecting Indonesia and Germany",
  metadataBase: new URL("https://nusantara-messe-2026.vercel.app"),
  openGraph: {
    title: "Nusantara Messe 2026 | Cultural & Business Expo",
    description:
      "Join us for the premier cultural and business expo connecting Indonesia and Germany",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Skip link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-slate-800 focus:text-white"
        >
          Skip to main content
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <StackProvider app={stackServerApp}>
            <StackTheme>
              <Suspense fallback={null}>
                <ClientAnalyticsProvider />
              </Suspense>
              <main id="main-content" role="main" tabIndex={-1}>
                {children}
              </main>
              <Toaster richColors closeButton position="top-right" />
            </StackTheme>
          </StackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

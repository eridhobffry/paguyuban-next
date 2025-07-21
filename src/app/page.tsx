import { Metadata } from "next";
import dynamic from "next/dynamic";

// Client components with dynamic imports
const HeroSection = dynamic(() => import("@/components/sections/HeroSection"));
const InvestmentOpportunitySection = dynamic(
  () => import("@/components/sections/InvestmentOpportunitySection")
);
const AboutSection = dynamic(
  () => import("@/components/sections/AboutSection")
);
const FeaturesSection = dynamic(
  () => import("@/components/sections/FeaturesSection")
);
const SpeakersSection = dynamic(
  () => import("@/components/sections/SpeakersSection")
);
const ScheduleSection = dynamic(
  () => import("@/components/sections/ScheduleSection")
);
const SponsorsSection = dynamic(
  () => import("@/components/sections/SponsorsSection")
);
const CtaSection = dynamic(() => import("@/components/sections/CtaSection"));
const ROICalculatorSection = dynamic(
  () => import("@/components/sections/ROICalculatorSection")
);
const ChatAssistantSection = dynamic(
  () => import("@/components/sections/ChatAssistantSection")
);

export const metadata: Metadata = {
  title: "Nusantara Messe 2026 | Cultural & Business Expo",
  description:
    "Experience the future of cultural diplomacy at Nusantara Messe 2026 in Berlin. Join us for a unique fusion of Indonesian heritage and cutting-edge business opportunities in Europe's largest market.",
  keywords:
    "Nusantara Messe, Indonesia, Berlin, Cultural Expo, Business Expo, 2026, Investment",
  themeColor: "#0f172a",
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Nusantara Messe 2026 | Cultural & Business Expo",
    description:
      "Join us for a unique fusion of Indonesian heritage and cutting-edge business opportunities in Berlin.",
    url: "https://nusantara-messe-2026.vercel.app",
    siteName: "Nusantara Messe 2026",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Nusantara Messe 2026",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nusantara Messe 2026 | Cultural & Business Expo",
    description:
      "Experience the future of cultural diplomacy at Nusantara Messe 2026 in Berlin",
    images: ["/images/twitter-image.jpg"],
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <HeroSection />
      <InvestmentOpportunitySection />
      <ROICalculatorSection />
      <AboutSection />
      <FeaturesSection />
      <SpeakersSection />
      <ScheduleSection />
      <SponsorsSection />
      <CtaSection />
      <ChatAssistantSection />
    </main>
  );
}

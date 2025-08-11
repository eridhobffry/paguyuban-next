import type { ElementType } from "react";
import {
  TrendingUp,
  Euro,
  Users,
  Globe,
  Target,
  BarChart3,
  PieChart,
  Download,
  Zap,
  CheckCircle,
  FileText,
  ExternalLink,
} from "lucide-react";

export const marketData = [
  {
    metric: "Bilateral Trade Volume",
    value: "€7.32 Billion",
    growth: "Verified 2024",
    description: "Germany-Indonesia Annual Trade",
    icon: Euro,
    color: "from-green-400 to-emerald-600",
  },
  {
    metric: "Indonesian Community",
    value: "21,559",
    growth: "Citizens + Students",
    description: "Professionals & Students in Germany",
    icon: Users,
    color: "from-blue-400 to-cyan-600",
  },
  {
    metric: "Business Pipeline",
    value: "€650K",
    growth: "Conservative Est.",
    description: "Qualified Opportunities",
    icon: TrendingUp,
    color: "from-purple-400 to-pink-600",
  },
  {
    metric: "Media Reach",
    value: "5-8M",
    growth: "Impressions",
    description: "Digital Campaign Coverage",
    icon: Globe,
    color: "from-amber-400 to-orange-600",
  },
];

export const SERIES_COLORS = [
  "#10b981",
  "#8b5cf6",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

export const sponsorshipTiers = [
  {
    name: "Title Sponsor",
    investment: "€120,000",
    mediaValue: "€150,000",
    benefits: [
      "Naming rights to entire event",
      "Premier booth placement & branding",
      "2 keynote speaking opportunities",
      "40% of total event impressions",
      "20 VIP passes & exclusive networking",
      "50 AI-facilitated introductions",
    ],
    availability: "1 Available",
    highlight: true,
    impressions: "4.0M+",
    leads: "200-300",
  },
  {
    name: "Platinum Sponsor",
    investment: "€60,000",
    mediaValue: "€85,000",
    benefits: [
      "High-impact visibility & branding",
      "30 AI-facilitated introductions",
      "Panel participation opportunity",
      "Access to segmented attendee list",
      "15 VIP passes & VVIP networking",
      "Featured in digital campaigns",
    ],
    availability: "3 Available",
    highlight: false,
    impressions: "2.5M+",
    leads: "100-150",
  },
  {
    name: "Gold Sponsor",
    investment: "€40,000",
    mediaValue: "€55,000",
    benefits: [
      "Strong visibility in high-traffic areas",
      "20 AI matchmaking connections",
      "Speaking slot or demo opportunity",
      "Shared booth space in expo hall",
      "10 VIP passes & networking access",
      "Inclusion in email campaigns",
    ],
    availability: "4 Available",
    highlight: false,
    impressions: "1.5M+",
    leads: "70-100",
  },
  {
    name: "Silver Sponsor",
    investment: "€25,000",
    mediaValue: "€35,000",
    benefits: [
      "Solid visibility placement",
      "10 AI introductions",
      "Exhibition table option",
      "5 VIP passes & networking",
      "Social media mentions",
    ],
    availability: "6 Available",
    highlight: false,
    impressions: "800K+",
    leads: "40-70",
  },
  {
    name: "Bronze Sponsor",
    investment: "€15,000",
    mediaValue: "€20,000",
    benefits: [
      "Entry-level visibility",
      "5 AI matches",
      "General networking access",
      "3 VIP passes",
      "Basic CSR alignment",
    ],
    availability: "8 Available",
    highlight: false,
    impressions: "400K+",
    leads: "20-40",
  },
];

export const getIconComponent = (iconName: string): ElementType => {
  const iconMap: { [key: string]: ElementType } = {
    FileText,
    BarChart3,
    Zap,
    Users,
    TrendingUp,
    Globe,
    Target,
    PieChart,
    Download,
    ExternalLink,
  };
  return iconMap[iconName] || FileText;
};

export { Euro, Users, TrendingUp, Globe, Target, PieChart, CheckCircle };

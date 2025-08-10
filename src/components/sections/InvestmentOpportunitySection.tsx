"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Euro,
  Users,
  Globe,
  Target,
  BarChart3,
  PieChart,
  ArrowRight,
  Download,
  Zap,
  CheckCircle,
  Lock,
  Unlock,
  FileText,
  ExternalLink,
  Brain,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { FinancialResponseDto } from "@/types/financial";
import { Badge } from "@/components/ui/badge";

// Safe formatting function to prevent hydration mismatches
const formatCurrency = (amount: number, isClient: boolean = false) => {
  if (!isClient) {
    // Server-side: use simple format to match what we'll show initially on client
    return `€${amount.toLocaleString("en-US")}`;
  }
  // Client-side: use proper locale formatting
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const marketData = [
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

const SERIES_COLORS = [
  "#10b981",
  "#8b5cf6",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

const sponsorshipTiers = [
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

interface DocumentData {
  id: string;
  title: string;
  description: string;
  preview: string;
  pages: string;
  type: string;
  icon: string;
  file_url?: string;
  external_url?: string;
  restricted: boolean;
  ai_generated: boolean;
}

const InvestmentOpportunitySection = () => {
  const [activeDocument, setActiveDocument] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [financial, setFinancial] = useState<FinancialResponseDto | null>(null);

  useEffect(() => {
    setIsClient(true);
    fetchDocuments();
    fetchFinancial();
  }, []);
  const fetchFinancial = async () => {
    try {
      const res = await fetch("/api/financial/public", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as FinancialResponseDto;
        setFinancial(json);
      }
    } catch {
      // ignore; this section will keep static placeholders if fetch fails
    }
  };

  const revenueItems = useMemo(() => financial?.revenues ?? [], [financial]);
  const totalRevenue = useMemo(
    () => revenueItems.reduce((sum, r) => sum + (r.amount || 0), 0),
    [revenueItems]
  );
  const financialBreakdown = useMemo(
    () =>
      revenueItems.length && totalRevenue
        ? revenueItems.map((item, index) => ({
            category: item.category,
            amount: item.amount,
            percentage: Math.round((item.amount / totalRevenue) * 100),
            color: SERIES_COLORS[index % SERIES_COLORS.length],
          }))
        : [
            // fallback (will be superseded once fetch succeeds)
            {
              category: "Sponsorships",
              amount: 415000,
              percentage: 67,
              color: "#10b981",
            },
            {
              category: "Ticket Sales",
              amount: 104660,
              percentage: 17,
              color: "#8b5cf6",
            },
            {
              category: "Exhibitor Fees",
              amount: 66000,
              percentage: 11,
              color: "#3b82f6",
            },
            {
              category: "Additional Revenue",
              amount: 30000,
              percentage: 5,
              color: "#f59e0b",
            },
          ],
    [revenueItems, totalRevenue]
  );

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents/public");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      // Fallback to static documents if API fails
      setDocuments([
        {
          id: "fallback-1",
          title: "Executive Business Plan",
          description:
            "Comprehensive business strategy with market analysis, financial projections, and risk assessments",
          pages: "47 pages",
          type: "Business Strategy",
          icon: "FileText",
          preview:
            "Detailed market opportunity analysis for Indonesia-Germany trade relationship worth €7.32 Billion annually...",
          restricted: true,
          ai_generated: false,
        },
        {
          id: "fallback-2",
          title: "Financial Projections & ROI Analysis",
          description:
            "Conservative financial modeling with stress-tested scenarios and profitability analysis",
          pages: "23 pages",
          type: "Financial Analysis",
          icon: "BarChart3",
          preview:
            "Net profit of €65,186 with conservative assumptions. Multiple scenario modeling...",
          restricted: true,
          ai_generated: false,
        },
        {
          id: "fallback-3",
          title: "Technical Innovation Overview",
          description:
            "AI-powered matchmaking platform specifications and competitive advantage analysis",
          pages: "15 pages",
          type: "Technology",
          icon: "Zap",
          preview:
            "First-of-kind cultural intelligence algorithms for B2B networking. Custom development by Indonesian team...",
          restricted: false,
          ai_generated: false,
        },
        {
          id: "fallback-4",
          title: "Market Research & Validation",
          description:
            "Primary research including diaspora demographics and competitive landscape analysis",
          pages: "31 pages",
          type: "Market Research",
          icon: "Users",
          preview:
            "Primary research with 21,559 Indonesian community and 30,000+ professionals in German market...",
          restricted: true,
          ai_generated: false,
        },
      ]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ElementType } = {
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

  const handleDocumentAction = (doc: DocumentData) => {
    if (doc.external_url) {
      window.open(doc.external_url, "_blank", "noopener,noreferrer");
    } else if (doc.file_url) {
      window.open(doc.file_url, "_blank", "noopener,noreferrer");
    } else {
      // Request access for restricted documents
      const subject = encodeURIComponent(`Access Request: ${doc.title}`);
      const body = encodeURIComponent(
        `I would like to request access to the document "${doc.title}" for Paguyuban Messe 2026 partnership evaluation.`
      );
      window.open(
        `mailto:nusantaraexpoofficial@gmail.com?subject=${subject}&body=${body}`
      );
    }
  };

  return (
    <section
      id="investment-opportunity"
      className="relative py-20 bg-gradient-to-b from-slate-900/50 to-slate-800/80"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 mb-4 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-full">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              Sponsorship Opportunities
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
            Partner with Europe&apos;s Premier
            <span className="block text-blue-400 mt-2">
              Indonesia-Germany Platform
            </span>
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Join the launch of a sustainable platform designed to forge the next
            generation of Indonesia-Germany partnerships. Access verified market
            opportunities with measurable brand benefits.
          </p>
        </motion.div>

        {/* Market Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {marketData.map((data, index) => {
            const Icon = data.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300 group overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${data.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                ></div>

                <div
                  className={`inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-br ${data.color} text-white`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="text-3xl font-bold text-white mb-1">
                  {data.value}
                </div>
                <div className="text-sm text-green-400 mb-2">{data.growth}</div>
                <div className="text-gray-400 text-sm">{data.metric}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {data.description}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Financial Breakdown Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-8 mb-16 border border-white/10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <PieChart className="w-7 h-7 mr-3 text-blue-400" />
                Revenue Breakdown -{" "}
                {formatCurrency(
                  totalRevenue ||
                    financialBreakdown.reduce((s, i) => s + i.amount, 0),
                  isClient
                )}{" "}
                Total
              </h3>

              <div className="space-y-4">
                {financialBreakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-gray-300 font-medium">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">
                        {formatCurrency(item.amount, isClient)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-blue-400 font-bold text-lg">
                      Total Media Value
                    </div>
                    <div className="text-gray-300 text-sm">
                      For All Sponsors
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-400">
                      €220K+
                    </div>
                    <div className="text-sm text-blue-300">
                      Combined Benefits
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square max-w-md mx-auto relative">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full transform -rotate-90"
                >
                  {financialBreakdown.map((item, index) => {
                    const offset = financialBreakdown
                      .slice(0, index)
                      .reduce((sum, prev) => sum + prev.percentage, 0);
                    const circumference = 2 * Math.PI * 30;
                    const strokeDasharray = `${
                      (item.percentage / 100) * circumference
                    } ${circumference}`;
                    const strokeDashoffset = -((offset / 100) * circumference);

                    return (
                      <circle
                        key={index}
                        cx="50"
                        cy="50"
                        r="30"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="8"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="opacity-80 hover:opacity-100 transition-opacity duration-300"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(
                        totalRevenue ||
                          financialBreakdown.reduce((s, i) => s + i.amount, 0),
                        isClient
                      )}
                    </div>
                    <div className="text-sm text-gray-400">Total Revenue</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Investment Tiers */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16"
        >
          <h3 className="text-3xl font-bold text-center text-white mb-12">
            Sponsorship Partnership Tiers
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sponsorshipTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl border transition-all duration-300 transform hover:scale-105 ${
                  tier.highlight
                    ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 ring-2 ring-blue-500/20"
                    : "bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 hover:border-blue-500/20"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                      Maximum Impact
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-white mb-2">
                    {tier.name}
                  </h4>
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {tier.investment}
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    {tier.availability}
                  </div>
                  <div className="space-y-2">
                    <div className="inline-flex items-center px-3 py-1 bg-blue-500/20 rounded-full">
                      <Globe className="w-4 h-4 mr-1 text-blue-400" />
                      <span className="text-blue-400 font-medium">
                        {tier.impressions}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Media Value: {tier.mediaValue}
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                    tier.highlight
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white"
                      : "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                  }`}
                >
                  Become a Sponsor
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Business Documents Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-3xl p-8 border border-white/10"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
              <FileText className="w-8 h-8 mr-3 text-blue-400" />
              Executive Documentation
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Access comprehensive business analysis, financial projections, and
              strategic planning documents. Request full access to detailed
              investor materials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documentsLoading
              ? // Loading state
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="relative p-6 rounded-xl border bg-white/5 border-white/10 animate-pulse"
                  >
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gray-600 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-600 rounded mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-3 bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                    </div>
                    <div className="h-12 bg-gray-700 rounded mb-4"></div>
                    <div className="flex space-x-3">
                      <div className="flex-1 h-8 bg-gray-700 rounded"></div>
                      <div className="w-8 h-8 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))
              : documents.map((doc, index) => {
                  const IconComponent = getIconComponent(doc.icon);
                  return (
                    <div
                      key={doc.id}
                      className={`relative p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                        activeDocument === index
                          ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30"
                          : "bg-white/5 border-white/10 hover:border-blue-500/30"
                      }`}
                      onClick={() => setActiveDocument(index)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-blue-500/20 rounded-lg">
                            <IconComponent className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white">
                                {doc.title}
                              </h4>
                              {doc.ai_generated && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30"
                                >
                                  <Brain className="w-3 h-3 mr-1" />
                                  AI
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <span>{doc.pages}</span>
                              <span>•</span>
                              <span>{doc.type}</span>
                            </div>
                          </div>
                        </div>
                        {doc.restricted ? (
                          <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        ) : (
                          <Unlock className="w-5 h-5 text-green-400 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-gray-300 text-sm mb-4">
                        {doc.description}
                      </p>

                      <div className="p-3 bg-white/5 rounded-lg mb-4">
                        <p className="text-xs text-gray-400 italic">
                          &ldquo;{doc.preview}&rdquo;
                        </p>
                      </div>

                      <div className="flex space-x-3">
                        {doc.restricted ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDocumentAction(doc);
                            }}
                            className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-200 rounded-lg hover:from-amber-500/30 hover:to-orange-500/30 transition-all duration-300"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Request Access
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDocumentAction(doc);
                            }}
                            className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 text-blue-200 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {doc.external_url ? "View" : "Download"}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDocumentAction(doc);
                          }}
                          className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
          </div>

          <div className="mt-8 text-center">
            <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center mx-auto">
              <FileText className="w-5 h-5 mr-3" />
              Request Complete Documentation Package
              <ArrowRight className="w-5 h-5 ml-3" />
            </button>
            <p className="mt-3 text-sm text-gray-400">
              Full investor package includes confidential financials, legal
              documentation, and partnership agreements
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InvestmentOpportunitySection;

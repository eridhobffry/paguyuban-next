"use client";

import { motion } from "framer-motion";
import {
  PieChart,
  TrendingUp,
  Shield,
  Eye,
  BarChart3,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
  Download,
  ExternalLink,
  DollarSign,
  Target,
} from "lucide-react";
import { useState } from "react";

// Safe formatting function to prevent hydration mismatches
const formatCurrency = (amount: number) => {
  if (typeof window === "undefined") {
    return `€${Math.round(amount).toLocaleString()}`;
  }
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const revenueBreakdown = [
  {
    category: "Sponsorships",
    amount: 790000,
    percentage: 78,
    color: "#10b981",
    description: "Primary funding from strategic partners",
    details: [
      "Title Sponsor: €120,000 × 1",
      "Platinum: €60,000 × 3",
      "Gold: €40,000 × 4",
      "Silver: €25,000 × 6",
      "Bronze: €15,000 × 8",
    ],
  },
  {
    category: "Ticket Sales",
    amount: 104660,
    percentage: 10,
    color: "#8b5cf6",
    description: "Registration fees from attendees",
    details: [
      "2-Day Pass Standard: €70 × 400",
      "Day 1 Standard: €45 × 400",
      "Day 2 Standard: €40 × 280",
      "Student Discounts: 30% off",
      "VIP Packages: €120 × 100",
      "Techno Night Tickets: €20 × 800",
    ],
  },
  {
    category: "Exhibitor Fees",
    amount: 66000,
    percentage: 6,
    color: "#3b82f6",
    description: "Exhibition booth rentals",
    details: [
      "Standard Booths (3×3m): €2,400 × 15",
      "Premium Booths (4×4m): €3,000 × 10",
      "25-30 total exhibition spaces",
      "Includes setup and basic utilities",
    ],
  },
  {
    category: "Additional Revenue",
    amount: 58000,
    percentage: 6,
    color: "#f59e0b",
    description: "Merchandise, streaming, workshops",
    details: [
      "Merchandise: €8,000",
      "Streaming Passes: €25,000 × 1,000",
      "Food & Beverage (pre-paid tokens): €18,000",
      "Workshop Tickets: €5,000",
      "Commission on Sales: €2,000",
    ],
  },
];

const majorCosts = [
  {
    category: "Venue & Operations",
    amount: 235920,
    percentage: 25,
    color: "#ef4444",
    description: "Arena Berlin rental, utilities, technical setup",
  },
  {
    category: "Marketing & Media",
    amount: 168000,
    percentage: 18,
    color: "#8b5cf6",
    description: "Digital campaigns, influencers, PR, content creation",
  },
  {
    category: "Artists & Entertainment",
    amount: 156654,
    percentage: 16,
    color: "#f59e0b",
    description: "Dewa 19, Tulus, ERK, Panturas, DJs, technical riders",
  },
  {
    category: "Staffing & Management",
    amount: 158000,
    percentage: 17,
    color: "#3b82f6",
    description: "Core team, event agency, freelancers, volunteers",
  },
  {
    category: "Operations & Logistics",
    amount: 132000,
    percentage: 14,
    color: "#6b7280",
    description: "Insurance, catering, equipment, permits, logistics",
  },
  {
    category: "Technology & Speakers",
    amount: 102900,
    percentage: 10,
    color: "#10b981",
    description: "App development, AI platform, speaker fees & travel",
  },
];

const sponsorBenefits = [
  {
    tier: "Title Sponsor",
    investment: 120000,
    mediaValue: 150000,
    impressions: "4.0M+",
    leads: "200-300",
    benefits: [
      "Naming rights to entire event",
      "Premier booth placement & branding",
      "2 keynote speaking opportunities",
      "40% of total event impressions",
      "VIP dinner hosting rights",
      "20 VIP passes & exclusive networking",
    ],
    color: "from-amber-500 to-orange-600",
  },
  {
    tier: "Platinum Sponsor",
    investment: 60000,
    mediaValue: 85000,
    impressions: "2.5M+",
    leads: "100-150",
    benefits: [
      "High-impact visibility & branding",
      "30 AI-facilitated introductions",
      "Panel participation opportunity",
      "Access to segmented attendee list",
      "15 VIP passes & VVIP networking",
      "Featured in digital campaigns",
    ],
    color: "from-blue-500 to-cyan-600",
  },
  {
    tier: "Gold Sponsor",
    investment: 40000,
    mediaValue: 55000,
    impressions: "1.5M+",
    leads: "70-100",
    benefits: [
      "Strong visibility in high-traffic areas",
      "20 AI matchmaking connections",
      "Speaking slot or demo opportunity",
      "Shared booth space in expo hall",
      "10 VIP passes & networking access",
      "Inclusion in email campaigns",
    ],
    color: "from-purple-500 to-pink-600",
  },
];

const FinancialTransparencySection = () => {
  const [activeTab, setActiveTab] = useState("revenue");
  const [selectedRevenue, setSelectedRevenue] = useState(0);

  const totalRevenue = revenueBreakdown.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const totalCosts = majorCosts.reduce((sum, item) => sum + item.amount, 0);
  const fundingGap = totalCosts - totalRevenue;

  return (
    <section
      id="financial-transparency"
      className="relative py-20 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-800/80 -z-10"></div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute -top-1/2 right-1/4 w-[120%] h-[120%] bg-gradient-to-bl from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-full translate-x-1/4 -translate-y-1/2 animate-spin-slow"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 mb-4 px-6 py-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-full">
            <Eye className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-green-300 to-blue-300 bg-clip-text text-transparent">
              Financial Transparency
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-green-100 to-blue-200 bg-clip-text text-transparent">
            Open Book
            <span className="block text-green-400 mt-2">
              Financial Framework
            </span>
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Complete transparency in our financial model. See exactly how your
            sponsorship investment creates measurable value and supports the
            Indonesia-Germany business community.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
            <div className="flex gap-2">
              {[
                { id: "revenue", label: "Revenue Model", icon: TrendingUp },
                { id: "costs", label: "Cost Structure", icon: BarChart3 },
                { id: "benefits", label: "Sponsor ROI", icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Revenue Model Tab */}
        {activeTab === "revenue" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            {/* Revenue Pie Chart */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <PieChart className="w-6 h-6 mr-3 text-green-400" />
                Revenue Breakdown - {formatCurrency(totalRevenue)}
              </h3>

              <div className="aspect-square max-w-md mx-auto relative mb-8">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full transform -rotate-90"
                >
                  {revenueBreakdown.map((item, index) => {
                    const offset = revenueBreakdown
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
                        className={`transition-opacity duration-300 cursor-pointer ${
                          selectedRevenue === index
                            ? "opacity-100"
                            : "opacity-70 hover:opacity-90"
                        }`}
                        onClick={() => setSelectedRevenue(index)}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-400">Total Revenue</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {revenueBreakdown.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedRevenue(index)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      selectedRevenue === index
                        ? "bg-white/10"
                        : "bg-white/5 hover:bg-white/8"
                    }`}
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
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Details */}
            <div>
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl p-8 border border-white/10">
                <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                  <ArrowRight className="w-5 h-5 mr-3 text-green-400" />
                  {revenueBreakdown[selectedRevenue].category} Details
                </h4>

                <p className="text-gray-300 mb-6">
                  {revenueBreakdown[selectedRevenue].description}
                </p>

                <div className="space-y-3 mb-8">
                  {revenueBreakdown[selectedRevenue].details.map(
                    (detail, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{detail}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-green-400 font-bold">
                        Category Total
                      </div>
                      <div className="text-gray-300 text-sm">
                        {revenueBreakdown[selectedRevenue].percentage}% of
                        revenue
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {formatCurrency(revenueBreakdown[selectedRevenue].amount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cost Structure Tab */}
        {activeTab === "costs" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-8 border border-white/10 mb-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <BarChart3 className="w-6 h-6 mr-3 text-red-400" />
                  Cost Structure - {formatCurrency(totalCosts)}
                </h3>
                <div className="text-right">
                  <div className="text-red-400 font-bold">Funding Gap</div>
                  <div className="text-2xl font-bold text-red-400">
                    {formatCurrency(fundingGap)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {majorCosts.map((cost, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white/5 rounded-xl p-6 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-white">{cost.category}</h4>
                      <div className="text-sm text-gray-400">
                        {cost.percentage}%
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">
                      {formatCurrency(cost.amount)}
                    </div>
                    <p className="text-gray-400 text-sm">{cost.description}</p>
                    <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${cost.percentage}%`,
                          backgroundColor: cost.color,
                        }}
                      ></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(totalRevenue)}
                </div>
                <div className="text-gray-300">Total Revenue</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                <TrendingUp className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-red-400">
                  {formatCurrency(totalCosts)}
                </div>
                <div className="text-gray-300">Total Costs</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
                <Target className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-yellow-400">
                  {formatCurrency(fundingGap)}
                </div>
                <div className="text-gray-300">Funding Gap</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sponsor Benefits Tab */}
        {activeTab === "benefits" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {sponsorBenefits.map((sponsor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 border border-white/10 ${
                  index === 0 ? "ring-2 ring-amber-500/30" : ""
                }`}
              >
                {index === 0 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-amber-900 px-4 py-1 rounded-full text-sm font-bold">
                      Best Value
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {sponsor.tier}
                  </h3>
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {formatCurrency(sponsor.investment)}
                  </div>
                  <div className="text-sm text-gray-400 mb-4">Investment</div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-blue-400 font-bold">
                        {formatCurrency(sponsor.mediaValue)}
                      </div>
                      <div className="text-xs text-gray-400">Media Value</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-purple-400 font-bold">
                        {sponsor.impressions}
                      </div>
                      <div className="text-xs text-gray-400">Impressions</div>
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center px-3 py-1 bg-gradient-to-r ${sponsor.color} bg-opacity-20 rounded-full`}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium text-white">
                      {sponsor.leads} leads
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {sponsor.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full py-3 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r ${sponsor.color} hover:opacity-90 text-white`}
                >
                  Secure Sponsorship
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Download Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-3xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
              <Shield className="w-6 h-6 mr-3 text-green-400" />
              Complete Financial Documentation
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Access detailed financial projections, cost breakdowns, and
              sponsor benefit calculations. All figures are based on verified
              market data and conservative estimates.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center">
                <Download className="w-5 h-5 mr-3" />
                Download Financial Report
              </button>
              <button className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300 flex items-center">
                <ExternalLink className="w-5 h-5 mr-3" />
                View Sponsor Deck
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinancialTransparencySection;

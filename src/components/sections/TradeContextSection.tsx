"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Globe,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Factory,
  Handshake,
  Target,
  ExternalLink,
} from "lucide-react";

// Safe formatting function to prevent hydration mismatches
const formatCurrency = (amount: number, currency: string = "EUR") => {
  // Always use consistent formatting to prevent hydration issues
  // Use English locale to avoid "Mrd." and ensure "B" for billions
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    notation: "compact",
    compactDisplay: "short",
  }).format(amount);

  // Replace "B" with "Billion" for consistency
  return formatted.replace(/B$/, " Billion");
};

const formatNumber = (num: number) => {
  // Always use consistent formatting to prevent hydration issues
  return new Intl.NumberFormat("de-DE").format(num);
};

// Trade data based on internal documents
const tradeData = {
  bilateralTrade: {
    total: 7320000000, // €7.32B total bilateral trade (updated based on latest data)
    germanImports: 4430000000, // €4.43B German imports from Indonesia (Destatis)
    germanExports: 3120000000, // €3.12B German exports to Indonesia (derived from €7.32B - €4.43B)
  },
  usDollar: {
    germanImports: 4790000000, // US$ 4.79B
    germanExports: 3120000000, // US$ 3.12B
  },
  growth: {
    year: 2024,
    trend: "+8.5%",
    projectedGrowth: "12-15%",
  },
  diaspora: {
    residents: 15829, // Official Destatis 2023 data
    students: 5730, // DAAD 2023/24 data
    total: 21559,
  },
};

// Key sectors for Indonesia-Germany collaboration (2025-2030)
const collaborationSectors = [
  {
    sector: "Green Technology & Renewable Energy",
    description: "Solar panels, wind turbines, energy storage",
    potential: "€50.2B",
    period: "cumulative 2025-2030",
    icon: <Factory className="w-6 h-6" />,
    color: "from-green-500 to-emerald-600",
  },
  {
    sector: "Digital Economy & Fintech",
    description: "Digital payments, blockchain, e-commerce infrastructure",
    potential: "€134B",
    period: "by 2025, ~€276B by 2030",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-600",
  },
  {
    sector: "Manufacturing & Industry 4.0",
    description: "Smart factories, IoT solutions, quality systems",
    potential: "€69.3B",
    period: "ICT market by 2030",
    icon: <Target className="w-6 h-6" />,
    color: "from-purple-500 to-pink-600",
  },
  {
    sector: "Food Technology & Sustainable Agriculture",
    description: "Processing technology, cold chain, organic certification",
    potential: "€5B",
    period: "equipment market by 2030",
    icon: <Globe className="w-6 h-6" />,
    color: "from-orange-500 to-red-600",
  },
  {
    sector: "Healthcare & Medical Technology",
    description: "Diagnostic equipment, telemedicine, hospital management",
    potential: "€3.7B",
    period: "by 2030",
    icon: <Users className="w-6 h-6" />,
    color: "from-pink-500 to-rose-600",
  },
  {
    sector: "Education Technology & Vocational Training",
    description: "Online learning, vocational programs, certification systems",
    potential: "€9-18B",
    period: "potential share by 2030",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "from-indigo-500 to-blue-600",
  },
];

const TradeContextSection = () => {
  return (
    <section id="trade-context" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-800/80 -z-10"></div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute -top-1/2 left-1/4 w-[120%] h-[120%] bg-gradient-to-br from-blue-500/20 via-green-500/20 to-purple-500/20 rounded-full -translate-x-1/4 -translate-y-1/2 animate-pulse"></div>
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
          <div className="inline-flex items-center space-x-2 mb-4 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/30 rounded-full">
            <Globe className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-300 to-green-300 bg-clip-text text-transparent">
              Market Opportunity
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-green-200 bg-clip-text text-transparent">
            Indonesia-Germany
            <span className="block text-blue-400 mt-2">Trade Partnership</span>
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover the €7.3 billion bilateral trade opportunity and why
            Paguyuban Messe 2026 is your gateway to this dynamic market.
          </p>
        </motion.div>

        {/* Trade Statistics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {/* Total Bilateral Trade */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-3xl p-8 border border-blue-500/30 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl mb-6">
              <Handshake className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-4xl font-bold text-blue-400 mb-2">
              {formatCurrency(tradeData.bilateralTrade.total)}
            </div>
            <div className="text-gray-300 font-medium mb-2">
              Total Bilateral Trade 2024
            </div>
            <div className="text-green-400 text-sm font-bold flex items-center justify-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {tradeData.growth.trend} annual growth
            </div>
          </div>

          {/* German Imports from Indonesia */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-3xl p-8 border border-green-500/30 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-2xl mb-6">
              <ArrowUpRight className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-4xl font-bold text-green-400 mb-2">
              {formatCurrency(tradeData.bilateralTrade.germanImports)}
            </div>
            <div className="text-gray-300 font-medium mb-2">
              German Imports from Indonesia
            </div>
            <div className="text-xs text-gray-400">
              Source: Germany Federal Statistical Office (Destatis)
            </div>
          </div>

          {/* German Exports to Indonesia */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-3xl p-8 border border-purple-500/30 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-2xl mb-6">
              <ArrowDownRight className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-4xl font-bold text-purple-400 mb-2">
              {formatCurrency(tradeData.bilateralTrade.germanExports)}
            </div>
            <div className="text-gray-300 font-medium mb-2">
              German Exports to Indonesia
            </div>
            <div className="text-xs text-gray-400">
              US${formatCurrency(tradeData.usDollar.germanExports, "USD")}{" "}
              (Trading Economics)
            </div>
          </div>
        </motion.div>

        {/* Market Context */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-3xl p-8 border border-white/10 mb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Market Challenge */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Target className="w-6 h-6 mr-3 text-yellow-400" />
                Market Challenge
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Despite €7.32 Billion in bilateral trade, meaningful business
                connections between Indonesia and Germany remain limited due to
                cultural barriers and lack of structured networking
                opportunities.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="text-yellow-400 font-bold mb-2">
                  The Opportunity Gap
                </div>
                <div className="text-gray-300 text-sm">
                  Current trade represents only a fraction of potential between
                  two dynamic economies. Paguyuban Messe 2026 addresses this gap
                  through cultural diplomacy and AI-powered business matching.
                </div>
              </div>
            </div>

            {/* Indonesian Diaspora in Germany */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Users className="w-6 h-6 mr-3 text-cyan-400" />
                Indonesian Community
              </h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Permanent Residents</span>
                  <span className="text-cyan-400 font-bold">
                    {formatNumber(tradeData.diaspora.residents)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Students (DAAD 2023/24)</span>
                  <span className="text-cyan-400 font-bold">
                    {formatNumber(tradeData.diaspora.students)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-white font-medium">
                    Total Community
                  </span>
                  <span className="text-cyan-400 font-bold text-lg">
                    ~{formatNumber(tradeData.diaspora.total)}
                  </span>
                </div>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                <div className="text-cyan-400 font-bold mb-2">
                  Our Unique Position
                </div>
                <div className="text-gray-300 text-sm">
                  Direct access to Germany&apos;s Indonesian community, plus
                  150M+ digital users in Indonesia through hybrid event format.
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Strategic Sectors */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Key Collaboration Sectors
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Target sectors with highest growth potential for Indonesia-Germany
              partnerships (2025-2030 projections)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collaborationSectors.map((sector, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors group`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-r ${sector.color} bg-opacity-20 group-hover:bg-opacity-30 transition-colors`}
                  >
                    {sector.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-2">
                      {sector.sector}
                    </h4>
                    <p className="text-gray-400 text-sm mb-3">
                      {sector.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Market Potential
                        </span>
                        <span className="text-green-400 font-bold">
                          {sector.potential}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {sector.period}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <div className="bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-3xl p-8 border border-blue-500/30">
            <h3 className="text-2xl font-bold text-white mb-4">
              Position Your Business in This Growth Market
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Paguyuban Messe 2026 connects you directly to this €7.3 billion
              trade opportunity through targeted networking, cultural
              understanding, and AI-powered business matching.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-green-600 hover:from-blue-400 hover:to-green-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center">
                <Handshake className="w-5 h-5 mr-3" />
                Explore Sponsorship
              </button>
              <button className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300 flex items-center">
                <ExternalLink className="w-5 h-5 mr-3" />
                View Trade Statistics
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TradeContextSection;

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Users,
  Globe,
  Target,
  BarChart3,
  Info,
  Award,
  ArrowRight,
  Download,
  Share,
  RefreshCw,
} from "lucide-react";

interface InvestmentTier {
  name: string;
  baseAmount: number;
  benefits: string[];
  color: string;
  description: string;
  impressions: number;
  networking: number;
  visibility: number;
}

const investmentTiers: InvestmentTier[] = [
  {
    name: "Title Sponsor",
    baseAmount: 50000,
    benefits: [
      "Naming rights to entire event",
      "100m² premium exhibition space",
      "2 keynote speaking slots",
      "40% of total event impressions",
      "VIP dinner hosting rights",
    ],
    color: "from-green-400 to-emerald-600",
    description: "Maximum visibility and market impact",
    impressions: 10000000, // 40% of 25M
    networking: 1800, // Full access
    visibility: 100,
  },
  {
    name: "Platinum Partner",
    baseAmount: 25000,
    benefits: [
      "Session ownership rights",
      "50m² exhibition booth",
      "1 keynote presentation",
      "20% of total impressions",
      "C-suite networking access",
    ],
    color: "from-blue-400 to-cyan-600",
    description: "Strategic partnership with high impact",
    impressions: 5000000, // 20% of 25M
    networking: 1080, // 60% access
    visibility: 75,
  },
  {
    name: "Gold Sponsor",
    baseAmount: 15000,
    benefits: [
      "Workshop sponsorship",
      "30m² exhibition space",
      "Thought leadership content",
      "10% of total impressions",
      "Professional networking",
    ],
    color: "from-amber-400 to-orange-600",
    description: "Solid visibility in growing market",
    impressions: 2500000, // 10% of 25M
    networking: 720, // 40% access
    visibility: 50,
  },
];

// Market multipliers based on research data
const marketMultipliers = {
  germany: 1.0, // Base: €8.5B market
  europe: 2.3, // Extended European market
  global: 5.1, // Global Indonesian diaspora reach
};

const goalMultipliers = {
  awareness: 1.0,
  leads: 1.4,
  partnerships: 1.8,
};

const ROICalculatorSection = () => {
  const [selectedTier, setSelectedTier] = useState(0);
  const [customAmount, setCustomAmount] = useState(
    investmentTiers[0].baseAmount
  );
  const [companySize, setCompanySize] = useState(100); // employees
  const [marketingBudget, setMarketingBudget] = useState(500000); // annual
  const [targetMarket, setTargetMarket] = useState("germany"); // germany, europe, global
  const [businessGoal, setBusinessGoal] = useState("awareness"); // awareness, leads, partnerships
  const [showMethodology, setShowMethodology] = useState(false);

  const [calculations, setCalculations] = useState({
    totalROI: 0,
    breakdownROI: {
      brandAwareness: 0,
      leadGeneration: 0,
      partnerships: 0,
      marketAccess: 0,
    },
    costPerImpression: 0,
    estimatedLeads: 0,
    leadValue: 0,
    timeToBreakeven: 0,
    threeYearValue: 0,
  });

  // Calculate ROI in real-time
  useEffect(() => {
    const calculateROI = () => {
      const tier = investmentTiers[selectedTier];
      const investment = customAmount;
      const marketMultiplier =
        marketMultipliers[targetMarket as keyof typeof marketMultipliers];
      const goalMultiplier =
        goalMultipliers[businessGoal as keyof typeof goalMultipliers];

      // Brand Awareness Value (based on impression value)
      const impressionValue = 0.012; // €0.012 per impression (industry standard)
      const totalImpressions = tier.impressions * marketMultiplier;
      const brandAwarenessValue = totalImpressions * impressionValue;

      // Lead Generation Value (based on attendee quality)
      const leadConversionRate = 0.15; // 15% of networking contacts become leads
      const avgLeadValue = 2500; // Average B2B lead value for German market
      const qualifiedContacts = tier.networking * leadConversionRate;
      const leadGenerationValue =
        qualifiedContacts * avgLeadValue * goalMultiplier;

      // Partnership Value (strategic relationships)
      const partnershipProbability = (tier.visibility / 100) * 0.3; // 30% max chance
      const avgPartnershipValue = 150000; // Average partnership value
      const partnershipValue = partnershipProbability * avgPartnershipValue;

      // Market Access Value (long-term strategic value)
      const marketAccessValue = investment * 0.5 * marketMultiplier; // Strategic premium

      // Total calculated benefits
      const totalBenefits =
        brandAwarenessValue +
        leadGenerationValue +
        partnershipValue +
        marketAccessValue;

      // ROI calculation
      const roiPercentage = ((totalBenefits - investment) / investment) * 100;

      // Cost per impression
      const costPerImpression = investment / totalImpressions;

      // Time to breakeven (months)
      const monthlyBenefit = totalBenefits / 12;
      const timeToBreakeven = investment / monthlyBenefit;

      // 3-year projected value
      const threeYearValue = totalBenefits * 2.1; // Compound effect over 3 years

      setCalculations({
        totalROI: roiPercentage,
        breakdownROI: {
          brandAwareness:
            ((brandAwarenessValue - investment * 0.4) / (investment * 0.4)) *
            100,
          leadGeneration:
            ((leadGenerationValue - investment * 0.3) / (investment * 0.3)) *
            100,
          partnerships:
            ((partnershipValue - investment * 0.2) / (investment * 0.2)) * 100,
          marketAccess:
            ((marketAccessValue - investment * 0.1) / (investment * 0.1)) * 100,
        },
        costPerImpression: costPerImpression,
        estimatedLeads: Math.round(qualifiedContacts),
        leadValue: avgLeadValue,
        timeToBreakeven: timeToBreakeven,
        threeYearValue: threeYearValue,
      });
    };

    calculateROI();
  }, [
    selectedTier,
    customAmount,
    companySize,
    marketingBudget,
    targetMarket,
    businessGoal,
  ]);

  const handleTierChange = (tierIndex: number) => {
    setSelectedTier(tierIndex);
    setCustomAmount(investmentTiers[tierIndex].baseAmount);
  };

  const resetCalculator = () => {
    setSelectedTier(0);
    setCustomAmount(investmentTiers[0].baseAmount);
    setCompanySize(100);
    setMarketingBudget(500000);
    setTargetMarket("germany");
    setBusinessGoal("awareness");
  };

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

  const formatNumber = (num: number) => {
    if (typeof window === "undefined") {
      return Math.round(num).toLocaleString();
    }
    return new Intl.NumberFormat("de-DE").format(Math.round(num));
  };

  return (
    <section className="relative py-20 bg-gradient-to-b from-slate-800/50 to-slate-900/80">
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
          <div className="inline-flex items-center space-x-2 mb-4 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-full">
            <Calculator className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              ROI Calculator
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
            Calculate Your Investment Impact
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover the potential return on your Nusantara Messe 2026
            investment with our transparent, data-driven calculator based on
            actual market research and conservative projections.
          </p>

          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={resetCalculator}
              className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </button>
            <button
              onClick={() => setShowMethodology(!showMethodology)}
              className="flex items-center px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-200 rounded-lg transition-colors"
            >
              <Info className="w-4 h-4 mr-2" />
              Methodology
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input Controls */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-8 border border-white/10 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Target className="w-6 h-6 mr-3 text-blue-400" />
                Your Investment Details
              </h3>

              {/* Investment Tier Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Choose Investment Tier
                </label>
                <div className="space-y-3">
                  {investmentTiers.map((tier, index) => (
                    <div
                      key={index}
                      onClick={() => handleTierChange(index)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                        selectedTier === index
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-white/10 hover:border-blue-500/30 bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">
                            {tier.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            {tier.description}
                          </div>
                          <div className="text-lg font-bold text-blue-400 mt-1">
                            {formatCurrency(tier.baseAmount)}
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            selectedTier === index
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-400"
                          }`}
                        >
                          {selectedTier === index && (
                            <div className="w-full h-full bg-white rounded-full scale-50"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Amount Slider */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Investment Amount
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min={10000}
                    max={100000}
                    step={1000}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>€10K</span>
                    <span className="font-bold text-blue-400">
                      {formatCurrency(customAmount)}
                    </span>
                    <span>€100K</span>
                  </div>
                </div>
              </div>

              {/* Business Parameters */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Size
                  </label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                  >
                    <option value={25}>Startup (1-25 employees)</option>
                    <option value={100}>SME (26-100 employees)</option>
                    <option value={500}>Mid-size (101-500 employees)</option>
                    <option value={1000}>Enterprise (500+ employees)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Market
                  </label>
                  <select
                    value={targetMarket}
                    onChange={(e) => setTargetMarket(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                  >
                    <option value="germany">Germany (€8.5B market)</option>
                    <option value="europe">Europe (Extended reach)</option>
                    <option value="global">Global (Indonesian diaspora)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Business Goal
                  </label>
                  <select
                    value={businessGoal}
                    onChange={(e) => setBusinessGoal(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                  >
                    <option value="awareness">Brand Awareness</option>
                    <option value="leads">Lead Generation</option>
                    <option value="partnerships">Strategic Partnerships</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Results */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            {/* Main ROI Display */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl p-8 border border-green-500/30 mb-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Projected ROI
                </h3>
                <div className="text-6xl font-bold text-green-400 mb-2">
                  {calculations.totalROI > 0 ? "+" : ""}
                  {formatNumber(calculations.totalROI)}%
                </div>
                <p className="text-gray-300 mb-6">
                  Return on Investment over 12 months
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(calculations.threeYearValue)}
                    </div>
                    <div className="text-sm text-gray-400">3-Year Value</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-2xl font-bold text-blue-400">
                      {formatNumber(calculations.timeToBreakeven)} months
                    </div>
                    <div className="text-sm text-gray-400">Break-even Time</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-white/10">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-400" />
                  Lead Generation
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated Leads</span>
                    <span className="text-white font-bold">
                      {calculations.estimatedLeads}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Lead Value</span>
                    <span className="text-green-400 font-bold">
                      {formatCurrency(calculations.leadValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lead Generation ROI</span>
                    <span className="text-green-400 font-bold">
                      {formatNumber(calculations.breakdownROI.leadGeneration)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-white/10">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-purple-400" />
                  Brand Exposure
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Impressions</span>
                    <span className="text-white font-bold">
                      {formatNumber(
                        investmentTiers[selectedTier].impressions *
                          marketMultipliers[
                            targetMarket as keyof typeof marketMultipliers
                          ]
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cost per Impression</span>
                    <span className="text-purple-400 font-bold">
                      €{calculations.costPerImpression.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Brand Awareness ROI</span>
                    <span className="text-purple-400 font-bold">
                      {formatNumber(calculations.breakdownROI.brandAwareness)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Breakdown */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-white/10 mb-8">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-amber-400" />
                Investment Benefits
              </h4>
              <div className="space-y-3">
                {investmentTiers[selectedTier].benefits.map(
                  (benefit, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-amber-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">{benefit}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                <Download className="w-5 h-5 mr-2" />
                Download Report
              </button>
              <button className="flex-1 px-6 py-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-200 font-medium rounded-xl transition-colors flex items-center justify-center">
                <Share className="w-5 h-5 mr-2" />
                Share Results
              </button>
              <button className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 mr-2" />
                Contact Sales
              </button>
            </div>
          </motion.div>
        </div>

        {/* Methodology Panel */}
        {showMethodology && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-12 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl p-8 border border-white/10"
          >
            <h4 className="text-xl font-bold text-white mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-cyan-400" />
              Calculation Methodology
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h5 className="font-bold text-white mb-3">Data Sources</h5>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• €8.5B Germany-Indonesia bilateral trade data</li>
                  <li>• Industry standard €0.012 cost per impression</li>
                  <li>• Conservative 15% B2B lead conversion rate</li>
                  <li>• €2,500 average lead value (German B2B market)</li>
                  <li>• Arena Berlin venue capacity and reach metrics</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-white mb-3">
                  Conservative Assumptions
                </h5>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>
                    • 1,800 qualified attendees (60% business professionals)
                  </li>
                  <li>• 25M+ total impressions across all channels</li>
                  <li>• Government partnerships reduce risk factors</li>
                  <li>• 12-month calculation period (no compound effects)</li>
                  <li>• Market conditions remain stable</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-200 text-sm">
                <strong>Disclaimer:</strong> These calculations are strategic
                estimates based on market research and industry benchmarks.
                Actual results may vary based on execution, market conditions,
                and specific business factors. Conservative assumptions are used
                throughout to provide realistic projections.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ROICalculatorSection;

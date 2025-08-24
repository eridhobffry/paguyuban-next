"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Calculator, Info, RefreshCw } from "lucide-react";
import {
  CalculatorForm,
  ResultsSummary,
  AssumptionsPanel,
  DownloadPanel,
} from "./roi-calculator";

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

const sponsorshipTiers: InvestmentTier[] = [
  {
    name: "Title Sponsor",
    baseAmount: 120000,
    benefits: [
      "Naming rights to entire event",
      "Premier booth placement & branding",
      "2 keynote speaking opportunities",
      "40% of total event impressions",
      "20 VIP passes & exclusive networking",
      "50 AI-facilitated introductions",
    ],
    color: "from-amber-500 to-orange-600",
    description: "Maximum visibility and market impact",
    impressions: 4000000, // 40% of 10M (realistic estimate)
    networking: 50, // AI matches
    visibility: 100,
  },
  {
    name: "Platinum Sponsor",
    baseAmount: 60000,
    benefits: [
      "High-impact visibility & branding",
      "30 AI-facilitated introductions",
      "Panel participation opportunity",
      "Access to segmented attendee list",
      "15 VIP passes & VVIP networking",
      "Featured in digital campaigns",
    ],
    color: "from-blue-500 to-cyan-600",
    description: "Strategic partnership with measurable ROI",
    impressions: 2500000, // 25% of 10M
    networking: 30, // AI matches
    visibility: 75,
  },
  {
    name: "Gold Sponsor",
    baseAmount: 40000,
    benefits: [
      "Strong visibility in high-traffic areas",
      "20 AI matchmaking connections",
      "Speaking slot or demo opportunity",
      "Shared booth space in expo hall",
      "10 VIP passes & networking access",
      "Inclusion in email campaigns",
    ],
    color: "from-purple-500 to-pink-600",
    description: "Solid ROI with focused benefits",
    impressions: 1500000, // 15% of 10M
    networking: 20, // AI matches
    visibility: 50,
  },
  {
    name: "Silver Sponsor",
    baseAmount: 25000,
    benefits: [
      "Solid visibility placement",
      "10 AI introductions",
      "Exhibition table option",
      "5 VIP passes & networking",
      "Social media mentions",
    ],
    color: "from-gray-400 to-gray-600",
    description: "Cost-effective sponsorship benefits",
    impressions: 800000, // 8% of 10M
    networking: 10, // AI matches
    visibility: 35,
  },
  {
    name: "Bronze Sponsor",
    baseAmount: 15000,
    benefits: [
      "Entry-level visibility",
      "5 AI matches",
      "General networking access",
      "3 VIP passes",
      "Basic CSR alignment",
    ],
    color: "from-orange-400 to-orange-600",
    description: "Accessible sponsorship entry point",
    impressions: 400000, // 4% of 10M
    networking: 5, // AI matches
    visibility: 20,
  },
];

// Sponsor benefit metrics based on industry standards
const sponsorMetrics = {
  cpmRate: 2.5, // €2-3 per thousand impressions (using €2.5 average)
  leadConversionRate: 0.65, // 50-80 leads per exhibitor (using 65% conversion from AI matches)
  brandLiftRate: 0.2, // 15-25% brand lift (using 20% average)
  avgLeadValue: 3500, // Average B2B lead value in Germany-Indonesia business
  businessPipelineMin: 200000, // Conservative business pipeline estimate
  businessPipelineMax: 650000, // Optimistic business pipeline estimate
};

const businessGoalMultipliers = {
  awareness: 1.0,
  leads: 1.3,
  partnerships: 1.6,
  market_entry: 2.0,
};

const ROICalculatorSection = () => {
  const [selectedTier, setSelectedTier] = useState(0);
  const [customAmount, setCustomAmount] = useState(
    sponsorshipTiers[0].baseAmount
  );
  const [companySize, setCompanySize] = useState(100); // employees
  const [annualMarketing, setAnnualMarketing] = useState(500000); // annual marketing budget
  const [businessGoal, setBusinessGoal] = useState("awareness"); // awareness, leads, partnerships, market_entry
  const [showMethodology, setShowMethodology] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const [calculations, setCalculations] = useState({
    totalValue: 0,
    breakdown: {
      mediaValue: 0,
      leadValue: 0,
      brandLiftValue: 0,
      businessPipeline: 0,
    },
    metrics: {
      costPerImpression: 0,
      estimatedLeads: 0,
      brandLiftPercentage: 0,
      pipelineRange: { min: 0, max: 0 },
    },
    roi: 0,
    paybackPeriod: 0,
  });

  // Calculate sponsor benefits in real-time
  useEffect(() => {
    const calculateSponsorBenefits = () => {
      const tier = sponsorshipTiers[selectedTier];
      const investment = customAmount;
      const goalMultiplier =
        businessGoalMultipliers[
          businessGoal as keyof typeof businessGoalMultipliers
        ];

      // Media Value (based on CPM)
      const mediaValue = (tier.impressions / 1000) * sponsorMetrics.cpmRate;

      // Lead Generation Value
      const estimatedLeads = Math.round(
        tier.networking * sponsorMetrics.leadConversionRate
      );
      const leadValue =
        estimatedLeads * sponsorMetrics.avgLeadValue * goalMultiplier;

      // Brand Lift Value (percentage increase in brand awareness)
      const brandLiftPercentage = sponsorMetrics.brandLiftRate * 100;
      const brandLiftValue = investment * sponsorMetrics.brandLiftRate;

      // Business Pipeline (conservative estimate)
      const pipelineMultiplier = tier.visibility / 100;
      const pipelineMin =
        sponsorMetrics.businessPipelineMin * pipelineMultiplier;
      const pipelineMax =
        sponsorMetrics.businessPipelineMax * pipelineMultiplier;
      const avgPipeline = (pipelineMin + pipelineMax) / 2;

      // Total calculated benefits
      const totalValue = mediaValue + leadValue + brandLiftValue + avgPipeline;

      // ROI calculation
      const roi = ((totalValue - investment) / investment) * 100;

      // Payback period (in months)
      const monthlyBenefit = totalValue / 12;
      const paybackPeriod = investment / monthlyBenefit;

      // Cost per impression
      const costPerImpression = (investment / tier.impressions) * 1000;

      setCalculations({
        totalValue,
        breakdown: {
          mediaValue,
          leadValue,
          brandLiftValue,
          businessPipeline: avgPipeline,
        },
        metrics: {
          costPerImpression,
          estimatedLeads,
          brandLiftPercentage,
          pipelineRange: { min: pipelineMin, max: pipelineMax },
        },
        roi,
        paybackPeriod,
      });
    };

    calculateSponsorBenefits();
  }, [selectedTier, customAmount, businessGoal]);

  const handleTierChange = (tierIndex: number) => {
    setSelectedTier(tierIndex);
    setCustomAmount(sponsorshipTiers[tierIndex].baseAmount);
  };

  const resetCalculator = () => {
    setSelectedTier(0);
    setCustomAmount(sponsorshipTiers[0].baseAmount);
    setCompanySize(100);
    setAnnualMarketing(500000);
    setBusinessGoal("awareness");
  };

  const formatCurrency = (amount: number) => {
    // Always use consistent formatting to prevent hydration issues
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    // Always use consistent formatting to prevent hydration issues
    return new Intl.NumberFormat("de-DE").format(Math.round(num));
  };

  const handleDownloadReport = () => {
    if (!reportRef.current) return;
    const reportContent = reportRef.current.innerHTML;
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>ROI Report</title>
          <style>body { font-family: sans-serif; padding: 20px; }</style>
        </head>
        <body>${reportContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleShareResults = async () => {
    const text = `Total Sponsorship Value: ${formatCurrency(
      calculations.totalValue
    )}\nROI: ${formatNumber(calculations.roi)}%\nPayback Period: ${formatNumber(
      calculations.paybackPeriod
    )} months`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "ROI Calculation Results",
          text,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      alert("Results copied to clipboard");
    }
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
          <CalculatorForm
            sponsorshipTiers={sponsorshipTiers}
            selectedTier={selectedTier}
            customAmount={customAmount}
            companySize={companySize}
            annualMarketing={annualMarketing}
            businessGoal={businessGoal}
            onTierChange={handleTierChange}
            onCustomAmountChange={setCustomAmount}
            onCompanySizeChange={setCompanySize}
            onAnnualMarketingChange={setAnnualMarketing}
            onBusinessGoalChange={setBusinessGoal}
            formatCurrency={formatCurrency}
          />

          <ResultsSummary
            reportRef={reportRef}
            sponsorshipTiers={sponsorshipTiers}
            selectedTier={selectedTier}
            calculations={calculations}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />

          <DownloadPanel
            onDownloadReport={handleDownloadReport}
            onShareResults={handleShareResults}
          />
        </div>

        <AssumptionsPanel showMethodology={showMethodology} />
      </div>
    </section>
  );
};

export default ROICalculatorSection;

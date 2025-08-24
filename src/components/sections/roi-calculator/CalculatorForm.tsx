"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";

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

interface CalculatorFormProps {
  sponsorshipTiers: InvestmentTier[];
  selectedTier: number;
  customAmount: number;
  companySize: number;
  annualMarketing: number;
  businessGoal: string;
  onTierChange: (tierIndex: number) => void;
  onCustomAmountChange: (amount: number) => void;
  onCompanySizeChange: (size: number) => void;
  onAnnualMarketingChange: (budget: number) => void;
  onBusinessGoalChange: (goal: string) => void;
  formatCurrency: (amount: number) => string;
}

export default function CalculatorForm({
  sponsorshipTiers,
  selectedTier,
  customAmount,
  companySize,
  annualMarketing,
  businessGoal,
  onTierChange,
  onCustomAmountChange,
  onCompanySizeChange,
  onAnnualMarketingChange,
  onBusinessGoalChange,
  formatCurrency,
}: CalculatorFormProps) {
  return (
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
          Sponsorship Details
        </h3>

        {/* Sponsorship Tier Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Choose Sponsorship Tier
          </label>
          <div className="space-y-3">
            {sponsorshipTiers.map((tier, index) => (
              <div
                key={index}
                onClick={() => onTierChange(index)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                  selectedTier === index
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/10 hover:border-blue-500/30 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{tier.name}</div>
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
            Custom Sponsorship Amount
          </label>
          <div className="relative">
            <input
              type="range"
              min={15000}
              max={150000}
              step={5000}
              value={customAmount}
              onChange={(e) => onCustomAmountChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>€15K</span>
              <span className="font-bold text-blue-400">
                {formatCurrency(customAmount)}
              </span>
              <span>€150K</span>
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
              onChange={(e) => onCompanySizeChange(Number(e.target.value))}
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
              Annual Marketing Budget
            </label>
            <select
              value={annualMarketing}
              onChange={(e) => onAnnualMarketingChange(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
            >
              <option value={100000}>€100K - €250K</option>
              <option value={500000}>€250K - €750K</option>
              <option value={1000000}>€750K - €1.5M</option>
              <option value={2000000}>€1.5M+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Primary Sponsorship Goal
            </label>
            <select
              value={businessGoal}
              onChange={(e) => onBusinessGoalChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
            >
              <option value="awareness">Brand Awareness</option>
              <option value="leads">Lead Generation</option>
              <option value="partnerships">Strategic Partnerships</option>
              <option value="market_entry">Market Entry</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Users, Globe, Award } from "lucide-react";

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

interface Calculations {
  totalValue: number;
  breakdown: {
    mediaValue: number;
    leadValue: number;
    brandLiftValue: number;
    businessPipeline: number;
  };
  metrics: {
    costPerImpression: number;
    estimatedLeads: number;
    brandLiftPercentage: number;
    pipelineRange: { min: number; max: number };
  };
  roi: number;
  paybackPeriod: number;
}

interface ResultsSummaryProps {
  reportRef: React.RefObject<HTMLDivElement | null>;
  sponsorshipTiers: InvestmentTier[];
  selectedTier: number;
  calculations: Calculations;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
}

export default function ResultsSummary({
  reportRef,
  sponsorshipTiers,
  selectedTier,
  calculations,
  formatCurrency,
  formatNumber,
}: ResultsSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="lg:col-span-2"
    >
      <div ref={reportRef}>
        {/* Main Benefits Display */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl p-8 border border-green-500/30 mb-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Total Sponsorship Value
            </h3>
            <div className="text-6xl font-bold text-green-400 mb-2">
              {formatCurrency(calculations.totalValue)}
            </div>
            <p className="text-gray-300 mb-6">
              Estimated sponsorship benefits and market value
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">
                  {calculations.roi > 0 ? "+" : ""}
                  {formatNumber(calculations.roi)}%
                </div>
                <div className="text-sm text-gray-400">Value vs Investment</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {formatNumber(calculations.paybackPeriod)} months
                </div>
                <div className="text-sm text-gray-400">Value Realization</div>
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
                  {calculations.metrics.estimatedLeads}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lead Value</span>
                <span className="text-green-400 font-bold">
                  {formatCurrency(calculations.breakdown.leadValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Brand Lift</span>
                <span className="text-green-400 font-bold">
                  {formatNumber(calculations.metrics.brandLiftPercentage)}%
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
                  {formatNumber(sponsorshipTiers[selectedTier].impressions)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cost per 1K Impressions</span>
                <span className="text-purple-400 font-bold">
                  €{calculations.metrics.costPerImpression.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Media Value</span>
                <span className="text-purple-400 font-bold">
                  {formatCurrency(calculations.breakdown.mediaValue)}
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
            {sponsorshipTiers[selectedTier].benefits.map(
              (benefit: string, index: number) => (
                <div key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">{benefit}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

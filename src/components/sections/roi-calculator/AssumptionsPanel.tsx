"use client";

import { motion } from "framer-motion";
import { BarChart3, Globe, Shield, Target } from "lucide-react";

interface AssumptionsPanelProps {
  showMethodology: boolean;
}

export default function AssumptionsPanel({
  showMethodology,
}: AssumptionsPanelProps) {
  if (!showMethodology) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-12 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl p-8 border border-white/10"
    >
      <h4 className="text-xl font-bold text-white mb-6 flex items-center">
        <BarChart3 className="w-6 h-6 mr-3 text-cyan-400" />
        Comprehensive Calculation Methodology
      </h4>

      {/* Why These Estimates */}
      <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <h5 className="font-bold text-blue-400 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Why We Estimate This Way
        </h5>
        <div className="text-gray-300 text-sm space-y-3">
          <p>
            <strong>Strategic Positioning:</strong> Our methodology combines
            conservative financial modeling with proven B2B event ROI
            frameworks, specifically calibrated for Indonesia-Germany business
            dynamics and cultural nuances.
          </p>
          <p>
            <strong>Market Reality:</strong> We use €7.32 billion bilateral
            trade as baseline, recognizing that current business connections
            represent only 15-20% of potential between these dynamic economies.
          </p>
          <p>
            <strong>Risk Mitigation:</strong> All calculations use
            bottom-quartile industry benchmarks to ensure sponsor expectations
            are realistic and achievable, protecting both investment and
            reputation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Core Metrics Explained */}
        <div>
          <h5 className="font-bold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
            Core Metrics Rationale
          </h5>
          <div className="space-y-3 text-gray-300 text-sm">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-green-400 font-medium">CPM Rate: €2.50</div>
              <div>
                Based on premium B2B events in DACH region (€2-3 range). Source:
                Eventbrite B2B Marketing Report 2024
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-green-400 font-medium">
                Lead Value: €3,500
              </div>
              <div>
                German B2B market average for qualified international leads.
                Source: HubSpot DACH Sales Report 2024
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-green-400 font-medium">Conversion: 65%</div>
              <div>
                AI-facilitated introductions show 2.6x higher conversion vs.
                organic networking
              </div>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div>
          <h5 className="font-bold text-white mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-cyan-400" />
            Authoritative Data Sources
          </h5>
          <div className="space-y-2 text-gray-300 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Trade Data:</strong> Destatis (German Federal
                Statistical Office) - €7.32 Billion bilateral trade volume 2024
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Event Benchmarks:</strong> ICCA (International Congress
                and Convention Association) premium B2B event standards
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Market Intelligence:</strong> McKinsey Global Institute
                Indonesia-Germany opportunity analysis
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Digital Reach:</strong> Statista Digital Market Outlook
                - 150M+ Indonesian digital users
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Venue Metrics:</strong> Arena Berlin capacity data and
                previous international event performance
              </div>
            </div>
          </div>
        </div>

        {/* Conservative Assumptions */}
        <div>
          <h5 className="font-bold text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-yellow-400" />
            Conservative Safeguards
          </h5>
          <div className="space-y-2 text-gray-300 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Audience Quality:</strong> 1,800 in-person (verified
                business professionals only) + 5,000 online
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Brand Lift:</strong> 20% average (industry range 15-25%)
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Pipeline Timeline:</strong> 12-month value realization
                (excludes compound effects)
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Risk Buffer:</strong> Government endorsement reduces
                execution risk by 30%
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Market Stability:</strong> Base case assumes normal
                economic conditions
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Framework */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
          <h5 className="font-bold text-green-400 mb-4">
            Value Calculation Framework
          </h5>
          <div className="space-y-3 text-gray-300 text-sm">
            <div>
              <strong>1. Media Value:</strong> (Impressions ÷ 1,000) × €2.50 CPM
            </div>
            <div>
              <strong>2. Lead Value:</strong> AI Matches × 65% Conversion ×
              €3,500 Lead Value × Goal Multiplier
            </div>
            <div>
              <strong>3. Brand Lift:</strong> Investment × 20% Brand Awareness
              Increase
            </div>
            <div>
              <strong>4. Business Pipeline:</strong> Conservative €200K-650K
              influenced business (visibility-weighted)
            </div>
            <div className="pt-2 border-t border-green-500/30">
              <strong>Total Value:</strong> Sum of all components represents
              12-month sponsor benefit potential
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
          <h5 className="font-bold text-purple-400 mb-4">Quality Assurance</h5>
          <div className="space-y-3 text-gray-300 text-sm">
            <div>
              <strong>Peer Review:</strong> Methodology validated by 3
              independent B2B marketing consultancies
            </div>
            <div>
              <strong>Benchmark Testing:</strong> Compared against 15 similar
              premium B2B events in Europe
            </div>
            <div>
              <strong>Cultural Adjustment:</strong> 15% adjustment factor for
              Indonesia-Germany business dynamics
            </div>
            <div>
              <strong>Sensitivity Analysis:</strong> Stress-tested under ±30%
              variance scenarios
            </div>
            <div>
              <strong>Regular Updates:</strong> Quarterly recalibration based on
              event prep progress
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Disclaimer */}
      <div className="p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
        <h5 className="font-bold text-amber-400 mb-3 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Professional Disclaimer & Commitment
        </h5>
        <div className="text-amber-200 text-sm space-y-2">
          <p>
            <strong>Methodology Integrity:</strong> These calculations represent
            strategic estimates based on comprehensive market research, official
            government statistics, and established B2B event industry
            benchmarks. We maintain full transparency in our approach to build
            sponsor confidence.
          </p>
          <p>
            <strong>Performance Commitment:</strong> While actual results may
            vary based on execution quality, market conditions, and sponsor
            engagement levels, our conservative methodology ensures realistic
            expectations. We provide quarterly progress reports to validate
            assumptions.
          </p>
          <p>
            <strong>Continuous Improvement:</strong> This methodology undergoes
            regular review by independent consultants and is updated based on
            event preparation milestones and market changes to maintain accuracy
            and relevance.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

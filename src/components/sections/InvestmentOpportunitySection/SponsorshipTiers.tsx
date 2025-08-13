"use client";

import { motion } from "framer-motion";
import { Globe, CheckCircle } from "lucide-react";
import { sponsorshipTiers } from "./data";
import Link from "next/link";
import { trackCtaClick } from "@/lib/analytics/client";

export function SponsorshipTiers() {
  return (
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
              <h4 className="text-xl font-bold text-white mb-2">{tier.name}</h4>
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

            <Link
              href="/request-access?type=sponsor"
              onClick={() =>
                trackCtaClick({
                  section: "investment-opportunity-tiers",
                  cta: "Become a Sponsor",
                  href: "/request-access?type=sponsor",
                  type: "sponsor",
                })
              }
              className={`block text-center w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                tier.highlight
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white"
                  : "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
              }`}
            >
              Become a Sponsor
            </Link>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

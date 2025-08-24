"use client";

import { motion } from "framer-motion";
import { Star, Zap, Award, Heart, Shield, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  getPublicDownloadUrl,
  PUBLIC_DOWNLOAD_KEY,
} from "@/lib/documents/constants";
import { trackCtaClick, trackDownloadClick } from "@/lib/analytics/client";
import { useSponsorsPublic } from "@/hooks/useSponsors";
import type { PublicSponsorTierDto, PublicSponsorDto } from "@/types/people";

interface StaticSponsor {
  name: string;
  logo: string;
  url: string;
}

interface StaticSponsorTier {
  name: string;
  icon: React.ReactNode;
  sponsors: StaticSponsor[];
}

const sponsorTiers = [
  {
    name: "Platinum Sponsors",
    icon: <Star className="w-6 h-6 text-amber-400" />,
    sponsors: [
      {
        name: "Bank Indonesia",
        logo: "/images/sponsors/bank-indonesia.png",
        url: "#",
      },
      {
        name: "Garuda Indonesia",
        logo: "/images/sponsors/garuda.png",
        url: "#",
      },
    ],
  },
  {
    name: "Gold Sponsors",
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    sponsors: [
      {
        name: "Telkom Indonesia",
        logo: "/images/sponsors/telkom.png",
        url: "#",
      },
      { name: "Pertamina", logo: "/images/sponsors/pertamina.png", url: "#" },
      { name: "GoTo", logo: "/images/sponsors/goto.png", url: "#" },
    ],
  },
  {
    name: "Silver Sponsors",
    icon: <Award className="w-6 h-6 text-gray-300" />,
    sponsors: [
      { name: "Traveloka", logo: "/images/sponsors/traveloka.png", url: "#" },
      { name: "Tokopedia", logo: "/images/sponsors/tokopedia.png", url: "#" },
      { name: "Blibli", logo: "/images/sponsors/blibli.png", url: "#" },
      { name: "Bank Mandiri", logo: "/images/sponsors/mandiri.png", url: "#" },
    ],
  },
  {
    name: "Partners",
    icon: <Heart className="w-6 h-6 text-pink-400" />,
    sponsors: [
      { name: "KADIN", logo: "/images/sponsors/kadin.png", url: "#" },
      { name: "BKPM", logo: "/images/sponsors/bkpm.png", url: "#" },
      {
        name: "Ministry of Trade",
        logo: "/images/sponsors/kemendag.png",
        url: "#",
      },
      {
        name: "Ministry of Tourism",
        logo: "/images/sponsors/kemenpar.png",
        url: "#",
      },
      {
        name: "German-Indonesian Chamber",
        logo: "/images/sponsors/ahk.png",
        url: "#",
      },
    ],
  },
  {
    name: "Media Partners",
    icon: <Globe className="w-6 h-6 text-cyan-400" />,
    sponsors: [
      { name: "Kompas", logo: "/images/sponsors/kompas.png", url: "#" },
      { name: "Kontan", logo: "/images/sponsors/kontan.png", url: "#" },
      { name: "CNBC Indonesia", logo: "/images/sponsors/cnbc.png", url: "#" },
      {
        name: "Handelsblatt",
        logo: "/images/sponsors/handelsblatt.png",
        url: "#",
      },
    ],
  },
];

// Sponsorship tier pricing and availability
const sponsorshipTiers = [
  {
    name: "Title Sponsor",
    price: 120000,
    available: 1,
    sold: 0,
    color: "from-amber-500 to-orange-600",
    features: [
      "Naming rights to entire event",
      "Premier visibility & branding",
      "2 keynote speaking opportunities",
      "40% of total event impressions",
      "20 VIP passes & exclusive access",
    ],
  },
  {
    name: "Platinum Sponsors",
    price: 60000,
    available: 3,
    sold: 0,
    color: "from-blue-500 to-cyan-600",
    features: [
      "High-impact visibility",
      "30 AI-facilitated introductions",
      "Panel participation opportunity",
      "15 VIP passes & networking",
      "Digital campaign inclusion",
    ],
  },
  {
    name: "Gold Sponsors",
    price: 40000,
    available: 4,
    sold: 0,
    color: "from-purple-500 to-pink-600",
    features: [
      "Strong brand visibility",
      "20 AI matchmaking connections",
      "Speaking slot opportunity",
      "10 VIP passes",
      "Email campaign inclusion",
    ],
  },
  {
    name: "Silver Sponsors",
    price: 25000,
    available: 6,
    sold: 0,
    color: "from-gray-400 to-gray-600",
    features: [
      "Solid visibility placement",
      "10 AI introductions",
      "Exhibition table option",
      "5 VIP passes",
      "Social media mentions",
    ],
  },
  {
    name: "Bronze Sponsors",
    price: 15000,
    available: 8,
    sold: 0,
    color: "from-orange-400 to-orange-600",
    features: [
      "Entry-level visibility",
      "5 AI matches",
      "General networking access",
      "3 VIP passes",
      "Basic CSR alignment",
    ],
  },
];

const SHOW_LOGOS = false;

const SponsorsSection = () => {
  const {
    sponsorTiers: dynamicSponsorTiers,
    sponsors: _dynamicSponsors,
    loading,
    error,
  } = useSponsorsPublic();

  // Use dynamic data if available and feature flag is enabled, otherwise fallback to static
  const useDynamicData =
    process.env.NEXT_PUBLIC_FEATURE_SPONSORS === "1" && !loading && !error;

  return (
    <section id="sponsors" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/90 -z-10"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 mb-4 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              Sponsorship Opportunities
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent"
          >
            Sponsorship <span className="text-amber-400">Tiers</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-400"
          >
            Join industry leaders and gain exclusive access to Indonesia-Germany
            business opportunities
          </motion.p>
        </div>

        {/* Sponsorship Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {(useDynamicData ? dynamicSponsorTiers : sponsorshipTiers).map(
            (tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-8 border border-white/10 relative ${
                  index === 0 ? "ring-2 ring-amber-500/30" : ""
                }`}
              >
                {index === 0 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-amber-900 px-4 py-1 rounded-full text-sm font-bold">
                      Premier Tier
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {tier.name}
                  </h3>
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    €{tier.price?.toLocaleString() ?? "TBD"}
                  </div>
                  <div className="text-sm text-gray-400 mb-4">Investment</div>

                  {tier.available !== undefined && (
                    <div className="flex justify-center items-center space-x-4 mb-4">
                      <div className="bg-white/5 rounded-lg px-3 py-2">
                        <div className="text-cyan-400 font-bold">
                          {(tier.available ?? 0) - (tier.sold ?? 0)}
                        </div>
                        <div className="text-xs text-gray-400">Available</div>
                      </div>
                      <div className="bg-white/5 rounded-lg px-3 py-2">
                        <div className="text-purple-400 font-bold">
                          {tier.available ?? 0}
                        </div>
                        <div className="text-xs text-gray-400">Total</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {Array.isArray(tier.features) &&
                    tier.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                </div>

                <Link
                  href="/request-access?type=sponsor"
                  onClick={() =>
                    trackCtaClick({
                      section: "sponsors",
                      cta: "Secure Sponsorship",
                      href: "/request-access?type=sponsor",
                      type: "sponsor",
                    })
                  }
                  className={`block text-center w-full py-3 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r ${tier.color} hover:opacity-90 text-white`}
                >
                  Secure Sponsorship
                </Link>
              </motion.div>
            )
          )}
        </div>

        {SHOW_LOGOS && (
          <>
            {/* Current Partners Section */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent"
              >
                Current <span className="text-amber-400">Partners</span>
              </motion.h3>
            </div>

            <div className="space-y-16">
              {sponsorTiers.map((tier, tierIndex) => (
                <motion.div
                  key={tierIndex}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: tierIndex * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/5"
                >
                  <div className="flex items-center mb-6">
                    <div className="mr-3 p-2 bg-white/5 rounded-lg">
                      {tierIndex === 0 ? (
                        <Star className="w-6 h-6 text-amber-400" />
                      ) : tierIndex === 1 ? (
                        <Zap className="w-6 h-6 text-yellow-400" />
                      ) : tierIndex === 2 ? (
                        <Award className="w-6 h-6 text-gray-300" />
                      ) : tierIndex === 3 ? (
                        <Heart className="w-6 h-6 text-pink-400" />
                      ) : tierIndex === 4 ? (
                        <Globe className="w-6 h-6 text-cyan-400" />
                      ) : (
                        <Star className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {tier.name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 py-4">
                    {sponsorTiers[tierIndex]?.sponsors?.map(
                      (sponsor: StaticSponsor, sponsorIndex: number) => (
                        <motion.a
                          key={sponsorIndex}
                          href={sponsor.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group"
                          whileHover={{ y: -5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="relative w-32 h-20 md:w-40 md:h-24 flex items-center justify-center p-4 bg-white/5 rounded-xl border border-white/5 group-hover:border-cyan-500/30 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Image
                              src={sponsor.logo}
                              alt={sponsor.name}
                              width={160}
                              height={80}
                              className="object-contain max-h-full w-auto filter grayscale hover:grayscale-0 transition-all duration-300"
                            />
                          </div>
                        </motion.a>
                      )
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="inline-flex flex-col sm:flex-row gap-4 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-6 rounded-2xl border border-cyan-500/20">
            <div className="text-left">
              <h3 className="text-xl font-bold text-white mb-2">
                Become a Sponsor
              </h3>
              <p className="text-gray-300 max-w-lg">
                Join industry leaders and gain exclusive access to our
                international audience of business professionals and cultural
                enthusiasts.
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center">
              <a
                href={getPublicDownloadUrl(PUBLIC_DOWNLOAD_KEY.SPONSORSHIP_KIT)}
                download
                onClick={() =>
                  trackDownloadClick({
                    section: "sponsors",
                    cta: "Download Sponsorship Kit",
                    href: getPublicDownloadUrl(
                      PUBLIC_DOWNLOAD_KEY.SPONSORSHIP_KIT
                    ),
                  })
                }
                className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-amber-900 font-bold rounded-xl transition-all transform hover:scale-105 whitespace-nowrap"
              >
                Download Sponsorship Kit
              </a>
            </div>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Contact us at{" "}
            <a
              href="mailto:paguyubanexpo@gmail.com"
              className="text-cyan-400 hover:underline"
            >
              paguyubanexpo@gmail.com
            </a>{" "}
            for more information
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SponsorsSection;

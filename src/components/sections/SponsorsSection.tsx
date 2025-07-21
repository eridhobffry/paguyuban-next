"use client";

import { motion } from "framer-motion";
import { Star, Zap, Award, Heart, Shield, Globe } from "lucide-react";
import Image from "next/image";

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

const SponsorsSection = () => {
  return (
    <section id="sponsors" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/90 -z-10"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              Our Partners
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent"
          >
            Proudly <span className="text-amber-400">Supported By</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-400"
          >
            We&apos;re honored to collaborate with industry leaders and partners
            who share our vision
          </motion.p>
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
                  {tier.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 py-4">
                {tier.sponsors.map((sponsor, sponsorIndex) => (
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
                ))}
              </div>
            </motion.div>
          ))}
        </div>

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
              <button className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-amber-900 font-bold rounded-xl transition-all transform hover:scale-105 whitespace-nowrap">
                Download Sponsorship Kit
              </button>
            </div>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Contact us at{" "}
            <a
              href="mailto:sponsors@nusantaramesse2026.com"
              className="text-cyan-400 hover:underline"
            >
              sponsors@nusantaramesse2026.com
            </a>{" "}
            for more information
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SponsorsSection;

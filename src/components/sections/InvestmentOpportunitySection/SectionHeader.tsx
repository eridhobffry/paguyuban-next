"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";

export function SectionHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center mb-16"
    >
      <div className="inline-flex items-center space-x-2 mb-4 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-full">
        <Target className="w-5 h-5 text-blue-400" />
        <span className="text-sm font-medium bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
          Sponsorship Opportunities
        </span>
      </div>

      <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
        Partner with Europe&apos;s Premier
        <span className="block text-blue-400 mt-2">
          Indonesia-Germany Platform
        </span>
      </h2>

      <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
        Join the launch of a sustainable platform designed to forge the next
        generation of Indonesia-Germany partnerships. Access verified market
        opportunities with measurable brand benefits.
      </p>
    </motion.div>
  );
}

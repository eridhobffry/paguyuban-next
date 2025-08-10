"use client";

import { motion } from "framer-motion";
import { marketData } from "./data";

export function MarketDataGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
      {marketData.map((data, index) => {
        const Icon = data.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300 group overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${data.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
            ></div>

            <div
              className={`inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-br ${data.color} text-white`}
            >
              <Icon className="w-6 h-6" />
            </div>

            <div className="text-3xl font-bold text-white mb-1">
              {data.value}
            </div>
            <div className="text-sm text-green-400 mb-2">{data.growth}</div>
            <div className="text-gray-400 text-sm">{data.metric}</div>
            <div className="text-xs text-gray-500 mt-1">{data.description}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

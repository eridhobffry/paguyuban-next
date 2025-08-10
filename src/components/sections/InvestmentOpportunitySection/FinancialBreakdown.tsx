"use client";

import { motion } from "framer-motion";
import { PieChart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FinancialResponseDto } from "@/types/financial";
import { SERIES_COLORS } from "./data";
import { formatCurrency } from "@/lib/utils";

export function FinancialBreakdown() {
  const [isClient, setIsClient] = useState(false);
  const [financial, setFinancial] = useState<FinancialResponseDto | null>(null);

  useEffect(() => {
    setIsClient(true);
    void fetchFinancial();
    // Listen for admin-side updates to refresh public data
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("financial");
      bc.onmessage = (e) => {
        if (e?.data?.type === "updated") void fetchFinancial();
      };
    } catch {}
    const onUpdated = () => void fetchFinancial();
    window.addEventListener("financial-updated", onUpdated);
    return () => {
      if (bc) bc.close();
      window.removeEventListener("financial-updated", onUpdated);
    };
  }, []);

  const fetchFinancial = async () => {
    try {
      const res = await fetch("/api/financial/public", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as FinancialResponseDto;
        setFinancial(json);
      }
    } catch {
      // ignore; this section will keep static placeholders if fetch fails
    }
  };

  const revenueItems = useMemo(() => financial?.revenues ?? [], [financial]);
  const totalRevenue = useMemo(
    () => revenueItems.reduce((sum, r) => sum + (r.amount || 0), 0),
    [revenueItems]
  );
  const financialBreakdown = useMemo(
    () =>
      revenueItems.length && totalRevenue
        ? revenueItems.map((item, index) => ({
            category: item.category,
            amount: item.amount,
            percentage: Math.round((item.amount / totalRevenue) * 100),
            color: SERIES_COLORS[index % SERIES_COLORS.length],
          }))
        : [
            {
              category: "Sponsorships",
              amount: 415000,
              percentage: 67,
              color: "#10b981",
            },
            {
              category: "Ticket Sales",
              amount: 104660,
              percentage: 17,
              color: "#8b5cf6",
            },
            {
              category: "Exhibitor Fees",
              amount: 66000,
              percentage: 11,
              color: "#3b82f6",
            },
            {
              category: "Additional Revenue",
              amount: 30000,
              percentage: 5,
              color: "#f59e0b",
            },
          ],
    [revenueItems, totalRevenue]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-8 mb-16 border border-white/10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <PieChart className="w-7 h-7 mr-3 text-blue-400" />
            Revenue Breakdown -{" "}
            {formatCurrency(
              totalRevenue ||
                financialBreakdown.reduce((s, i) => s + i.amount, 0),
              isClient
            )}{" "}
            Total
          </h3>

          <div className="space-y-4">
            {financialBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-300 font-medium">
                    {item.category}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">
                    {formatCurrency(item.amount, isClient)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {item.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-400 font-bold text-lg">
                  Total Media Value
                </div>
                <div className="text-gray-300 text-sm">For All Sponsors</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">€220K+</div>
                <div className="text-sm text-blue-300">Combined Benefits</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-square max-w-md mx-auto relative">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full transform -rotate-90"
            >
              {financialBreakdown.map((item, index) => {
                const offset = financialBreakdown
                  .slice(0, index)
                  .reduce((sum, prev) => sum + prev.percentage, 0);
                const circumference = 2 * Math.PI * 30;
                const strokeDasharray = `${
                  (item.percentage / 100) * circumference
                } ${circumference}`;
                const strokeDashoffset = -((offset / 100) * circumference);

                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="30"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="opacity-80 hover:opacity-100 transition-opacity duration-300"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(
                    totalRevenue ||
                      financialBreakdown.reduce((s, i) => s + i.amount, 0),
                    isClient
                  )}
                </div>
                <div className="text-sm text-gray-400">Total Revenue</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

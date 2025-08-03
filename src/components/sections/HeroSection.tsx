"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Play,
  Sparkles,
  Euro,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  Target,
  Award,
  Globe,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const keyStats = [
  {
    label: "Total Revenue",
    value: "€1.02M",
    subtext: "Premium Sponsorship Event",
    icon: Euro,
    color: "from-green-400 to-emerald-600",
    delay: 100,
  },
  {
    label: "Expected Attendees",
    value: "6,800+",
    subtext: "1,800 Offline + 5,000 Online",
    icon: Users,
    color: "from-blue-400 to-cyan-600",
    delay: 200,
  },
  {
    label: "Business Pipeline",
    value: "€650K",
    subtext: "Conservative Projection",
    icon: TrendingUp,
    color: "from-purple-400 to-pink-600",
    delay: 300,
  },
  {
    label: "Event Duration",
    value: "2 Days",
    subtext: "August 5-6, 2026",
    icon: Calendar,
    color: "from-orange-400 to-red-600",
    delay: 400,
  },
];

const trustIndicators = [
  {
    icon: ShieldCheck,
    text: "Government Endorsed",
    detail: "Indonesian & German Support",
  },
  {
    icon: Award,
    text: "Arena Berlin Confirmed",
    detail: "€236K Venue Investment",
  },
  {
    icon: Target,
    text: "AI-Powered Platform",
    detail: "First-of-Kind Technology",
  },
  {
    icon: Globe,
    text: "25+ Regions",
    detail: "Nationwide Representation",
  },
];

const HeroSection = () => {
  const [currentStat, setCurrentStat] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % keyStats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isClient]);

  return (
    <section className="relative pt-20 pb-32 overflow-hidden">
      {/* Animated background gradient */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.2), transparent 30%),
            radial-gradient(circle at 80% 70%, rgba(192, 132, 252, 0.2), transparent 30%),
            linear-gradient(to bottom right, #0f172a, #1e1b4b)
          `,
          transform: isClient
            ? `translate(${mousePosition.x * 0.5}px, ${
                mousePosition.y * 0.5
              }px)`
            : "translate(0px, 0px)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Indicators Bar */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 opacity-90">
          {trustIndicators.map((indicator, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-xs"
            >
              <indicator.icon className="w-4 h-4 text-cyan-400" />
              <span className="text-white font-medium">{indicator.text}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-300">{indicator.detail}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          {/* Enhanced Badge */}
          <div
            className="inline-flex items-center backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 px-8 py-4 rounded-full text-sm font-medium mb-8 transition-all duration-300 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Sparkles
              className={`w-5 h-5 mr-3 transition-transform duration-500 ${
                isHovered ? "animate-pulse text-cyan-300" : "text-cyan-400"
              }`}
            />
            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent font-bold text-base">
              Europe&apos;s Premier Indonesian Business & Cultural Expo
            </span>
            <span
              className="ml-3 text-cyan-400 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              →
            </span>
          </div>

          {/* Restructured Main Heading - More Business Focused */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 leading-tight">
            <span className="block bg-gradient-to-r from-white via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              €7.32 Billion MARKET
            </span>
            <span className="block bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 bg-clip-text text-transparent mt-2">
              OPPORTUNITY
            </span>
            <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Indonesia ↔ Germany Business Gateway
            </span>
          </h1>

          {/* Enhanced Subheading with Concrete Benefits */}
          <div className="max-w-5xl mx-auto mb-12">
            <p className="text-xl sm:text-2xl text-gray-200 mb-6 leading-relaxed font-medium">
              Access Europe&apos;s largest Indonesian business community through
              our
              <span className="text-cyan-400 font-bold">
                {" "}
                AI-powered matchmaking platform
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-green-400">€1.2M+</div>
                <div className="text-sm text-gray-300">Qualified Pipeline</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-blue-400">1,800+</div>
                <div className="text-sm text-gray-300">Business Leaders</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-purple-400">25+</div>
                <div className="text-sm text-gray-300">Indonesian Regions</div>
              </div>
            </div>
          </div>

          {/* Enhanced CTA Buttons with Investor Focus */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="#business-proposal"
              className="relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-green-500/25 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              <span className="relative flex items-center">
                <Euro className="mr-3 w-6 h-6" />
                View Investment Opportunity
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </Link>

            <Link
              href="#executive-summary"
              className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-blue-500/50 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center group"
            >
              <Play className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              Executive Summary
            </Link>

            <button className="backdrop-blur-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 hover:border-amber-400/60 text-amber-200 px-8 py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center group">
              <Target className="mr-3 w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              Request Full Access
            </button>
          </div>

          {/* Enhanced Key Statistics with Better Visual Hierarchy */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {keyStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`group relative backdrop-blur-xl bg-white/5 hover:bg-white/10 rounded-2xl p-6 border transition-all duration-500 transform hover:scale-105 ${
                    currentStat === index
                      ? `ring-2 ring-cyan-500/50 bg-gradient-to-br ${stat.color}/10 border-cyan-500/30`
                      : "border-white/10 hover:border-cyan-500/30"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div
                      className={`flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full transition-colors duration-300 ${
                        currentStat === index ? "bg-cyan-500/20" : "bg-white/5"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 transition-colors duration-300 ${
                          currentStat === index
                            ? "text-cyan-400"
                            : "text-gray-400 group-hover:text-cyan-400"
                        }`}
                      />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      {stat.label}
                    </div>
                    <div className="text-xs text-cyan-400 flex items-center justify-center">
                      {currentStat === index && (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      {stat.subtext}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ROI Highlight */}
          <div className="mt-12 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div className="text-left">
                <div className="text-2xl font-bold text-green-400">
                  8.3% Net Margin
                </div>
                <div className="text-sm text-gray-300">
                  Projected Profitability with Conservative Estimates
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

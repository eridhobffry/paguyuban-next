"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Users,
  Brain,
  Zap,
  Target,
  Shield,
  ArrowRight,
  CheckCircle,
  Smartphone,
  Database,
  Network,
  Settings,
  BarChart3,
  MessageSquare,
  Clock,
  Globe,
} from "lucide-react";
import { useState } from "react";
import {
  getPublicDownloadUrl,
  PUBLIC_DOWNLOAD_KEY,
} from "@/lib/documents/constants";

const platforms = [
  {
    id: "paguyubanconnect",
    name: "PaguyubanConnect",
    subtitle: "AI-Powered B2B Matchmaking Platform",
    description:
      "First-of-kind cultural intelligence algorithms designed specifically for Indonesia-Germany business networking.",
    budget: "€20,000",
    team: "Indonesian Tech Company (Jakarta-based)",
    color: "from-cyan-500 to-blue-600",
    bgGradient: "from-cyan-500/10 to-blue-600/10",
    borderColor: "border-cyan-500/30",
    icon: Brain,
    features: [
      {
        icon: Target,
        title: "Intelligent Matching",
        description:
          "AI algorithm matches based on sector alignment, company size compatibility, and language preferences",
      },
      {
        icon: Users,
        title: "Cultural Intelligence",
        description:
          "Understanding of Indonesian business culture and German market dynamics for optimal connections",
      },
      {
        icon: BarChart3,
        title: "Meeting Analytics",
        description:
          "Track meeting history, success rates, and follow-up opportunities with detailed analytics",
      },
      {
        icon: Globe,
        title: "Multi-Language Support",
        description:
          "Seamless communication in Indonesian, German, and English with real-time translation features",
      },
      {
        icon: Clock,
        title: "Smart Scheduling",
        description:
          "Automated 15-minute meeting scheduling with calendar integration and conflict resolution",
      },
      {
        icon: Network,
        title: "Follow-up Tools",
        description:
          "Post-event relationship management with automated follow-up reminders and contact sharing",
      },
    ],
    techSpecs: [
      "AI/ML Framework: TensorFlow & PyTorch",
      "Backend: Python Django, PostgreSQL",
      "Frontend: React Native & Progressive Web App",
      "APIs: OpenAI GPT-4, Google Cloud Translation",
      "Infrastructure: AWS with auto-scaling",
      "Security: End-to-end encryption, GDPR compliant",
    ],
    businessModel: {
      available: true,
      subscriptions: {
        free: "€0/month - Basic matching (5 matches/month)",
        basic: "€39/month - Smart matching & analytics (20 matches/month)",
        pro: "€89/month - Advanced features & integrations (50 matches/month)",
        enterprise: "€299+/month - Custom AI models & white-label options",
      },
      whiteLabelLicensing: "€5,000/event - Full platform for other events",
      additionalRevenue: "Premium features, API access, custom integrations",
    },
  },
  {
    id: "smartstaff",
    name: "SmartStaff",
    subtitle: "AI Volunteer Management System",
    description:
      "Comprehensive volunteer coordination platform with intelligent task assignment and real-time communication.",
    budget: "€10,000",
    team: "Same Indonesian Tech Company",
    color: "from-purple-500 to-pink-600",
    bgGradient: "from-purple-500/10 to-pink-600/10",
    borderColor: "border-purple-500/30",
    icon: Settings,
    features: [
      {
        icon: Users,
        title: "Smart Scheduling",
        description:
          "AI-powered volunteer scheduling and task assignment based on skills, availability, and preferences",
      },
      {
        icon: MessageSquare,
        title: "Real-time Communication",
        description:
          "Integrated messaging system with push notifications and emergency broadcast capabilities",
      },
      {
        icon: BarChart3,
        title: "Performance Tracking",
        description:
          "Monitor volunteer performance, attendance, and feedback with comprehensive analytics dashboard",
      },
      {
        icon: Shield,
        title: "Offline Backup Mode",
        description:
          "System continues functioning without internet with automatic sync when connection restored",
      },
      {
        icon: Smartphone,
        title: "Mobile-First Design",
        description:
          "Native mobile app with offline capabilities for volunteers working throughout the venue",
      },
      {
        icon: Database,
        title: "Integration Ready",
        description:
          "Seamless integration with main event app and third-party systems for unified experience",
      },
    ],
    techSpecs: [
      "Mobile: React Native for iOS & Android",
      "Backend: Node.js with Express, MongoDB",
      "Real-time: WebSocket connections",
      "Offline: Progressive Web App with local storage",
      "Communication: Push notifications via FCM",
      "Analytics: Custom dashboard with D3.js visualizations",
    ],
    whiteLabelInfo: {
      available: true,
      price: "€3,000/event",
      features: "Volunteer management for events of any size",
    },
  },
];

const resiliencePlan = [
  {
    icon: Brain,
    title: "Primary: AI-Powered Digital Systems",
    description:
      "Advanced algorithms handling intelligent matchmaking and volunteer coordination",
  },
  {
    icon: Users,
    title: "Backup: 150 Trained Volunteers",
    description:
      "Human backup system with printed attendee lists, manual matching cards, and two-way radios",
  },
  {
    icon: Shield,
    title: "Offline Contingency",
    description:
      "30 two-way radios, physical scheduling boards, and printed emergency protocols",
  },
];

const TechnologyPlatformSection = () => {
  const [activePlatform, setActivePlatform] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section
      id="technology-platform"
      className="relative py-20 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 to-slate-900/80 -z-10"></div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute -top-1/2 left-1/2 w-[150%] h-[150%] bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 animate-spin-slow"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 mb-4 px-6 py-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-full">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
              Technology Platform
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
            AI-Powered Event
            <span className="block text-cyan-400 mt-2">Innovation</span>
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience the future of business networking with our proprietary
            AI-driven platforms, developed by Indonesian tech teams specifically
            for cultural-intelligent business matching.
          </p>
        </motion.div>

        {/* Platform Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
            <div className="flex gap-2">
              {platforms.map((platform, index) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => {
                      setActivePlatform(index);
                      setActiveFeature(0);
                    }}
                    className={`flex items-center space-x-3 px-8 py-4 rounded-xl transition-all duration-300 ${
                      activePlatform === index
                        ? `bg-gradient-to-r ${platform.color} text-white shadow-lg`
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-bold">{platform.name}</div>
                      <div className="text-xs opacity-80">AI Platform</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Active Platform Details */}
        <motion.div
          key={activePlatform}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16"
        >
          {/* Platform Overview */}
          <div>
            <div
              className={`inline-flex items-center space-x-2 mb-4 px-4 py-2 bg-gradient-to-r ${platforms[activePlatform].bgGradient} border ${platforms[activePlatform].borderColor} rounded-full`}
            >
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">
                Budget: {platforms[activePlatform].budget}
              </span>
            </div>

            <h3 className="text-3xl font-bold text-white mb-2">
              {platforms[activePlatform].name}
            </h3>
            <p
              className={`text-lg font-medium bg-gradient-to-r ${platforms[activePlatform].color} bg-clip-text text-transparent mb-4`}
            >
              {platforms[activePlatform].subtitle}
            </p>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              {platforms[activePlatform].description}
            </p>

            {/* Development Info */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
              <h4 className="font-bold text-white mb-3 flex items-center">
                <Database className="w-5 h-5 mr-2 text-cyan-400" />
                Development Details
              </h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div>
                  <span className="text-cyan-400 font-medium">Team:</span>{" "}
                  {platforms[activePlatform].team}
                </div>
                <div>
                  <span className="text-cyan-400 font-medium">Budget:</span>{" "}
                  {platforms[activePlatform].budget}
                </div>
                <div>
                  <span className="text-cyan-400 font-medium">Type:</span>{" "}
                  Custom Development vs. Existing Solutions
                </div>
              </div>
            </div>

            {/* Business Model */}
            {platforms[activePlatform].businessModel?.available && (
              <div
                className={`p-6 bg-gradient-to-r ${platforms[activePlatform].bgGradient} border ${platforms[activePlatform].borderColor} rounded-xl`}
              >
                <h4 className="font-bold text-white mb-4 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Revenue Model
                </h4>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-200 mb-2">
                      Subscription Tiers
                    </h5>
                    <div className="space-y-1 text-xs text-gray-300">
                      <div>
                        • Free:{" "}
                        {
                          platforms[activePlatform].businessModel.subscriptions
                            .free
                        }
                      </div>
                      <div>
                        • Basic:{" "}
                        {
                          platforms[activePlatform].businessModel.subscriptions
                            .basic
                        }
                      </div>
                      <div>
                        • Pro:{" "}
                        {
                          platforms[activePlatform].businessModel.subscriptions
                            .pro
                        }
                      </div>
                      <div>
                        • Enterprise:{" "}
                        {
                          platforms[activePlatform].businessModel.subscriptions
                            .enterprise
                        }
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-gray-200 mb-1">
                      White-Label Licensing
                    </h5>
                    <div className="text-xs text-cyan-300">
                      {
                        platforms[activePlatform].businessModel
                          .whiteLabelLicensing
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Feature Showcase */}
          <div>
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl p-8 border border-white/10">
              <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                <ArrowRight className="w-5 h-5 mr-3 text-cyan-400" />
                Key Features
              </h4>

              <div className="grid grid-cols-1 gap-4 mb-6">
                {platforms[activePlatform].features.map((feature, index) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onClick={() => setActiveFeature(index)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                        activeFeature === index
                          ? `bg-gradient-to-r ${platforms[activePlatform].bgGradient} ${platforms[activePlatform].borderColor}`
                          : "bg-white/5 border-white/10 hover:border-cyan-500/30"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-r ${platforms[activePlatform].color} text-white`}
                        >
                          <FeatureIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-white mb-1">
                            {feature.title}
                          </h5>
                          <p className="text-gray-300 text-sm">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Technical Specifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-8 border border-white/10 mb-16"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Settings className="w-6 h-6 mr-3 text-purple-400" />
            Technical Specifications - {platforms[activePlatform].name}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms[activePlatform].techSpecs.map((spec, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{spec}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Technical Resilience Plan */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-16"
        >
          <h3 className="text-3xl font-bold text-center text-white mb-12 flex items-center justify-center">
            <Shield className="w-8 h-8 mr-3 text-green-400" />
            Technical Resilience Framework
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resiliencePlan.map((plan, index) => {
              const PlanIcon = plan.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 border border-white/10 text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <PlanIcon className="w-8 h-8 text-green-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-3">
                    {plan.title}
                  </h4>
                  <p className="text-gray-300">{plan.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-3xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">
              First-of-Kind Cultural Intelligence Technology
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              These platforms represent a breakthrough in cultural-aware
              business technology, developed specifically for Indonesia-Germany
              business dynamics. Experience the future of intelligent
              networking.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/request-access?type=demo"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Request Platform Demo
              </a>
              <a
                href={getPublicDownloadUrl(PUBLIC_DOWNLOAD_KEY.TECHNICAL_SPECS)}
                download
                aria-label="Download Technical Specs PDF"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300"
              >
                Download Technical Specs
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TechnologyPlatformSection;

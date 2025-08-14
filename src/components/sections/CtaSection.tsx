"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Users,
  MapPin,
  Euro,
  TrendingUp,
  Shield,
  FileText,
  Phone,
  Mail,
  MessageCircle,
  Download,
  ExternalLink,
  Target,
  Award,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { SITE } from "@/config/site";

const investmentBenefits = [
  {
    icon: <Euro className="w-5 h-5 text-emerald-400" />,
    text: "8.3% net margin with conservative projections",
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    text: "€1.2M qualified business pipeline generation",
  },
  {
    icon: <Globe className="w-5 h-5 text-emerald-400" />,
    text: "Access to €7.32 Billion Germany-Indonesia trade corridor",
  },
  {
    icon: <Award className="w-5 h-5 text-emerald-400" />,
    text: "First-mover advantage in AI-powered cultural events",
  },
  {
    icon: <Users className="w-5 h-5 text-emerald-400" />,
    text: "30,000+ Indonesian professionals in German market",
  },
  {
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
    text: "Government-backed cultural diplomacy initiative",
  },
];

const urgencyIndicators = [
  {
    metric: "Title Sponsorship",
    status: "1 Available",
    timeline: "Closes Feb 28, 2026",
    color: "text-red-400",
  },
  {
    metric: "Platinum Partners",
    status: "2 Available",
    timeline: "Early Bird Until Mar 31",
    color: "text-amber-400",
  },
  {
    metric: "Event Registration",
    status: "75% Sold",
    timeline: "Price increases Apr 1",
    color: "text-orange-400",
  },
];

const contactMethods = [
  {
    type: "Investment Inquiry",
    method: "Schedule Executive Call",
    contact: SITE.contacts.phone,
    icon: Phone,
    description: "Direct line to investment team",
    primary: true,
  },
  {
    type: "Partnership Discussion",
    method: "Email Partnership Team",
    contact: "partnerships@nusantaramesse.com",
    icon: Mail,
    description: "Comprehensive partnership proposals",
    primary: false,
  },
  {
    type: "Documentation Request",
    method: "WhatsApp Business",
    contact: SITE.contacts.whatsapp,
    icon: MessageCircle,
    description: "Instant access to business documents",
    primary: false,
  },
];

const CtaSection = () => {
  return (
    <section id="partner-with-us" className="relative py-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-cyan-500/5"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[url('/images/pattern-grid.svg')] opacity-30 animate-float"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Urgency Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {urgencyIndicators.map((indicator, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-white/10 rounded-full px-6 py-3 backdrop-blur-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="text-white font-medium text-sm">
                  {indicator.metric}
                </div>
                <div className={`font-bold text-sm ${indicator.color}`}>
                  {indicator.status}
                </div>
                <div className="text-gray-400 text-xs">
                  {indicator.timeline}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Value Proposition */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-emerald-500/10 to-green-600/20 rounded-3xl p-8 md:p-10 border border-emerald-500/20 backdrop-blur-sm">
              {/* Premium Badge */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-br from-green-400 to-emerald-500 text-green-900 px-6 py-3 rounded-full text-sm font-bold shadow-lg flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Limited Partnership Slots
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Join Europe&apos;s Premier Indonesian Business Gateway
              </h2>

              <p className="text-lg text-gray-300 mb-8">
                Secure your position in the fastest-growing Asian trade
                corridor. Conservative financial projections show immediate ROI
                with long-term strategic value in Indonesia&apos;s €7.32 Billion
                German market presence.
              </p>

              {/* Event Details with Enhanced Visual Hierarchy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center text-emerald-400 mb-2">
                    <Calendar className="w-5 h-5 mr-3" />
                    <span className="font-medium">Event Dates</span>
                  </div>
                  <div className="text-white font-bold">August 7-8, 2026</div>
                  <div className="text-gray-400 text-sm">2 Days in Berlin</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center text-emerald-400 mb-2">
                    <MapPin className="w-5 h-5 mr-3" />
                    <span className="font-medium">Venue</span>
                  </div>
                  <div className="text-white font-bold">Arena Berlin</div>
                  <div className="text-gray-400 text-sm">Premium Location</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center text-emerald-400 mb-2">
                    <Users className="w-5 h-5 mr-3" />
                    <span className="font-medium">Attendees</span>
                  </div>
                  <div className="text-white font-bold">
                    1,800+ Professionals
                  </div>
                  <div className="text-gray-400 text-sm">Quality Network</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center text-emerald-400 mb-2">
                    <Euro className="w-5 h-5 mr-3" />
                    <span className="font-medium">Investment</span>
                  </div>
                  <div className="text-white font-bold">From €15,000</div>
                  <div className="text-gray-400 text-sm">Multiple Tiers</div>
                </div>
              </div>

              {/* ROI Highlight */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-green-400 font-bold text-xl">
                      €548,000 Revenue
                    </div>
                    <div className="text-gray-300 text-sm">
                      Conservative Projections
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      8.3%
                    </div>
                    <div className="text-sm text-green-300">Net Margin</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-emerald-400">
                      285%
                    </div>
                    <div className="text-sm text-emerald-300">Max ROI</div>
                  </div>
                </div>
              </div>

              {/* Primary CTAs with Clear Hierarchy */}
              <div className="space-y-4">
                <Link
                  href="/partnership-application"
                  className="block w-full text-center px-8 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-green-500/20"
                >
                  <div className="flex items-center justify-center">
                    <Target className="w-6 h-6 mr-3" />
                    Secure Partnership Now
                    <ArrowRight className="w-5 h-5 ml-3" />
                  </div>
                </Link>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href={`tel:${SITE.contacts.phone.replace(/\s+/g, "")}`}
                    className="px-6 py-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40 text-blue-200 rounded-xl hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 flex items-center justify-center"
                  >
                    <FileText className="w-5 h-5 mr-3" />
                    Request Documentation
                  </a>

                  <a
                    href="/calendar/event.ics"
                    download
                    className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-colors flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-3" />
                    Download Proposal
                  </a>
                </div>
              </div>

              <p className="text-center text-sm text-gray-400 mt-6">
                <Shield className="w-4 h-4 inline mr-2" />
                Government-backed initiative • Secure investment • Proven ROI
              </p>
            </div>

            {/* Floating Elements */}
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          </motion.div>

          {/* Right Column - Benefits & Contact */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-10 border border-white/10 backdrop-blur-sm h-full">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Award className="w-7 h-7 mr-3 text-emerald-400" />
                Partnership Benefits
              </h3>

              <ul className="space-y-4 mb-8">
                {investmentBenefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.05 * index }}
                    className="flex items-start"
                  >
                    <span className="mr-3 mt-0.5">{benefit.icon}</span>
                    <span className="text-gray-300">{benefit.text}</span>
                  </motion.li>
                ))}
              </ul>

              {/* Contact Methods */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-white mb-4">
                  Multiple Ways to Connect
                </h4>

                {contactMethods.map((contact, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                      contact.primary
                        ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30"
                        : "bg-white/5 border-white/10 hover:border-emerald-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            contact.primary ? "bg-green-500/20" : "bg-white/10"
                          }`}
                        >
                          <contact.icon
                            className={`w-5 h-5 ${
                              contact.primary
                                ? "text-green-400"
                                : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div>
                          <h5 className="text-white font-medium">
                            {contact.type}
                          </h5>
                          <p className="text-gray-400 text-sm mb-1">
                            {contact.description}
                          </p>
                          <p
                            className={`text-sm font-medium ${
                              contact.primary
                                ? "text-green-400"
                                : "text-gray-300"
                            }`}
                          >
                            {contact.contact}
                          </p>
                        </div>
                      </div>
                      <button
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          contact.primary
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-white/10 text-gray-300 hover:bg-white/20"
                        }`}
                      >
                        {contact.method}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Final CTA */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <h4 className="text-lg font-bold text-white mb-4 text-center">
                  Ready to Join Indonesia&apos;s European Success Story?
                </h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={`tel:${SITE.contacts.phone.replace(/\s+/g, "")}`}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Schedule Call
                  </a>
                  <a
                    href="/calendar/event.ics"
                    download
                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-colors flex items-center justify-center"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    View Calendar
                  </a>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                  Limited partnership slots available • First-come, first-served
                  basis
                </p>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;

"use client";

import { motion } from "framer-motion";
import {
  Palette,
  Wheat,
  Users,
  Music,
  ArrowRight,
  Clock,
  ChevronRight,
  Star,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import {
  getPublicDownloadUrl,
  PUBLIC_DOWNLOAD_KEY,
} from "@/lib/documents/constants";
import { trackCtaClick, trackDownloadClick } from "@/lib/analytics/client";

const workshops = [
  {
    id: 1,
    title: "Batik Design Workshop",
    subtitle: "Traditional Artistry Meets Modern Business",
    description:
      "Learn traditional Indonesian batik techniques while exploring modern applications in fashion and textile trade.",
    businessApplication: "Fashion & Textile Trade Opportunities",
    duration: "90 minutes",
    maxParticipants: 25,
    difficulty: "Beginner Friendly",
    icon: Palette,
    color: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/10 to-pink-500/10",
    borderColor: "border-purple-500/30",
    highlights: [
      "Hands-on wax-resist dyeing techniques",
      "Cultural significance and symbolism",
      "Modern textile business applications",
      "Sustainable production methods",
      "Export market opportunities",
    ],
    instructor: "Certified Batik Artisan from Yogyakarta",
    materials: "All tools and materials provided",
    takeaway: "Custom batik artwork + business insights",
  },
  {
    id: 2,
    title: "Sagu Processing Demo",
    subtitle: "Sustainable Food Innovation from Maluku",
    description:
      "Discover the ancient art of sagu (sago palm) processing and its potential as a sustainable food source for modern markets.",
    businessApplication: "Alternative Food Sources & Sustainability",
    duration: "90 minutes",
    maxParticipants: 30,
    difficulty: "All Levels",
    icon: Wheat,
    color: "from-green-500 to-emerald-500",
    bgGradient: "from-green-500/10 to-emerald-500/10",
    borderColor: "border-green-500/30",
    highlights: [
      "Traditional sagu extraction process",
      "Nutritional benefits and applications",
      "Sustainable farming practices",
      "Commercial processing techniques",
      "Global market potential",
    ],
    instructor: "Sagu Expert from Maluku Utara",
    materials: "Tasting samples included",
    takeaway: "Sagu products + market analysis",
  },
  {
    id: 3,
    title: "Cakalele Dance",
    subtitle: "Team Building Through Traditional Movement",
    description:
      "Experience the powerful warrior dance of Maluku while learning team dynamics and leadership principles.",
    businessApplication: "Corporate Culture & Team Building",
    duration: "90 minutes",
    maxParticipants: 20,
    difficulty: "Active Participation",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
    borderColor: "border-blue-500/30",
    highlights: [
      "Traditional warrior dance movements",
      "Team synchronization exercises",
      "Leadership and followership dynamics",
      "Cultural storytelling through dance",
      "Corporate team building applications",
    ],
    instructor: "Professional Dance Instructors",
    materials: "Comfortable clothing recommended",
    takeaway: "Team building certificate + cultural insights",
  },
  {
    id: 4,
    title: "Tifa Drumming",
    subtitle: "Communication Patterns in Business",
    description:
      "Master the traditional Tifa drum while understanding rhythm, timing, and communication in Indonesian business culture.",
    businessApplication: "Business Communication & Negotiation",
    duration: "90 minutes",
    maxParticipants: 15,
    difficulty: "Beginner Friendly",
    icon: Music,
    color: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-500/10 to-orange-500/10",
    borderColor: "border-amber-500/30",
    highlights: [
      "Traditional Tifa drumming techniques",
      "Rhythm and timing in business",
      "Non-verbal communication patterns",
      "Negotiation rhythm and flow",
      "Cultural communication insights",
    ],
    instructor: "Master Drummer from Papua",
    materials: "Tifa drums provided",
    takeaway: "Drumming experience + business communication guide",
  },
];

const CulturalWorkshopsSection = () => {
  const [activeWorkshop, setActiveWorkshop] = useState(0);

  return (
    <section id="cultural-workshops" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-800/80 -z-10"></div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -top-1/2 right-1/2 w-[150%] h-[150%] bg-gradient-to-bl from-purple-500/20 via-blue-500/20 to-green-500/20 rounded-full translate-x-1/2 -translate-y-1/2 animate-spin-slow"></div>
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
          <div className="inline-flex items-center space-x-2 mb-4 px-6 py-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-full">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Cultural Workshops
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
            Where Tradition Meets
            <span className="block text-purple-400 mt-2">Modern Business</span>
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience authentic Indonesian cultural practices while discovering
            their relevance to modern business applications. Each workshop
            combines hands-on learning with practical business insights.
          </p>
        </motion.div>

        {/* Workshop Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
            <div className="flex flex-wrap justify-center gap-2">
              {workshops.map((workshop, index) => {
                const Icon = workshop.icon;
                return (
                  <button
                    key={workshop.id}
                    onClick={() => setActiveWorkshop(index)}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 ${
                      activeWorkshop === index
                        ? `bg-gradient-to-r ${workshop.color} text-white shadow-lg`
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{workshop.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Active Workshop Details */}
        <motion.div
          key={activeWorkshop}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          {/* Workshop Info */}
          <div>
            <div
              className={`inline-flex items-center space-x-2 mb-4 px-4 py-2 bg-gradient-to-r ${workshops[activeWorkshop].bgGradient} border ${workshops[activeWorkshop].borderColor} rounded-full`}
            >
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">
                {workshops[activeWorkshop].difficulty}
              </span>
            </div>

            <h3 className="text-3xl font-bold text-white mb-2">
              {workshops[activeWorkshop].title}
            </h3>
            <p
              className={`text-lg font-medium bg-gradient-to-r ${workshops[activeWorkshop].color} bg-clip-text text-transparent mb-4`}
            >
              {workshops[activeWorkshop].subtitle}
            </p>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              {workshops[activeWorkshop].description}
            </p>

            {/* Key Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center text-purple-400 mb-2">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Duration</span>
                </div>
                <div className="text-white font-bold">
                  {workshops[activeWorkshop].duration}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center text-blue-400 mb-2">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Max Participants</span>
                </div>
                <div className="text-white font-bold">
                  {workshops[activeWorkshop].maxParticipants} people
                </div>
              </div>
            </div>

            {/* Business Application */}
            <div
              className={`p-4 bg-gradient-to-r ${workshops[activeWorkshop].bgGradient} border ${workshops[activeWorkshop].borderColor} rounded-xl mb-6`}
            >
              <h4 className="font-bold text-white mb-2">
                Business Application
              </h4>
              <p className="text-gray-200">
                {workshops[activeWorkshop].businessApplication}
              </p>
            </div>
          </div>

          {/* Workshop Highlights */}
          <div>
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl p-8 border border-white/10">
              <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                <ArrowRight className="w-5 h-5 mr-3 text-purple-400" />
                Workshop Highlights
              </h4>

              <div className="space-y-4 mb-8">
                {workshops[activeWorkshop].highlights.map(
                  (highlight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start"
                    >
                      <div
                        className={`w-2 h-2 rounded-full bg-gradient-to-r ${workshops[activeWorkshop].color} mt-2 mr-3 flex-shrink-0`}
                      ></div>
                      <span className="text-gray-300">{highlight}</span>
                    </motion.div>
                  )
                )}
              </div>

              {/* Workshop Details */}
              <div className="space-y-4 border-t border-white/10 pt-6">
                <div>
                  <h5 className="font-medium text-white mb-1">Instructor</h5>
                  <p className="text-gray-400 text-sm">
                    {workshops[activeWorkshop].instructor}
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-white mb-1">Materials</h5>
                  <p className="text-gray-400 text-sm">
                    {workshops[activeWorkshop].materials}
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-white mb-1">Take Away</h5>
                  <p className="text-gray-400 text-sm">
                    {workshops[activeWorkshop].takeaway}
                  </p>
                </div>
              </div>

              <a
                href="/request-access?type=workshop"
                className={`block text-center w-full mt-6 py-3 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r ${workshops[activeWorkshop].color} hover:opacity-90 text-white`}
              >
                Reserve Your Spot
                <ChevronRight className="w-5 h-5 ml-2 inline" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-3xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">
              All Workshops Included in Event Registration
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              These cultural workshops are part of your Paguyuban Messe 2026
              experience. Each session runs multiple times throughout Day 1,
              allowing flexible participation around your business meetings and
              networking activities.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#schedule"
                onClick={() =>
                  trackCtaClick({
                    section: "cultural-workshops",
                    cta: "View Full Schedule",
                    href: "#schedule",
                  })
                }
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                View Full Schedule
              </a>
              <a
                href={getPublicDownloadUrl(PUBLIC_DOWNLOAD_KEY.WORKSHOP_GUIDE)}
                onClick={() =>
                  trackDownloadClick({
                    section: "cultural-workshops",
                    cta: "Download Workshop Guide",
                    href: getPublicDownloadUrl(
                      PUBLIC_DOWNLOAD_KEY.WORKSHOP_GUIDE
                    ),
                  })
                }
                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300"
              >
                Download Workshop Guide
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CulturalWorkshopsSection;

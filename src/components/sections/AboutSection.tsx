"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Globe, Sparkles, Play } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: <Calendar className="w-6 h-6 text-cyan-400" />,
    title: "6 Days of Excellence",
    description: "August 5-10, 2026",
  },
  {
    icon: <MapPin className="w-6 h-6 text-purple-400" />,
    title: "Prime Location",
    description: "Arena Berlin, Germany",
  },
  {
    icon: <Users className="w-6 h-6 text-pink-400" />,
    title: "1,800+ Attendees",
    description: "Business professionals & cultural enthusiasts",
  },
  {
    icon: <Globe className="w-6 h-6 text-amber-400" />,
    title: "Global Reach",
    description: "25+ Indonesian regions represented",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="relative py-20 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute -top-1/2 left-1/2 w-[150%] h-[150%] bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-spin-slow"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 z-10"></div>
              <Image
                src="/images/berlin-venue.jpg"
                alt="Arena Berlin Venue"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-amber-400 to-amber-600 text-amber-900 p-4 rounded-2xl shadow-xl">
              <div className="text-sm font-bold">€2M+</div>
              <div className="text-xs">Economic Impact</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-flex items-center space-x-2 mb-6 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                About The Event
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
              Where Culture Meets{" "}
              <span className="text-amber-400">Innovation</span>
            </h2>

            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Nusantara Messe 2026 is not just an event—it&apos;s a
              transformative experience that bridges Indonesian heritage with
              cutting-edge business opportunities in the heart of Europe. Over
              six dynamic days, we&apos;ll showcase the best of Indonesia&apos;s
              cultural richness while fostering meaningful B2B connections
              through our AI-powered matchmaking platform.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className="flex items-start space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="p-2 bg-white/5 rounded-lg">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl transition-all transform hover:scale-105">
                Download Brochure
              </button>
              <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all transform hover:scale-105 flex items-center">
                <Play className="w-4 h-4 mr-2" />
                Watch Video
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

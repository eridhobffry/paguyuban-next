"use client";

import { motion } from 'framer-motion';
import { Layers, Cpu, Users, Globe, BarChart3, Sparkles, Award } from 'lucide-react';

const features = [
  {
    icon: <Layers className="w-8 h-8" />,
    title: "AI-Powered B2B Matchmaking",
    description: "Our intelligent platform connects you with the most relevant business partners using advanced algorithms.",
    color: "from-cyan-400 to-blue-500",
  },
  {
    icon: <Cpu className="w-8 h-8" />,
    title: "SmartStaff AI Management",
    description: "Experience seamless event operations with our AI-driven workforce coordination system.",
    color: "from-purple-400 to-pink-500",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "250+ Volunteers",
    description: "15 specialized teams ensuring a flawless experience for all attendees and exhibitors.",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: "Global Reach",
    description: "Connect with 1,800+ attendees from 25+ Indonesian regions and beyond.",
    color: "from-emerald-400 to-teal-500",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "€1.2M+ Business Pipeline",
    description: "Access to high-value investment opportunities and strategic partnerships.",
    color: "from-blue-400 to-indigo-500",
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: "Cultural Showcase",
    description: "Experience the rich diversity of Indonesian culture through authentic performances and exhibitions.",
    color: "from-pink-400 to-rose-500",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/80 -z-10"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 mb-4 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              Why Attend?
            </span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent"
          >
            Unparalleled <span className="text-amber-400">Opportunities</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-400"
          >
            Discover what makes Nusantara Messe 2026 the premier platform for cultural exchange and business growth
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group relative p-6 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                background: `linear-gradient(135deg, ${feature.color.split(' ')[1]}10, ${feature.color.split(' ')[3]}10)`
              }}></div>
              
              <div className={`inline-flex items-center justify-center w-12 h-12 mb-6 rounded-xl bg-gradient-to-br ${feature.color} text-white`}>
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 mb-6">{feature.description}</p>
              
              <div className="flex items-center text-sm font-medium text-cyan-400 group-hover:translate-x-1 transition-transform duration-300">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <button className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-amber-900 font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-amber-500/20">
            Register Now
          </button>
          <p className="mt-4 text-sm text-gray-500">Early bird pricing available until March 31, 2026</p>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;

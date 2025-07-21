"use client";

import { motion } from 'framer-motion';
import { Mic2, Twitter, Linkedin, Globe } from 'lucide-react';
import Image from 'next/image';

const speakers = [
  {
    name: "Dr. Surya Wijaya",
    role: "Minister of Trade, Indonesia",
    company: "Government of Indonesia",
    image: "/images/speakers/speaker1.jpg",
    social: {
      twitter: "#",
      linkedin: "#",
      website: "#"
    }
  },
  {
    name: "Anna Müller",
    role: "CEO",
    company: "Euro-Asia Trade Alliance",
    image: "/images/speakers/speaker2.jpg",
    social: {
      twitter: "#",
      linkedin: "#",
      website: "#"
    }
  },
  {
    name: "Prof. Budi Santoso",
    role: "Director of Cultural Heritage",
    company: "Ministry of Education & Culture",
    image: "/images/speakers/speaker3.jpg",
    social: {
      twitter: "#",
      linkedin: "#",
      website: "#"
    }
  },
  {
    name: "Dr. Sarah Chen",
    role: "Head of AI Research",
    company: "TechFuture Labs",
    image: "/images/speakers/speaker4.jpg",
    social: {
      twitter: "#",
      linkedin: "#",
      website: "#"
    }
  },
];

const SpeakerCard = ({ speaker, index }: { speaker: typeof speakers[0], index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative p-6 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden"
    >
      <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-cyan-400/30 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 z-10"></div>
        <Image
          src={speaker.image}
          alt={speaker.name}
          fill
          className="object-cover"
        />
      </div>
      
      <h3 className="text-xl font-bold text-white text-center mb-1">{speaker.name}</h3>
      <p className="text-cyan-400 text-sm text-center mb-1">{speaker.role}</p>
      <p className="text-gray-400 text-sm text-center mb-4">{speaker.company}</p>
      
      <div className="flex justify-center space-x-3">
        <a href={speaker.social.twitter} className="text-gray-400 hover:text-cyan-400 transition-colors">
          <Twitter className="w-4 h-4" />
        </a>
        <a href={speaker.social.linkedin} className="text-gray-400 hover:text-cyan-400 transition-colors">
          <Linkedin className="w-4 h-4" />
        </a>
        <a href={speaker.social.website} className="text-gray-400 hover:text-cyan-400 transition-colors">
          <Globe className="w-4 h-4" />
        </a>
      </div>
      
      <div className="absolute top-4 right-4 p-2 bg-cyan-500/10 rounded-full">
        <Mic2 className="w-4 h-4 text-cyan-400" />
      </div>
    </motion.div>
  );
};

const SpeakersSection = () => {
  return (
    <section id="speakers" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-slate-900/80 -z-10"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 mb-4 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
          >
            <Mic2 className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              Featured Speakers
            </span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent"
          >
            Industry <span className="text-amber-400">Leaders</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-400"
          >
            Learn from and network with top executives, government officials, and cultural ambassadors
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {speakers.map((speaker, index) => (
            <SpeakerCard key={index} speaker={speaker} index={index} />
          ))}
          
          {/* More speakers coming soon card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="group relative p-6 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border-2 border-dashed border-white/10 hover:border-amber-400/30 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center min-h-[400px] text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/10 to-amber-600/10 flex items-center justify-center mb-6">
              <Mic2 className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">More Speakers</h3>
            <p className="text-gray-400 mb-6 max-w-xs">Stay tuned as we announce more industry leaders joining our lineup</p>
            <button className="px-6 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-lg transition-all">
              View All Speakers
            </button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/20">
            Become a Speaker
          </button>
          <p className="mt-4 text-sm text-gray-500">Apply to speak at Nusantara Messe 2026</p>
        </motion.div>
      </div>
    </section>
  );
};

export default SpeakersSection;

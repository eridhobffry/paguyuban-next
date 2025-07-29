"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  Globe,
  Sparkles,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: <Calendar className="w-6 h-6 text-cyan-400" />,
    title: "2 Days of Excellence",
    description: "August 5-6, 2026",
  },
  {
    icon: <MapPin className="w-6 h-6 text-purple-400" />,
    title: "Arena Berlin",
    description: "Halle CE, Beach Club & Club spaces",
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

const venueVideos = [
  {
    src: "/videos/Halle.mp4",
    title: "Halle CE - Main Exhibition Hall",
    description: "6,500m² main space for exhibitions, stage, and dining",
  },
  {
    src: "/videos/Badeschiff.mp4",
    title: "Beach Club - Waterfront VVIP",
    description: "Exclusive waterfront networking and dining area",
  },
  {
    src: "/videos/Club.mp4",
    title: "Club Berlin - Evening Events",
    description: "Premium nightlife and entertainment space",
  },
];

const AboutSection = () => {
  const [currentVideo, setCurrentVideo] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
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
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 z-10 pointer-events-none"></div>

              {/* Video Player */}
              <video
                key={venueVideos[currentVideo].src}
                className="w-full h-full object-cover"
                autoPlay={isVideoPlaying}
                muted
                loop
                playsInline
              >
                <source src={venueVideos[currentVideo].src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Video Controls Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <button
                  onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 opacity-0 group-hover:opacity-100"
                >
                  <Play className="w-8 h-8 ml-1" />
                </button>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() =>
                  setCurrentVideo(
                    currentVideo > 0 ? currentVideo - 1 : venueVideos.length - 1
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() =>
                  setCurrentVideo(
                    currentVideo < venueVideos.length - 1 ? currentVideo + 1 : 0
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Video Info */}
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4">
                  <h3 className="text-white font-bold text-lg">
                    {venueVideos[currentVideo].title}
                  </h3>
                  <p className="text-gray-200 text-sm">
                    {venueVideos[currentVideo].description}
                  </p>
                </div>
              </div>

              {/* Video Indicators */}
              <div className="absolute top-4 right-4 z-20 flex space-x-2">
                {venueVideos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentVideo(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentVideo
                        ? "bg-white"
                        : "bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-amber-400 to-amber-600 text-amber-900 p-4 rounded-2xl shadow-xl">
              <div className="text-sm font-bold">€148K</div>
              <div className="text-xs">Venue Investment</div>
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
              Paguyuban Messe 2026 is more than an event—it&apos;s the launch of
              a sustainable platform designed to forge the next generation of
              Indonesia-Germany partnerships. Over two intensive days, we
              combine a high-profile cultural festival with an AI-powered
              business forum, creating tangible opportunities for businesses,
              artists, and young professionals.
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
              <button
                onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all transform hover:scale-105 flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                {isVideoPlaying ? "Pause Video" : "Play Video"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

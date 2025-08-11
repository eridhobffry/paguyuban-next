"use client";

import { motion } from "framer-motion";
import { Mic2, Twitter, Linkedin, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getSafeImageSrc } from "@/lib/utils";
import { useEffect, useState } from "react";
import { PublicArtistDto, PublicSpeakerDto } from "@/types/people";

const SpeakerCard = ({
  speaker,
  index,
}: {
  speaker: {
    name: string;
    role?: string | null;
    company?: string | null;
    image: string;
    href?: string;
    social: {
      twitter?: string | null;
      linkedin?: string | null;
      website?: string | null;
    };
  };
  index: number;
}) => {
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
          src={getSafeImageSrc(
            speaker.image,
            "/images/speakers/gita-wirjawan.jpg"
          )}
          alt={speaker.name}
          fill
          className="object-cover"
        />
      </div>

      {speaker.href ? (
        <Link href={speaker.href} className="block">
          <h3 className="text-xl font-bold text-white text-center mb-1 underline-offset-4 hover:underline">
            {speaker.name}
          </h3>
        </Link>
      ) : (
        <h3 className="text-xl font-bold text-white text-center mb-1">
          {speaker.name}
        </h3>
      )}
      <p className="text-cyan-400 text-sm text-center mb-1">{speaker.role}</p>
      <p className="text-gray-400 text-sm text-center mb-4">
        {speaker.company}
      </p>

      <div className="flex justify-center space-x-3">
        {speaker.social.twitter && (
          <a
            href={speaker.social.twitter}
            className="text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <Twitter className="w-4 h-4" />
          </a>
        )}
        {speaker.social.linkedin && (
          <a
            href={speaker.social.linkedin}
            className="text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <Linkedin className="w-4 h-4" />
          </a>
        )}
        {speaker.social.website && (
          <a
            href={speaker.social.website}
            className="text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <Globe className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="absolute top-4 right-4 p-2 bg-cyan-500/10 rounded-full">
        <Mic2 className="w-4 h-4 text-cyan-400" />
      </div>
    </motion.div>
  );
};

const SpeakersSection = () => {
  const [artists, setArtists] = useState<PublicArtistDto[]>([]);
  const [speakers, setSpeakers] = useState<PublicSpeakerDto[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          fetch("/api/artists/public", { cache: "no-store" }),
          fetch("/api/speakers/public", { cache: "no-store" }),
        ]);
        const aData = await aRes.json();
        const sData = await sRes.json();
        setArtists(aData.artists ?? []);
        setSpeakers(sData.speakers ?? []);
      } catch {
        // swallow
      }
    };
    load();
  }, []);

  const featuredArtists = artists.map((a) => ({
    name: a.name,
    role: a.role ?? "",
    company: a.company ?? "",
    image: a.imageUrl ?? "/images/artists/dewa19.jpg",
    href: a.slug ? `/artists/${a.slug}` : undefined,
    social: {
      twitter: a.twitter ?? "",
      linkedin: a.linkedin ?? "",
      website: a.website ?? "",
    },
  }));

  const businessSpeakers = speakers.map((s) => ({
    name: s.name,
    role: s.role ?? "",
    company: s.company ?? "",
    image: getSafeImageSrc(s.image_url, "/images/speakers/gita-wirjawan.jpg"),
    href: s.slug ? `/speakers/${s.slug}` : undefined,
    social: {
      twitter: s.twitter ?? "",
      linkedin: s.linkedin ?? "",
      website: s.website ?? "",
    },
  }));
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
            Learn from and network with top executives, government officials,
            and cultural ambassadors
          </motion.p>
        </div>

        {/* Featured Artists Section */}
        <div className="mb-16">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            Featured Artists
          </motion.h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredArtists.map((artist, index) => (
              <SpeakerCard
                key={`artist-${index}`}
                speaker={artist}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Business Speakers Section */}
        <div className="mb-16">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
          >
            Business Leaders & Speakers
          </motion.h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {businessSpeakers.map((speaker, index) => (
              <SpeakerCard
                key={`speaker-${index}`}
                speaker={speaker}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* More speakers coming soon card */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="group relative p-6 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border-2 border-dashed border-white/10 hover:border-amber-400/30 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center min-h-[300px] text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/10 to-amber-600/10 flex items-center justify-center mb-6">
              <Mic2 className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              More Announcements
            </h3>
            <p className="text-gray-400 mb-6 max-w-xs">
              Additional speakers and artists will be announced soon
            </p>
            <button className="px-6 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-lg transition-all">
              Stay Updated
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
          <p className="mt-4 text-sm text-gray-500">
            Apply to speak at Nusantara Messe 2026
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SpeakersSection;

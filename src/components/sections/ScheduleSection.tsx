"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

type Day = 'day1' | 'day2' | 'day3' | 'day4' | 'day5' | 'day6';

interface ScheduleItem {
  id: number;
  time: string;
  title: string;
  speaker?: string;
  location: string;
  description: string;
  type: 'keynote' | 'workshop' | 'panel' | 'networking' | 'cultural';
}

const scheduleData: Record<Day, ScheduleItem[]> = {
  day1: [
    {
      id: 1,
      time: '09:00 - 10:30',
      title: 'Registration & Welcome Coffee',
      location: 'Main Lobby',
      description: 'Check-in, collect your badge, and enjoy some refreshments while networking with fellow attendees.',
      type: 'networking'
    },
    {
      id: 2,
      time: '10:30 - 12:00',
      title: 'Opening Ceremony',
      speaker: 'Keynote by Dr. Surya Wijaya',
      location: 'Grand Ballroom',
      description: 'Official opening of Nusantara Messe 2026 with speeches from distinguished guests and cultural performances.',
      type: 'keynote'
    },
    {
      id: 3,
      time: '12:00 - 13:30',
      title: 'Networking Lunch',
      location: 'Riverside Pavilion',
      description: 'Enjoy a selection of Indonesian and German cuisine while making valuable connections.',
      type: 'networking'
    },
  ],
  day2: [
    {
      id: 4,
      time: '09:00 - 10:30',
      title: 'AI in Business Matchmaking',
      speaker: 'Dr. Sarah Chen',
      location: 'Tech Hub A',
      description: 'Exploring how AI is revolutionizing B2B connections and creating new opportunities.',
      type: 'workshop'
    },
    {
      id: 5,
      time: '11:00 - 12:30',
      title: 'Sustainable Business Practices',
      speaker: 'Panel Discussion',
      location: 'Green Room',
      description: 'Industry leaders discuss sustainable approaches to business in the modern economy.',
      type: 'panel'
    },
  ],
  day3: [
    {
      id: 6,
      time: '09:30 - 11:00',
      title: 'Cultural Showcase',
      location: 'Main Stage',
      description: 'Experience the rich cultural heritage of Indonesia through traditional performances.',
      type: 'cultural'
    },
    {
      id: 7,
      time: '13:00 - 14:30',
      title: 'Investment Opportunities',
      speaker: 'Anna Müller',
      location: 'Investor Lounge',
      description: 'Discover high-potential investment opportunities in emerging markets.',
      type: 'workshop'
    },
  ],
  day4: [],
  day5: [],
  day6: []
};

const typeColors = {
  keynote: 'from-purple-500 to-indigo-600',
  workshop: 'from-cyan-500 to-blue-600',
  panel: 'from-amber-500 to-orange-600',
  networking: 'from-emerald-500 to-teal-600',
  cultural: 'from-red-500 to-pink-600'
};

const typeIcons = {
  keynote: '🎤',
  workshop: '💡',
  panel: '👥',
  networking: '🤝',
  cultural: '🎭'
};

const ScheduleSection = () => {
  const [activeDay, setActiveDay] = useState<Day>('day1');
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  const days = [
    { id: 'day1', label: 'Day 1', date: 'Aug 5', weekday: 'Tuesday' },
    { id: 'day2', label: 'Day 2', date: 'Aug 6', weekday: 'Wednesday' },
    { id: 'day3', label: 'Day 3', date: 'Aug 7', weekday: 'Thursday' },
    { id: 'day4', label: 'Day 4', date: 'Aug 8', weekday: 'Friday' },
    { id: 'day5', label: 'Day 5', date: 'Aug 9', weekday: 'Saturday' },
    { id: 'day6', label: 'Day 6', date: 'Aug 10', weekday: 'Sunday' },
  ];

  const toggleSession = (id: number) => {
    setExpandedSession(expandedSession === id ? null : id);
  };

  return (
    <section id="schedule" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/90 -z-10"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 mb-4 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              Event Schedule
            </span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent"
          >
            Event <span className="text-amber-400">Program</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-400"
          >
            Explore the exciting lineup of keynotes, workshops, and cultural events
          </motion.p>
        </div>

        {/* Day Selector */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id as Day)}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                activeDay === day.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="block font-bold">{day.label}</span>
                <span className="text-xs opacity-80">{day.weekday}</span>
              </div>
            </button>
          ))}
        </motion.div>

        {/* Schedule Items */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto space-y-4"
        >
          {scheduleData[activeDay].length > 0 ? (
            scheduleData[activeDay].map((item) => (
              <div 
                key={item.id}
                className={`bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/5 overflow-hidden transition-all ${
                  expandedSession === item.id ? 'shadow-lg shadow-cyan-500/10' : ''
                }`}
              >
                <button
                  onClick={() => toggleSession(item.id)}
                  className="w-full text-left p-6 focus:outline-none"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start md:items-center gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${typeColors[item.type]} flex items-center justify-center text-white text-xl`}>
                        {typeIcons[item.type]}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {item.time}
                          </span>
                          {item.speaker && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {item.speaker}
                            </span>
                          )}
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {item.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center justify-end">
                      {expandedSession === item.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>
                
                <AnimatePresence>
                  {expandedSession === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0 text-gray-300 border-t border-white/5">
                        <p className="mb-4">{item.description}</p>
                        <button className="inline-flex items-center text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                          Add to calendar
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <p className="text-gray-400">Schedule for this day will be announced soon</p>
              <button className="mt-4 px-6 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-all">
                Get Notified
              </button>
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <button className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-amber-900 font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-amber-500/20">
            Download Full Schedule
          </button>
          <p className="mt-4 text-sm text-gray-500">PDF, iCal, and Google Calendar options available</p>
        </motion.div>
      </div>
    </section>
  );
};

export default ScheduleSection;

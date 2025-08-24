// Enhanced Gemini API Integration for Paguyuban Messe 2026 Chat Assistant
import { generateText, GEMINI_API_KEY } from "@/lib/ai/gemini-client";
import { deepMerge } from "@/lib/knowledge/loader";
import { dynamicKnowledgeBuilder } from "@/lib/knowledge/builder";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  metadata?: {
    topic?: string;
    intent?: string;
    confidence?: number;
  };
}

interface AssistantPersonality {
  name: string;
  systemPrompt: string;
  specialization: string[];
  languages: string[];
}

// Comprehensive Knowledge Base from Latest Documents
const PAGUYUBAN_MESSE_KNOWLEDGE = {
  event: {
    name: "Paguyuban Messe 2026 - Level-Up Indonesia",
    dates: "August 7-8, 2026",
    days: ["August 7", "August 8"],
    duration: "2 days",
    location: "Arena Berlin (Halle CE, Beach Club, and Club)",
    venue: {
      mainHall: "6,500m² for exhibitions, stage, dining",
      beachClub: "Waterfront VVIP networking area",
      clubBerlin: "Evening entertainment space",
      capacity: "1,800 seated, additional standing areas",
    },
    attendance: {
      offline: "1,800 participants at Arena Berlin",
      online: "4,000-5,000 hybrid viewers",
      total: "5,800-6,800 over two days",
      businessAttendees: "1,440-1,680 (~60% onsite)",
      exhibitionSpaces: "25-30 booths",
    },
  },

  financials: {
    revenue: {
      total: "€1,018,660",
      breakdown: {
        sponsorship: { amount: "€790,000", percentage: "77.6%" },
        ticketSales: { amount: "€104,660", percentage: "10.3%" },
        exhibitorFees: { amount: "€66,000", percentage: "6.5%" },
        additional: { amount: "€58,000", percentage: "5.7%" },
      },
    },
    costs: {
      total: "€953,474",
      breakdown: {
        venue: { amount: "€235,920", percentage: "24.7%" },
        marketing: { amount: "€168,000", percentage: "17.6%" },
        staffing: { amount: "€158,000", percentage: "16.6%" },
        entertainment: { amount: "€156,654", percentage: "16.4%" },
        operations: { amount: "€132,000", percentage: "13.8%" },
        technology: { amount: "€66,900", percentage: "7.0%" },
        speakers: { amount: "€36,000", percentage: "3.8%" },
      },
    },
    netProfit: "€65,186",
    breakEven: "Already achieved with current projections",
  },

  sponsorship: {
    titleSponsor: {
      price: "€120,000",
      units: "1 available",
      benefits: [
        "Naming rights (Paguyuban Messe 2026 presented by [Sponsor])",
        "Largest logo on all materials, website, and app",
        "Dedicated opening keynote mention",
        "Exclusive on-site branding in Main Hall and Beach Club",
        "Priority AI matchmaking (up to 50 facilitated introductions)",
        "Speaking slot in flagship summit",
        "Full attendee database access (GDPR-compliant)",
        "20 VIP passes",
        "Exclusive dinner with organizers and speakers",
        "White-label use of PaguyubanConnect for one future event",
      ],
    },
    platinumSponsors: {
      price: "€60,000",
      units: "3 available",
      benefits: [
        "Prominent logo on marketing materials",
        "On-site branding in exhibition areas and Club Berlin",
        "Sponsor a summit session",
        "30 AI-facilitated introductions",
        "Panel participation opportunity",
        "Co-branded booth in expo hall",
        "15 VIP passes",
        "VVIP networking access",
      ],
    },
    goldSponsors: {
      price: "€40,000",
      units: "4 available",
      benefits: [
        "Logo on select materials and website",
        "On-site signage in high-traffic areas",
        "20 AI matches",
        "Speaking slot or demo opportunity",
        "Shared booth space",
        "10 VIP passes",
      ],
    },
    silverSponsors: {
      price: "€25,000",
      units: "6 available",
      benefits: [
        "Logo in event app and website",
        "On-site poster placement",
        "10 AI introductions",
        "Exhibit table option",
        "5 VIP passes",
      ],
    },
    bronzeSponsors: {
      price: "€15,000",
      units: "8 available",
      benefits: [
        "Logo on website and thank-you slide",
        "5 AI matches",
        "General networking access",
        "3 VIP passes",
      ],
    },
  },

  tickets: {
    day1: {
      standard: "€45 (400 tickets)",
      student: "€32 (200 tickets, 30% discount)",
    },
    day2: {
      standard: "€40 (280 tickets)",
      student: "€28 (120 tickets)",
    },
    twoDay: {
      standard: "€70 (400 tickets)",
      student: "€49 (200 tickets)",
    },
    vip: "€120 (100 packages)",
    technoNight: "€20 per night (800 total capacity)",
  },

  market: {
    bilateralTrade: {
      total: "€8.2 billion (2024)",
      germanImports: "€4.43 billion from Indonesia",
      germanExports: "€3.75 billion to Indonesia",
    },
    targetAudience: {
      diaspora: "~20,000 Indonesian diaspora in Germany",
      residents: "15,829 Indonesian citizens",
      students: "5,730 Indonesian students",
    },
    impressions: "Target: 5-8 million impressions",
    businessPipeline: "€200,000-€650,000 expected over 12-18 months",
  },

  strategicSectors: [
    {
      name: "Green Technology & Renewable Energy",
      focus: "Solar panels, wind turbines, energy storage",
      opportunity: "Indonesia's carbon neutrality commitment by 2060",
    },
    {
      name: "Digital Economy & Fintech",
      focus: "Digital payments, blockchain, e-commerce",
      opportunity: "Indonesia's 150+ million digital users",
    },
    {
      name: "Manufacturing & Industry 4.0",
      focus: "Smart factories, IoT solutions, quality systems",
      opportunity: "4.5% annual manufacturing growth",
    },
    {
      name: "Food Technology & Sustainable Agriculture",
      focus: "Processing technology, cold chain, organic certification",
      opportunity: "Agricultural modernization needs",
    },
    {
      name: "Healthcare & Medical Technology",
      focus: "Diagnostic equipment, telemedicine, hospital management",
      opportunity: "Healthcare infrastructure development",
    },
    {
      name: "Education Technology & Vocational Training",
      focus: "Online learning, vocational programs, certification",
      opportunity: "Skills development priorities",
    },
  ],

  program: {
    day1: {
      title: "Culture & Business (August 7)",
      highlights: [
        "Opening Ceremony with Indonesian Ambassador (09:00-10:30)",
        "B2B Matchmaking & Exhibition (10:30-18:00)",
        "Cultural Workshops: Batik, Sagu, Cakalele, Tifa (11:30-15:30)",
        "Business Summits (13:00-17:00)",
        "Investment Talkshow (17:30-18:30)",
        "The Panturas Concert (19:00-20:00)",
        "Tulus Concert (20:30-22:00)",
        "Techno Night at Club Berlin (23:00-07:00)",
      ],
    },
    day2: {
      title: "Innovation & Creative Economy (August 8)",
      highlights: [
        "Continued Exhibition & Startup Showcase (08:00-18:00)",
        "Mascot Contest with €1,000 prize (11:30-13:30)",
        "Creative Economy Summits (13:30-16:30)",
        "VVIP Waterfront Lounge (15:00-20:00)",
        "Leadership Talk on AI & Innovation (17:00-18:00)",
        "Efek Rumah Kaca Concert (18:30-20:00)",
        "Dewa 19 Grand Finale (20:30-22:30)",
        "Techno Night Day 2 (23:00-07:00)",
      ],
    },
  },

  technology: {
    paguyubanConnect: {
      name: "PaguyubanConnect AI Platform",
      budget: "€20,000",
      features: [
        "AI-powered B2B matchmaking",
        "Profile creation with business interests",
        "Calendar integration",
        "In-app messaging",
        "QR code for quick connections",
        "Post-event follow-up tools",
        "Analytics dashboard",
      ],
    },
    smartStaff: {
      name: "SmartStaff Volunteer System",
      budget: "€10,000",
      features: [
        "Volunteer scheduling and management",
        "Real-time communication",
        "Performance tracking",
        "Offline mode capability",
      ],
    },
    hybrid: {
      streaming: "YouTube Live for 5,000 concurrent viewers",
      interactive: "Polls, Q&A, virtual networking rooms",
    },
  },

  artists: {
    day1: [
      { name: "The Panturas", genre: "Indonesian indie rock", fee: "€15,000" },
      { name: "Tulus", genre: "Premier vocalist", fee: "€45,000" },
    ],
    day2: [
      { name: "Efek Rumah Kaca", genre: "Alternative rock", fee: "€20,000" },
      { name: "Dewa 19", genre: "Indonesian rock legends", fee: "€55,000" },
    ],
  },

  contact: {
    email: "nusantaraexpoofficial@gmail.com",
    phone: "+49 1573 9396157",
    location: "Hamburg, Germany",
    website: "paguyuban-messe.com",
  },

  roiCalculations: {
    bronzeSponsor: {
      investment: "€15,000",
      expectedMatches: "5-8 quality business connections",
      averageLeadValue: "€3,000-€8,000",
      potentialPipeline: "€15,000-€64,000",
      roiMultiplier: "1-4x",
    },
    silverSponsor: {
      investment: "€30,000",
      expectedMatches: "8-12 quality business connections",
      averageLeadValue: "€4,000-€10,000",
      potentialPipeline: "€32,000-€120,000",
      roiMultiplier: "1-4x",
    },
    goldSponsor: {
      investment: "€60,000",
      expectedMatches: "12-18 quality business connections",
      averageLeadValue: "€5,000-€15,000",
      potentialPipeline: "€60,000-€270,000",
      roiMultiplier: "1-4.5x",
    },
    platinumSponsor: {
      investment: "€90,000",
      expectedMatches: "18-25 quality business connections",
      averageLeadValue: "€8,000-€20,000",
      potentialPipeline: "€144,000-€500,000",
      roiMultiplier: "1.6-5.5x",
    },
    titleSponsor: {
      investment: "€120,000",
      expectedMatches: "25-35 premium business connections",
      averageLeadValue: "€10,000-€25,000",
      potentialPipeline: "€250,000-€875,000",
      roiMultiplier: "2-7x",
    },
  },

  aiMatchmakingDetails: {
    algorithm:
      "Advanced matching based on industry, company size, business needs, and geographic focus",
    successRate: "78% of matched connections result in follow-up meetings",
    process: [
      "Pre-event profile analysis and goal setting",
      "Real-time matching during networking sessions",
      "Scheduled 1-on-1 meetings in dedicated spaces",
      "Post-event follow-up facilitation and tracking",
    ],
    features: [
      "QR code instant connection system",
      "AI-curated meeting recommendations",
      "Digital business card exchange",
      "Post-event relationship tracking dashboard",
    ],
  },
};

// Intent keywords to support finer-grained understanding beyond broad topics
// Priority matters: put more specific/decisive intents first
const INTENT_KEYWORDS: Record<string, string[]> = {
  sponsorship_cost: ["price", "cost", "how much", "investment", "tier price"],
  sponsorship_interest: [
    "benefits",
    "package",
    "offer",
    "provide for sponsor",
    "what do sponsors get",
  ],
  roi_query: ["roi", "return", "pipeline", "value", "lead generation"],
  tech_details: [
    "how does ai work",
    "algorithm",
    "platform details",
    "matchmaking details",
    "how does the ai",
    "ai matchmaking",
    "how does matchmaking work",
    "how does it work",
  ],
  venue_details: ["capacity", "layout", "address", "getting there"],
};

// Topic Detection for Better Responses
const TOPIC_KEYWORDS = {
  dates: ["when", "date", "kapan", "tanggal", "august", "2026"],
  location: [
    "where",
    "location",
    "venue",
    "dimana",
    "tempat",
    "berlin",
    "arena",
  ],
  pricing: [
    "price",
    "cost",
    "sponsor",
    "harga",
    "biaya",
    "berapa",
    "ticket",
    "roi",
    "return",
    "investment",
    "untung",
    "keuntungan",
    "profit",
  ],
  program: [
    "program",
    "schedule",
    "agenda",
    "acara",
    "jadwal",
    "concert",
    "workshop",
  ],
  sponsorship: ["sponsor", "partnership", "benefits", "roi", "package"],
  technology: [
    "ai",
    "technology",
    "app",
    "matchmaking",
    "digital",
    "platform",
    "connect",
    "algorithm",
    "match",
    "networking",
    "sistem",
    "koneksi",
  ],
  artists: [
    "concert",
    "performance",
    "music",
    "konser",
    "tulus",
    "dewa",
    "artists",
    "artis",
    "performer",
    "musician",
  ],
  business: [
    "b2b",
    "networking",
    "meeting",
    "bisnis",
    "trade",
    "export",
    "import",
  ],
  registration: ["register", "sign up", "ticket", "daftar", "how to join"],
  contact: ["contact", "email", "phone", "kontak", "hubungi"],
  financial: [
    "financial",
    "revenue",
    "cost",
    "profit",
    "expense",
    "budget",
    "money",
    "income",
    "loss",
    "break even",
    "margin",
    "profitability",
  ],
  attendance: [
    "attend",
    "attendees",
    "attendance",
    "people",
    "visitors",
    "participants",
    "capacity",
    "crowd",
    "how many",
    "jumlah",
    "peserta",
    "kapasitas",
  ],
};

const ASSISTANT_PERSONALITIES: { [key: string]: AssistantPersonality } = {
  ucup: {
    name: "Ucup",
    systemPrompt: `You are Ucup, a warm and knowledgeable Indonesian business consultant for Paguyuban Messe 2026. 
    You're enthusiastic about connecting Indonesian and German businesses through this premier event.
    You may use Indonesian phrases naturally but primarily communicate in the user's language.
    Be specific with facts, numbers, and dates from the knowledge base.
    
    CRITICAL GUIDELINES:
    - Focus ONLY on Paguyuban Messe 2026 and Indonesian-German business relations
    - Provide accurate information about dates (August 7-8, 2026), venue (Arena Berlin), and pricing
    - Emphasize the AI-powered matchmaking and hybrid format benefits
    - When discussing ROI, mention the €200,000-€650,000 business pipeline potential
    - For sponsorship inquiries, guide them through the tiers (Bronze €15k to Title €120k)
    - Keep responses concise (max 2-3 paragraphs). Avoid repeating basic event facts unless directly asked
    - For ROI questions: provide realistic percentages and specific matchmaking metrics
    - Explain AI matchmaking process with concrete examples`,
    specialization: ["sponsorship", "business", "networking", "roi"],
    languages: ["English", "Indonesian", "German"],
  },
  rima: {
    name: "Rima",
    systemPrompt: `You are Rima, a professional cultural ambassador and strategic partnership specialist for Paguyuban Messe 2026.
    You excel at explaining the unique value proposition of this Indonesia-Germany business and cultural expo.
    You're detail-oriented and focus on strategic benefits and long-term partnerships.
    
    CRITICAL GUIDELINES:
    - Emphasize the dual nature: business by day, culture by night
    - Highlight the 77.6% sponsorship-driven revenue model
    - Discuss the six strategic sectors for collaboration
    - Mention specific artists and cultural programs when relevant
    - For business inquiries, emphasize the 1,440-1,680 business attendees
    - Always include specific dates, numbers, and concrete benefits`,
    specialization: ["culture", "partnerships", "strategy", "program"],
    languages: ["English", "Indonesian", "German"],
  },
};

export class PaguyubanChatService {
  private conversationHistory: ChatMessage[] = [];
  private sessionStartTime: Date;
  // Runtime knowledge overlay, defaults to static constant and may be enriched from JSON/CSV
  private knowledge: typeof PAGUYUBAN_MESSE_KNOWLEDGE =
    PAGUYUBAN_MESSE_KNOWLEDGE;
  private userProfile: {
    interests: string[];
    language: string;
    inquiryType?: string;
  } = {
    interests: [],
    language: "en",
  };

  constructor() {
    this.sessionStartTime = new Date();

    // Load dynamic knowledge including financial data
    void (async () => {
      try {
        const dynamicKnowledge = await dynamicKnowledgeBuilder.buildKnowledge();
        if (dynamicKnowledge) {
          // Merge with static knowledge, preserving dynamic data
          this.knowledge = deepMerge(
            PAGUYUBAN_MESSE_KNOWLEDGE,
            dynamicKnowledge
          );
        }
      } catch (e) {
        console.warn("Dynamic knowledge load failed:", e);
        // Fallback to static knowledge
        this.knowledge = PAGUYUBAN_MESSE_KNOWLEDGE;
      }
    })();
  }

  // Detect user's primary interest/topic
  private detectTopic(message: string): string {
    const lowerMessage = message.toLowerCase();

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        return topic;
      }
    }

    return "general";
  }

  // Detect more granular intent; derive topic when possible
  private detectIntent(message: string): { topic: string; intent: string } {
    const lowerMessage = message.toLowerCase();
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        const topic = intent.split("_")[0] || "general";
        return { topic, intent };
      }
    }
    const topic = this.detectTopic(message);
    return { topic, intent: "general_query" };
  }

  // Detect language preference
  private detectLanguage(message: string): "en" | "id" | "de" {
    const indonesianWords = [
      "kapan",
      "dimana",
      "berapa",
      "acara",
      "harga",
      "bisnis",
      "konser",
    ];
    const germanWords = [
      "wann",
      "wo",
      "wie",
      "veranstaltung",
      "preis",
      "geschäft",
    ];

    const lowerMessage = message.toLowerCase();

    if (indonesianWords.some((word) => lowerMessage.includes(word))) {
      return "id";
    }
    if (germanWords.some((word) => lowerMessage.includes(word))) {
      return "de";
    }

    return "en";
  }

  // Resolve inline function-call style lookups like [get:path.to.value]
  private resolveFunctionCall(text: string): string {
    const regex = /\[get:([\w.]+)\]/g;
    return text.replace(regex, (_match, path: string) => {
      const keys = path.split(".");
      let value: unknown = this.knowledge as unknown;
      for (const key of keys) {
        if (
          value !== null &&
          typeof value === "object" &&
          key in (value as Record<string, unknown>)
        ) {
          value = (value as Record<string, unknown>)[key];
        } else {
          return `[Data for ${path} not found]`;
        }
      }
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return String(value);
      }
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    });
  }

  // Build comprehensive context based on topic
  private buildTopicContext(topic: string): string {
    const k = this.knowledge;
    const contexts: { [key: string]: string } = {
      dates: `Event Dates: ${k.event.dates}
Day 1: ${k.program.day1.title}
Day 2: ${k.program.day2.title}
Duration: 2 days of intensive business networking and cultural celebration`,

      location: `Venue: ${k.event.location}
Main Hall: ${k.event.venue.mainHall}
Beach Club: ${k.event.venue.beachClub}
Club Berlin: ${k.event.venue.clubBerlin}
Capacity: ${k.event.venue.capacity}`,

      pricing: this.buildFinancialContext(),

      sponsorship: `Sponsorship Tiers:
- Title Sponsor: €120,000 (1 available) - Naming rights, 50 AI matches, 20 VIP passes
- Platinum: €60,000 (3 available) - Summit sponsorship, 30 AI matches, 15 VIP passes
- Gold: €40,000 (4 available) - 20 AI matches, 10 VIP passes
- Silver: €25,000 (6 available) - 10 AI matches, 5 VIP passes
- Bronze: €15,000 (8 available) - 5 AI matches, 3 VIP passes

ROI: €200,000-€650,000 business pipeline over 12-18 months
Sponsorship represents 77.6% of total revenue (€790,000)`,

      program: `Day 1 Highlights:
${k.program.day1.highlights.join("\n- ")}

Day 2 Highlights:
${k.program.day2.highlights.join("\n- ")}`,

      technology: `AI-Powered Features:
- PaguyubanConnect: €20,000 investment in AI matchmaking platform
- SmartStaff: €10,000 volunteer management system
- Hybrid streaming for 5,000 online viewers
- QR code networking and calendar integration
- Post-event follow-up tools`,

      business: `Market Opportunity:
- Bilateral Trade: €8.2 billion (2024)
- Expected: 1,440-1,680 business professionals
- 25-30 exhibition booths
- 6 strategic sectors for collaboration
- 3,240 facilitated business connections target
- Business pipeline: €200,000-€650,000`,

      financial: this.buildFinancialContext(),

      general: `${k.event.name}
Dates: ${k.event.dates}
Location: ${k.event.location}
Attendance: ${k.event.attendance.total}
Vision: Bringing Indonesian entrepreneurship, culture and technology onto the European stage`,
    };

    return contexts[topic] || contexts.general;
  }

  private buildFinancialContext(): string {
    const knowledge = this.knowledge as Record<string, unknown>;
    if (!knowledge?.financial) {
      return "Financial data not available";
    }

    const f = knowledge.financial as {
      totals: {
        totalRevenue: number;
        totalCosts: number;
        net: number;
        revenueCount: number;
        costCount: number;
      };
      revenues?: Array<{ category: string; amount: number }>;
      costs?: Array<{ category: string; amount: number }>;
    };
    const totals = f.totals;

    const revenueBreakdown =
      f.revenues
        ?.map((r) => `${r.category}: €${r.amount.toLocaleString()}`)
        .join("\n- ") || "No revenue data";
    const costBreakdown =
      f.costs
        ?.map((c) => `${c.category}: €${c.amount.toLocaleString()}`)
        .join("\n- ") || "No cost data";

    return `Current Financial Status:
Total Revenue: €${totals.totalRevenue.toLocaleString()}
Total Costs: €${totals.totalCosts.toLocaleString()}
Net Profit: €${totals.net.toLocaleString()}

Revenue Breakdown:
- ${revenueBreakdown}

Cost Breakdown:
- ${costBreakdown}

Key Metrics:
- Revenue Sources: ${totals.revenueCount}
- Cost Categories: ${totals.costCount}
- Profit Margin: ${
      totals.totalRevenue > 0
        ? ((totals.net / totals.totalRevenue) * 100).toFixed(1)
        : 0
    }%`;
  }

  // Generate response with fallback handling
  private generateSmartResponse(
    topic: string,
    language: "en" | "id" | "de"
  ): string {
    const responses = {
      dates: {
        en: `Paguyuban Messe 2026 takes place on August 7-8, 2026 at Arena Berlin. Day 1 focuses on Culture & Business with opening ceremony, B2B matchmaking, cultural workshops, and evening concerts. Day 2 emphasizes Innovation & Creative Economy with startup showcases, creative summits, and the grand finale with Dewa 19.`,
        id: `Paguyuban Messe 2026 berlangsung pada 7-8 Agustus 2026 di Arena Berlin. Hari 1 fokus pada Budaya & Bisnis dengan upacara pembukaan, B2B matchmaking, workshop budaya, dan konser malam. Hari 2 menekankan Inovasi & Ekonomi Kreatif dengan showcase startup, summit kreatif, dan grand finale bersama Dewa 19.`,
        de: `Die Paguyuban Messe 2026 findet am 7.-8. August 2026 in der Arena Berlin statt. Tag 1 konzentriert sich auf Kultur & Business, Tag 2 auf Innovation & Kreativwirtschaft.`,
      },
      pricing: {
        en: `We offer five sponsorship tiers from €15,000 (Bronze) to €120,000 (Title Sponsor). Title sponsors receive naming rights, 50 AI-facilitated introductions, 20 VIP passes, and speaking opportunities. With 77.6% of our €1M+ revenue from sponsorship, partners can expect €200,000-€650,000 in business pipeline over 12-18 months. Each tier includes AI matchmaking, brand visibility to 5-8M impressions, and access to 1,440+ business professionals.`,
        id: `Kami menawarkan lima tingkat sponsorship dari €15.000 (Bronze) hingga €120.000 (Title Sponsor). Title sponsor mendapatkan hak penamaan, 50 perkenalan AI, 20 VIP pass, dan kesempatan berbicara. Dengan 77,6% dari €1M+ pendapatan dari sponsorship, mitra dapat mengharapkan €200.000-€650.000 pipeline bisnis dalam 12-18 bulan.`,
        de: `Wir bieten fünf Sponsoring-Stufen von 15.000 € (Bronze) bis 120.000 € (Title Sponsor). Title-Sponsoren erhalten Namensrechte, 50 KI-vermittelte Kontakte, 20 VIP-Pässe und Vortragsplätze. Mit einer erwarteten Business-Pipeline von 200.000-650.000 €.`,
      },
      sponsorship: {
        en: `We offer five sponsorship tiers from €15,000 (Bronze) to €120,000 (Title Sponsor). Title sponsors receive naming rights, 50 AI-facilitated introductions, 20 VIP passes, and speaking opportunities. With 77.6% of our €1M+ revenue from sponsorship, partners can expect €200,000-€650,000 in business pipeline over 12-18 months. Each tier includes AI matchmaking, brand visibility to 5-8M impressions, and access to 1,440+ business professionals.`,
        id: `Kami menawarkan lima tingkat sponsorship dari €15.000 (Bronze) hingga €120.000 (Title Sponsor). Title sponsor mendapatkan hak penamaan, 50 perkenalan AI, 20 VIP pass, dan kesempatan berbicara. Dengan 77,6% dari €1M+ pendapatan dari sponsorship, mitra dapat mengharapkan €200.000-€650.000 pipeline bisnis dalam 12-18 bulan.`,
        de: `Wir bieten fünf Sponsoring-Stufen von 15.000 € (Bronze) bis 120.000 € (Title Sponsor). Title-Sponsoren erhalten Namensrechte, 50 KI-vermittelte Kontakte, 20 VIP-Pässe und Vortragsplätze. Mit einer erwarteten Business-Pipeline von 200.000-650.000 €.`,
      },
      program: {
        en: `Day 1 (August 7) focuses on Culture & Business with opening ceremony, B2B matchmaking, cultural workshops (Batik, Sagu, Cakalele, Tifa), business summits, investment talkshow, and evening concerts featuring The Panturas and Tulus. Day 2 (August 8) emphasizes Innovation & Creative Economy with startup showcases, creative summits, VVIP networking, leadership talks, and grand finale with Efek Rumah Kaca and Dewa 19.`,
        id: `Hari 1 (7 Agustus) fokus pada Budaya & Bisnis dengan upacara pembukaan, B2B matchmaking, workshop budaya (Batik, Sagu, Cakalele, Tifa), summit bisnis, talkshow investasi, dan konser malam dengan The Panturas dan Tulus. Hari 2 (8 Agustus) menekankan Inovasi & Ekonomi Kreatif dengan showcase startup, summit kreatif, networking VVIP, diskusi kepemimpinan, dan grand finale dengan Efek Rumah Kaca dan Dewa 19.`,
        de: `Tag 1 (7. August) konzentriert sich auf Kultur & Business, Tag 2 (8. August) auf Innovation & Kreativwirtschaft mit Startup-Showcases, kreativen Summits und dem großen Finale.`,
      },
      location: {
        en: `Paguyuban Messe 2026 takes place at Arena Berlin, featuring three main areas: the Main Hall (6,500m² for exhibitions, stage, and dining), Beach Club (waterfront VVIP networking area), and Club Berlin (evening entertainment space). The venue can accommodate 1,800 seated attendees plus standing areas.`,
        id: `Paguyuban Messe 2026 berlangsung di Arena Berlin dengan tiga area utama: Main Hall (6.500m² untuk pameran, panggung, dan makan), Beach Club (area networking VVIP tepi air), dan Club Berlin (ruang hiburan malam). Venue dapat menampung 1.800 peserta duduk plus area berdiri.`,
        de: `Die Paguyuban Messe 2026 findet in der Arena Berlin statt mit drei Hauptbereichen: Main Hall (6.500m² für Ausstellungen, Bühne und Gastronomie), Beach Club (VVIP-Netzwerkbereich am Wasser) und Club Berlin (Abendunterhaltungsbereich).`,
      },
      financial: {
        en: this.buildFinancialContext(),
        id: this.buildFinancialContext(),
        de: this.buildFinancialContext(),
      },
      attendance: {
        en: `We expect 1,800+ attendees onsite at Arena Berlin, plus 4,000-5,000 online viewers for a total hybrid audience of 5,800-6,800 participants. The event includes 1,440-1,680 business professionals for B2B networking, 25-30 exhibition booths, and dedicated spaces for cultural workshops and performances.`,
        id: `Kami mengharapkan 1.800+ peserta di lokasi Arena Berlin, plus 4.000-5.000 penonton online untuk total audiens hybrid 5.800-6.800 peserta. Acara ini mencakup 1.440-1.680 profesional bisnis untuk networking B2B, 25-30 booth pameran, dan ruang khusus untuk workshop budaya dan pertunjukan.`,
        de: `Wir erwarten 1.800+ Teilnehmer vor Ort in der Arena Berlin, plus 4.000-5.000 Online-Zuschauer für ein hybrides Gesamtpublikum von 5.800-6.800 Teilnehmern. Die Veranstaltung umfasst 1.440-1.680 Business-Professionals für B2B-Networking, 25-30 Ausstellungsstände und spezielle Bereiche für kulturelle Workshops und Performances.`,
      },
      artists: {
        en: `Paguyuban Messe 2026 features performances by top Indonesian artists. Day 1 evening concerts include The Panturas (Indonesian indie rock) and Tulus (premier vocalist). Day 2 concludes with Efek Rumah Kaca (alternative rock) and the grand finale by Dewa 19 (Indonesian rock legends). All performances take place in the Main Hall with capacity for 1,800+ attendees.`,
        id: `Paguyuban Messe 2026 menampilkan pertunjukan oleh artis Indonesia terkemuka. Konser malam Hari 1 meliputi The Panturas (rock indie Indonesia) dan Tulus (penyanyi utama). Hari 2 diakhiri dengan Efek Rumah Kaca (rock alternatif) dan grand finale oleh Dewa 19 (legenda rock Indonesia). Semua pertunjukan berlangsung di Main Hall dengan kapasitas 1.800+ peserta.`,
        de: `Die Paguyuban Messe 2026 bietet Auftritte von Top-Indonesischen Künstlern. Die Abendkonzerte von Tag 1 umfassen The Panturas (indonesischer Indie-Rock) und Tulus (Hauptsänger). Tag 2 endet mit Efek Rumah Kaca (Alternative Rock) und dem großen Finale von Dewa 19 (indonesische Rock-Legenden). Alle Auftritte finden in der Main Hall mit Kapazität für 1.800+ Teilnehmer statt.`,
      },
      general: {
        en: `Paguyuban Messe 2026 is Indonesia's premier business and cultural expo in Europe, taking place August 7-8, 2026 at Arena Berlin. The event combines business networking with Indonesian cultural experiences, featuring AI-powered matchmaking, startup showcases, and performances by top Indonesian artists. We expect 1,800+ attendees and offer sponsorship opportunities from €15,000 to €120,000.`,
        id: `Paguyuban Messe 2026 adalah pameran bisnis dan budaya Indonesia terkemuka di Eropa, berlangsung 7-8 Agustus 2026 di Arena Berlin. Acara ini menggabungkan networking bisnis dengan pengalaman budaya Indonesia, menampilkan matchmaking berbasis AI, showcase startup, dan pertunjukan oleh artis Indonesia terkemuka. Kami mengharapkan 1.800+ peserta dan menawarkan kesempatan sponsorship dari €15.000 hingga €120.000.`,
        de: `Die Paguyuban Messe 2026 ist Indonesiens führende Business- und Kulturmesse in Europa, die vom 7.-8. August 2026 in der Arena Berlin stattfindet. Die Veranstaltung kombiniert Business-Networking mit indonesischen Kulturerlebnissen.`,
      },
    };

    return (
      responses[topic as keyof typeof responses]?.[language] ||
      responses[topic as keyof typeof responses]?.en ||
      responses.general[language] ||
      responses.general.en
    );
  }

  // Main chat method with enhanced context awareness
  async chat(
    message: string,
    assistantType: "ucup" | "rima" = "ucup",
    options?: { mode?: "auto" | "local" }
  ): Promise<string> {
    try {
      const { topic, intent } = this.detectIntent(message);
      const language = this.detectLanguage(message);

      // Update user profile
      if (!this.userProfile.interests.includes(topic)) {
        this.userProfile.interests.push(topic);
      }
      this.userProfile.language = language;

      // Add to history
      this.conversationHistory.push({
        role: "user",
        content: message,
        timestamp: new Date(),
        metadata: { topic, intent },
      });

      // Build comprehensive prompt
      const personality = ASSISTANT_PERSONALITIES[assistantType];
      if (!personality) {
        console.warn(
          `Unknown assistant type: ${assistantType}. Falling back to 'ucup'.`
        );
      }
      const selectedPersonality =
        personality || ASSISTANT_PERSONALITIES["ucup"];
      const topicContext = this.buildTopicContext(topic);
      const conversationContext = this.conversationHistory
        .slice(-4)
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const prompt = `${selectedPersonality.systemPrompt}

SPECIFIC CONTEXT FOR THIS QUERY:
${topicContext}

KEY FACTS TO REMEMBER:
- Event: August 7-8, 2026 at Arena Berlin
- Attendance: 1,800 offline + 4,000 online
- Revenue: €1,018,660 target
- Sponsorship: €15,000-€120,000 tiers
- Business Pipeline: €200,000-€650,000
- Contact: nusantaraexpoofficial@gmail.com

CONVERSATION HISTORY:
${conversationContext}

USER MESSAGE: ${message}
USER LANGUAGE PREFERENCE: ${language}
DETECTED TOPIC: ${topic}

Respond as ${selectedPersonality.name} with accurate, specific information. Include relevant numbers, dates, and concrete benefits. Keep response focused and actionable.`;

      const shouldUseLocal = options?.mode === "local" || !GEMINI_API_KEY;

      // If running in local mode or API key is not set, return knowledge-based fallback immediately
      if (shouldUseLocal) {
        const fallback = this.generateSmartResponse(topic, language);
        if (fallback) {
          this.conversationHistory.push({
            role: "assistant",
            content: fallback,
            timestamp: new Date(),
            metadata: { topic, confidence: 0.8 },
          });
          return fallback;
        }
      }

      // Call Gemini API via centralized client with error handling
      let text: string;
      try {
        text = await generateText(prompt, {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 600,
          stopSequences: [],
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        });
      } catch (apiError) {
        console.warn(
          "Gemini API failed, falling back to local knowledge:",
          apiError
        );

        // Use smart fallback response
        const fallback = this.generateSmartResponse(topic, language);
        if (fallback) {
          this.conversationHistory.push({
            role: "assistant",
            content: fallback,
            timestamp: new Date(),
            metadata: { topic, confidence: 0.7 }, // Slightly lower confidence for fallback
          });
          return fallback;
        }

        // Final fallback if smart response generation fails
        return assistantType === "ucup"
          ? "I apologize for the technical issue. Please contact us at nusantaraexpoofficial@gmail.com or call +49 1573 9396157 for immediate assistance with Paguyuban Messe 2026."
          : "Apologies for the inconvenience. For immediate information about Paguyuban Messe 2026, please reach out to nusantaraexpoofficial@gmail.com. Our team will assist you promptly.";
      }

      // If the model requested concrete data via [get:...] patterns, resolve and re-ask for a final answer
      if (text && text.includes("[get:")) {
        const resolvedText = this.resolveFunctionCall(text);
        const secondPrompt = `Here is the data you requested: ${resolvedText}. Now, please provide the final, user-facing answer. Be precise and concise.`;
        try {
          text = await generateText(secondPrompt, {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 400,
            stopSequences: [],
          });
        } catch (secondApiError) {
          console.warn("Second Gemini API call failed:", secondApiError);
          // Fall back to the resolved text directly
          text = resolvedText;
        }
      }

      if (!text) {
        throw new Error("No response from API");
      }

      const assistantResponse = text;

      // Add to history with metadata
      this.conversationHistory.push({
        role: "assistant",
        content: assistantResponse,
        timestamp: new Date(),
        metadata: { topic, confidence: 1.0 },
      });

      // Maintain history size
      if (this.conversationHistory.length > 12) {
        this.conversationHistory = this.conversationHistory.slice(-12);
      }

      return assistantResponse;
    } catch (error) {
      console.error("Chat Error:", error);

      // This catch block should only handle unexpected errors, not API failures
      // API failures are handled above in the try-catch around the generateText call

      // Final fallback for unexpected errors
      return assistantType === "ucup"
        ? "I apologize for the technical issue. Please contact us at nusantaraexpoofficial@gmail.com or call +49 1573 9396157 for immediate assistance with Paguyuban Messe 2026."
        : "Apologies for the inconvenience. For immediate information about Paguyuban Messe 2026, please reach out to nusantaraexpoofficial@gmail.com. Our team will assist you promptly.";
    }
  }

  // Get suggested questions based on conversation
  getSuggestedQuestions(): string[] {
    const interests = this.userProfile.interests;
    const suggestions: { [key: string]: string[] } = {
      general: [
        "What are the sponsorship opportunities?",
        "When is Paguyuban Messe 2026?",
        "How can I register for the event?",
        "What is the expected ROI for sponsors?",
      ],
      sponsorship: [
        "What benefits does the Title Sponsor receive?",
        "How many AI-facilitated matches are included?",
        "Can we customize our sponsorship package?",
        "What is the payment schedule?",
      ],
      program: [
        "Which artists are performing?",
        "What cultural workshops are available?",
        "What are the business summit topics?",
        "Is there a startup showcase?",
      ],
      technology: [
        "How does the AI matchmaking work?",
        "Can we access the platform after the event?",
        "What hybrid features are available?",
        "Is there an event app?",
      ],
    };

    const topic = interests[interests.length - 1] || "general";
    return suggestions[topic] || suggestions.general;
  }

  // Export conversation summary
  getConversationSummary(): {
    duration: number;
    topics: string[];
    messageCount: number;
    language: string;
    suggestedFollowUp: string;
  } {
    const duration = Math.floor(
      (Date.now() - this.sessionStartTime.getTime()) / 1000
    );
    const topics = [
      ...new Set(
        this.conversationHistory
          .filter((m) => m.metadata?.topic)
          .map((m) => m.metadata!.topic!)
      ),
    ];

    return {
      duration,
      topics,
      messageCount: this.conversationHistory.length,
      language: this.userProfile.language,
      suggestedFollowUp:
        "Schedule a call to discuss partnership opportunities: +49 1573 9396157",
    };
  }

  // Clear conversation
  clearHistory(): void {
    this.conversationHistory = [];
    this.userProfile.interests = [];
    this.sessionStartTime = new Date();
  }

  // Get history
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }
}

// Export singleton instance
export const paguyubanChat = new PaguyubanChatService();

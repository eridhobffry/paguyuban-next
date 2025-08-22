import { NextRequest, NextResponse } from "next/server";

// Import the static knowledge from gemini.ts
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

  contact: {
    email: "nusantaraexpoofficial@gmail.com",
    phone: "+49 1573 9396157",
    location: "Hamburg, Germany",
    website: "paguyuban-messe.com",
  },
};

// GET /api/admin/knowledge/static - Get static knowledge from gemini.ts
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      knowledge: PAGUYUBAN_MESSE_KNOWLEDGE,
      source: "static",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching static knowledge:", error);
    return NextResponse.json(
      { error: "Failed to fetch static knowledge" },
      { status: 500 }
    );
  }
}

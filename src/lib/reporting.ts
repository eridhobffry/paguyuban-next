/* eslint-disable @typescript-eslint/no-explicit-any */
import { dynamicKnowledgeBuilder } from "./knowledge/builder";

export interface Report {
  id: string;
  title: string;
  type: "financial" | "event" | "knowledge" | "chatbot";
  timestamp: string;
  summary: string;
  details: Record<string, unknown>;
  recommendations?: string[];
}

export class ReportingService {
  async generateReport(
    type: "financial" | "event" | "knowledge" | "chatbot"
  ): Promise<Report> {
    const knowledge = (await dynamicKnowledgeBuilder.buildKnowledge()) as any;

    switch (type) {
      case "financial":
        return this.generateFinancialReport(knowledge);
      case "event":
        return this.generateEventReport(knowledge);
      case "knowledge":
        return this.generateKnowledgeReport(knowledge);
      case "chatbot":
        return this.generateChatbotReport(knowledge);
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  private generateFinancialReport(knowledge: any): Report {
    const financial = knowledge.financial;
    if (!financial) {
      return {
        id: `financial-${Date.now()}`,
        title: "Financial Status Report",
        type: "financial",
        timestamp: new Date().toISOString(),
        summary: "Financial data not available",
        details: {},
        recommendations: ["Ensure financial data is properly configured"],
      };
    }

    const totals = financial.totals;
    const revenueByCategory = financial.revenueByCategory || {};
    const costsByCategory = financial.costsByCategory || {};

    // Calculate some basic analytics
    const profitMargin =
      totals.totalRevenue > 0 ? (totals.net / totals.totalRevenue) * 100 : 0;
    const topRevenueSource = Object.entries(revenueByCategory).reduce(
      (max, [category, items]) => {
        const total = (items as any[]).reduce(
          (sum: number, item: any) => sum + item.amount,
          0
        );
        return total > max.total ? { category, total } : max;
      },
      { category: "None", total: 0 }
    );

    const topCostCategory = Object.entries(costsByCategory).reduce(
      (max, [category, items]) => {
        const total = (items as any[]).reduce(
          (sum: number, item: any) => sum + item.amount,
          0
        );
        return total > max.total ? { category, total } : max;
      },
      { category: "None", total: 0 }
    );

    const recommendations = [];
    if (profitMargin < 5) {
      recommendations.push("Consider cost optimization strategies");
    }
    if (totals.net < 0) {
      recommendations.push("URGENT: Event is currently operating at a loss");
    }
    if (topCostCategory.total > totals.totalRevenue * 0.3) {
      recommendations.push(
        `High cost in ${topCostCategory.category} - review expenses`
      );
    }

    return {
      id: `financial-${Date.now()}`,
      title: "Financial Performance Report",
      type: "financial",
      timestamp: new Date().toISOString(),
      summary: `Event financials show ${profitMargin.toFixed(
        1
      )}% profit margin with €${totals.net.toLocaleString()} net profit`,
      details: {
        totals,
        revenueByCategory,
        costsByCategory,
        analytics: {
          profitMargin: profitMargin.toFixed(1) + "%",
          topRevenueSource,
          topCostCategory,
          revenueConcentration: Object.keys(revenueByCategory).length,
          costCategories: Object.keys(costsByCategory).length,
        },
      },
      recommendations,
    };
  }

  private generateEventReport(knowledge: any): Report {
    const event = knowledge.event;
    const financial = knowledge.financial;
    const sponsors = knowledge.sponsors || [];
    const artists = knowledge.artists || [];

    const totalAttendees = event?.attendance?.total || 0;
    const businessAttendees = event?.attendance?.businessAttendees || 0;
    const sponsorCount = sponsors.length;
    const artistCount = artists.length;

    const recommendations = [];
    if (totalAttendees < 1000) {
      recommendations.push(
        "Consider marketing strategies to increase attendance"
      );
    }
    if (sponsorCount < 10) {
      recommendations.push("Focus on sponsor acquisition to improve revenue");
    }
    if (businessAttendees < totalAttendees * 0.5) {
      recommendations.push(
        "Target more business professionals for networking opportunities"
      );
    }

    return {
      id: `event-${Date.now()}`,
      title: "Event Status Report",
      type: "event",
      timestamp: new Date().toISOString(),
      summary: `Event is ${
        event?.dates ? "scheduled" : "not scheduled"
      } with ${totalAttendees} expected attendees and ${sponsorCount} sponsors`,
      details: {
        event: {
          name: event?.name,
          dates: event?.dates,
          location: event?.location,
          capacity: event?.venue?.capacity,
        },
        attendance: event?.attendance,
        sponsors: {
          total: sponsorCount,
          details: sponsors,
        },
        artists: {
          total: artistCount,
          details: artists,
        },
        financial: financial?.totals
          ? {
              totalRevenue: financial.totals.totalRevenue,
              netProfit: financial.totals.net,
            }
          : null,
      },
      recommendations,
    };
  }

  private generateKnowledgeReport(knowledge: any): Report {
    const hasFinancial = !!knowledge.financial;
    const hasSpeakers = !!(knowledge.speakers && knowledge.speakers.length > 0);
    const hasArtists = !!(knowledge.artists && knowledge.artists.length > 0);
    const hasSponsors = !!(knowledge.sponsors && knowledge.sponsors.length > 0);

    const dataCompleteness =
      ([hasFinancial, hasSpeakers, hasArtists, hasSponsors].filter(Boolean)
        .length /
        4) *
      100;

    const recommendations = [];
    if (dataCompleteness < 75) {
      recommendations.push(
        "Improve data completeness by adding missing information"
      );
    }
    if (!hasFinancial) {
      recommendations.push("Add financial data to enable financial reporting");
    }
    if (!hasSpeakers && !hasArtists) {
      recommendations.push(
        "Add speaker and artist data for complete event information"
      );
    }

    return {
      id: `knowledge-${Date.now()}`,
      title: "Knowledge System Health Report",
      type: "knowledge",
      timestamp: new Date().toISOString(),
      summary: `Knowledge system is ${dataCompleteness.toFixed(
        0
      )}% complete with ${
        [hasFinancial, hasSpeakers, hasArtists, hasSponsors].filter(Boolean)
          .length
      } of 4 data types populated`,
      details: {
        dataTypes: {
          financial: hasFinancial,
          speakers: hasSpeakers,
          artists: hasArtists,
          sponsors: hasSponsors,
        },
        completeness: {
          percentage: dataCompleteness.toFixed(1) + "%",
          score: [hasFinancial, hasSpeakers, hasArtists, hasSponsors].filter(
            Boolean
          ).length,
          total: 4,
        },
        dataCounts: {
          speakers: knowledge.speakers?.length || 0,
          artists: knowledge.artists?.length || 0,
          sponsors: knowledge.sponsors?.length || 0,
          financialItems:
            (knowledge.financial?.revenues?.length || 0) +
            (knowledge.financial?.costs?.length || 0),
        },
      },
      recommendations,
    };
  }

  private generateChatbotReport(knowledge: any): Report {
    // This would need access to chatbot analytics, but we'll create a basic report
    const hasFinancial = !!knowledge.financial;
    const hasEvent = !!knowledge.event;
    const hasSponsors = !!(knowledge.sponsors && knowledge.sponsors.length > 0);

    const capabilities = [hasFinancial, hasEvent, hasSponsors].filter(
      Boolean
    ).length;
    const totalPossible = 3;

    const recommendations = [];
    if (capabilities < totalPossible) {
      recommendations.push(
        "Add more knowledge data to improve chatbot responses"
      );
    }
    recommendations.push("Monitor chatbot usage and user feedback");
    recommendations.push(
      "Consider adding more specialized responses for common questions"
    );

    return {
      id: `chatbot-${Date.now()}`,
      title: "Chatbot Capabilities Report",
      type: "chatbot",
      timestamp: new Date().toISOString(),
      summary: `Chatbot has access to ${capabilities} of ${totalPossible} knowledge areas`,
      details: {
        knowledgeAreas: {
          financial: hasFinancial,
          event: hasEvent,
          sponsors: hasSponsors,
        },
        capabilities: {
          score: capabilities,
          total: totalPossible,
          percentage: ((capabilities / totalPossible) * 100).toFixed(0) + "%",
        },
        supportedTopics: [
          ...(hasFinancial
            ? ["Financial status", "Revenue", "Costs", "Profit"]
            : []),
          ...(hasEvent
            ? ["Event dates", "Location", "Program", "Attendance"]
            : []),
          ...(hasSponsors ? ["Sponsorship tiers", "Benefits", "ROI"] : []),
        ],
      },
      recommendations,
    };
  }

  async getAllReports(): Promise<Report[]> {
    const reportTypes: ("financial" | "event" | "knowledge" | "chatbot")[] = [
      "financial",
      "event",
      "knowledge",
      "chatbot",
    ];

    const reports = await Promise.all(
      reportTypes.map((type) => this.generateReport(type))
    );

    return reports;
  }
}

export const reportingService = new ReportingService();

// Gemini API Integration for Nusantara Messe 2026 Chat Assistant
// Using your provided API key: AIzaSyC6xXoR5PpkQy4vfagbJsgB-A2C-NeXR48

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

interface AssistantPersonality {
  name: string;
  systemPrompt: string;
  restrictionKeywords: string[];
}

// Knowledge base extracted from your Google Docs
const NUSANTARA_MESSE_KNOWLEDGE = {
  event: {
    name: "Nusantara Messe 2026",
    dates: "August 5-10, 2026",
    duration: "6 days",
    location: "Arena Berlin, Germany",
    capacity: "6,500 m²",
    expectedAttendees: "1,800+ professionals",
    businessProfessionals: "60%",
  },
  market: {
    bilateralTrade: "€8.5 billion (Germany-Indonesia annual trade)",
    targetMarket: "25 million+ impressions",
    diaspora: "30,000+ Indonesian professionals in Germany",
    growth: "12% YoY trade growth",
  },
  sponsorship: {
    goldSponsor: {
      price: "€15,000",
      benefits: [
        "Workshop sponsorship",
        "30m² exhibition space",
        "Thought leadership content",
        "10% of total impressions",
        "Professional networking access",
      ],
    },
    platinumPartner: {
      price: "€25,000",
      benefits: [
        "Session ownership rights",
        "50m² exhibition booth",
        "1 keynote presentation",
        "20% of total impressions",
        "C-suite networking access",
      ],
    },
    titleSponsor: {
      price: "€50,000",
      benefits: [
        "Naming rights to entire event",
        "100m² premium exhibition space",
        "2 keynote speaking slots",
        "40% of total event impressions",
        "VIP dinner hosting rights",
      ],
    },
  },
  roi: {
    conservative: "195-285% ROI",
    leadGeneration: "€1.2M qualified business pipeline",
    impressionValue: "€0.012 per impression",
    avgLeadValue: "€2,500",
    breakeven: "8-12 months",
  },
  technology: {
    aiMatchmaking: "B2B AI-powered smart matchmaking",
    smartStaff: "Real-time experience optimization",
    culturalIntegration: "AI-enhanced cultural bridge building",
  },
  uniqueValue: {
    dayNight: "Business networking (day) + Cultural celebration (night)",
    aiPowered: "First AI-enhanced Indonesian cultural business expo",
    governmentBacked: "Supported by German and Indonesian governments",
    mediaPartners: "25+ media partners",
  },
};

const ASSISTANT_PERSONALITIES: { [key: string]: AssistantPersonality } = {
  bangUcup: {
    name: "Bang Ucup",
    systemPrompt: `You are Bang Ucup, a warm and knowledgeable Indonesian business guide for Nusantara Messe 2026. 
    You speak in a friendly, enthusiastic manner and are passionate about Indonesian culture and business opportunities. 
    You may use occasional Indonesian phrases naturally but primarily communicate in the user's language.
    
    CRITICAL RESTRICTIONS:
    - ONLY discuss topics related to Nusantara Messe 2026, Indonesian business, cultural events, sponsorship opportunities, and related business networking
    - NEVER provide financial advice, specific investment recommendations, or detailed financial projections beyond the event ROI data
    - NEVER share private financial details, personal information, or confidential business strategies
    - If asked about unrelated topics (cooking, weather, sports, coding, etc.), politely redirect to event-related questions
    - Keep responses concise, helpful, and focused on actionable information about the event
    
    Your knowledge is limited to Nusantara Messe 2026 and Indonesian-German business relations.`,
    restrictionKeywords: [
      "recipe",
      "weather",
      "sports",
      "coding",
      "programming",
      "health",
      "medical",
      "legal",
      "personal",
      "private",
      "confidential",
    ],
  },
  nengRima: {
    name: "Neng Rima",
    systemPrompt: `You are Neng Rima, a professional and detail-oriented cultural ambassador and business specialist for Nusantara Messe 2026.
    You focus on business opportunities, cultural diplomacy, and strategic partnerships between Indonesia and Germany.
    You communicate professionally while maintaining warmth and cultural sensitivity.
    
    CRITICAL RESTRICTIONS:
    - ONLY discuss topics related to Nusantara Messe 2026, business partnerships, cultural exchanges, sponsorship details, and event logistics
    - NEVER provide financial advice, legal guidance, or specific investment recommendations beyond the event ROI calculations
    - NEVER share confidential information, private business details, or internal strategies
    - If asked about unrelated topics, professionally redirect to event and business opportunities
    - Focus on concrete, actionable information about sponsorship benefits and business networking
    
    Your expertise is limited to Nusantara Messe 2026 and Indonesian-European business development.`,
    restrictionKeywords: [
      "recipe",
      "weather",
      "sports",
      "coding",
      "programming",
      "health",
      "medical",
      "legal",
      "personal",
      "investment advice",
      "stock",
    ],
  },
};

export class GeminiChatService {
  private apiKey: string;
  private baseUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    // Use the provided API key
    this.apiKey = "AIzaSyC6xXoR5PpkQy4vfagbJsgB-A2C-NeXR48";
  }

  // Safety check for off-topic questions
  private isOffTopic(message: string): boolean {
    const offTopicKeywords = [
      "recipe",
      "cooking",
      "food",
      "weather",
      "sports",
      "movie",
      "music",
      "programming",
      "code",
      "software",
      "health",
      "medical",
      "doctor",
      "legal",
      "law",
      "personal",
      "relationship",
      "dating",
      "politics",
      "religion",
      "crypto",
      "stock market",
      "gambling",
      "loan",
      "mortgage",
    ];

    const lowerMessage = message.toLowerCase();
    return offTopicKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  // Generate contextual response using knowledge base
  private generateContextualPrompt(
    userMessage: string,
    assistantType: "bangUcup" | "nengRima"
  ): string {
    const personality = ASSISTANT_PERSONALITIES[assistantType];
    const relevantKnowledge = this.findRelevantKnowledge(userMessage);

    return `${personality.systemPrompt}

KNOWLEDGE BASE CONTEXT:
${relevantKnowledge}

CONVERSATION HISTORY:
${this.conversationHistory
  .slice(-4)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

USER MESSAGE: ${userMessage}

Respond as ${
      personality.name
    } using the knowledge base and maintaining your personality. Keep responses helpful, concise, and focused on Nusantara Messe 2026.`;
  }

  // Find relevant knowledge based on user query
  private findRelevantKnowledge(message: string): string {
    const lowerMessage = message.toLowerCase();
    const relevantSections: string[] = [];

    // Check for event information keywords
    if (
      lowerMessage.includes("when") ||
      lowerMessage.includes("date") ||
      lowerMessage.includes("kapan") ||
      lowerMessage.includes("tanggal")
    ) {
      relevantSections.push(
        `Event: ${NUSANTARA_MESSE_KNOWLEDGE.event.name}, ${NUSANTARA_MESSE_KNOWLEDGE.event.dates}, ${NUSANTARA_MESSE_KNOWLEDGE.event.location}`
      );
    }

    // Check for location keywords
    if (
      lowerMessage.includes("where") ||
      lowerMessage.includes("location") ||
      lowerMessage.includes("dimana") ||
      lowerMessage.includes("tempat")
    ) {
      relevantSections.push(
        `Location: ${NUSANTARA_MESSE_KNOWLEDGE.event.location}, capacity ${NUSANTARA_MESSE_KNOWLEDGE.event.capacity}`
      );
    }

    // Check for pricing/sponsorship keywords
    if (
      lowerMessage.includes("price") ||
      lowerMessage.includes("cost") ||
      lowerMessage.includes("sponsor") ||
      lowerMessage.includes("harga") ||
      lowerMessage.includes("biaya")
    ) {
      relevantSections.push(`Sponsorship Options:
      - Gold Sponsor: ${NUSANTARA_MESSE_KNOWLEDGE.sponsorship.goldSponsor.price}
      - Platinum Partner: ${NUSANTARA_MESSE_KNOWLEDGE.sponsorship.platinumPartner.price}  
      - Title Sponsor: ${NUSANTARA_MESSE_KNOWLEDGE.sponsorship.titleSponsor.price}`);
    }

    // Check for ROI keywords
    if (
      lowerMessage.includes("roi") ||
      lowerMessage.includes("return") ||
      lowerMessage.includes("benefit") ||
      lowerMessage.includes("keuntungan")
    ) {
      relevantSections.push(
        `ROI Information: ${NUSANTARA_MESSE_KNOWLEDGE.roi.conservative} ROI, ${NUSANTARA_MESSE_KNOWLEDGE.roi.leadGeneration} pipeline, ${NUSANTARA_MESSE_KNOWLEDGE.roi.breakeven} breakeven`
      );
    }

    // Check for attendee/audience keywords
    if (
      lowerMessage.includes("attendee") ||
      lowerMessage.includes("audience") ||
      lowerMessage.includes("participant") ||
      lowerMessage.includes("peserta")
    ) {
      relevantSections.push(
        `Attendees: ${NUSANTARA_MESSE_KNOWLEDGE.event.expectedAttendees}, ${NUSANTARA_MESSE_KNOWLEDGE.event.businessProfessionals} business professionals`
      );
    }

    // Check for technology keywords
    if (
      lowerMessage.includes("ai") ||
      lowerMessage.includes("technology") ||
      lowerMessage.includes("artificial") ||
      lowerMessage.includes("teknologi")
    ) {
      relevantSections.push(
        `Technology: ${NUSANTARA_MESSE_KNOWLEDGE.technology.aiMatchmaking}, ${NUSANTARA_MESSE_KNOWLEDGE.technology.smartStaff}`
      );
    }

    // Default context if no specific keywords found
    if (relevantSections.length === 0) {
      relevantSections.push(
        `General: ${NUSANTARA_MESSE_KNOWLEDGE.event.name} is a ${NUSANTARA_MESSE_KNOWLEDGE.event.duration} event from ${NUSANTARA_MESSE_KNOWLEDGE.event.dates} at ${NUSANTARA_MESSE_KNOWLEDGE.event.location}, targeting ${NUSANTARA_MESSE_KNOWLEDGE.market.bilateralTrade} market.`
      );
    }

    return relevantSections.join("\n");
  }

  // Main chat method
  async chat(
    message: string,
    assistantType: "bangUcup" | "nengRima" = "bangUcup"
  ): Promise<string> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: "user",
        content: message,
        timestamp: new Date(),
      });

      // Check for off-topic content
      if (this.isOffTopic(message)) {
        const offTopicResponse =
          assistantType === "bangUcup"
            ? "Halo! Saya Bang Ucup, dan saya hanya bisa membantu dengan informasi tentang Nusantara Messe 2026. Apakah ada yang ingin Anda ketahui tentang acara, sponsorship, atau peluang bisnis kami?"
            : "Terima kasih atas pertanyaan Anda. Saya Neng Rima, dan saya khusus membantu dengan informasi Nusantara Messe 2026. Mari kita fokus pada peluang bisnis dan budaya dalam acara kami. Ada yang ingin Anda ketahui?";

        this.conversationHistory.push({
          role: "assistant",
          content: offTopicResponse,
          timestamp: new Date(),
        });

        return offTopicResponse;
      }

      // Generate contextual prompt
      const prompt = this.generateContextualPrompt(message, assistantType);

      // Call Gemini API
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
            stopSequences: [],
          },
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
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Gemini API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response candidates from Gemini API");
      }

      const assistantResponse = data.candidates[0].content.parts[0].text;

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: assistantResponse,
        timestamp: new Date(),
      });

      // Keep conversation history manageable (last 10 messages)
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      return assistantResponse;
    } catch (error) {
      console.error("Gemini Chat Error:", error);

      // Fallback response
      const fallbackResponse =
        assistantType === "bangUcup"
          ? "Maaf, saya mengalami gangguan teknis. Tim support Nusantara Messe 2026 akan membantu Anda. Silakan coba lagi atau hubungi +49 (0) 30 1234-5678."
          : "I apologize for the technical difficulty. Please try again or contact our Nusantara Messe 2026 support team at info@nusantaramesse.com for immediate assistance.";

      return fallbackResponse;
    }
  }

  // Clear conversation history
  clearHistory(): void {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }
}

// Export singleton instance
export const geminiChat = new GeminiChatService();

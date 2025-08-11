import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { createDocument, User, initializeDocumentTable } from "@/lib/sql";
import { documentAnalyzer } from "@/lib/document-analyzer";

const sampleDocumentContents = [
  {
    fileName: "Executive_Business_Plan_2026.pdf",
    content: `PAGUYUBAN MESSE 2026 - EXECUTIVE BUSINESS PLAN

1. EXECUTIVE SUMMARY
Paguyuban Messe 2026 represents a strategic initiative to strengthen Indonesia-Germany business relations through a premier cultural and business event. This comprehensive business plan outlines our approach to generating €1,018,660 in revenue while establishing a sustainable platform for bilateral trade cooperation.

2. MARKET OPPORTUNITY
The Indonesia-Germany trade relationship represents a €7.32 billion annual market opportunity. With over 21,559 Indonesian diaspora members in Germany and established trade corridors, we have identified significant potential for business matchmaking and cultural exchange.

Key Market Indicators:
- Bilateral trade volume: €7.32 billion (2024)
- German imports from Indonesia: €4.43 billion
- German exports to Indonesia: €3.75 billion
- Indonesian diaspora in Germany: 21,559 professionals and students
- Digital reach potential: 150M+ Indonesian digital users

3. FINANCIAL PROJECTIONS
Total Revenue Target: €1,018,660
- Sponsorship revenue (77.6%): €790,000
- Ticket sales (10.3%): €104,660
- Exhibitor fees (6.5%): €66,000
- Additional revenue (5.7%): €58,000

Total Costs: €953,474
Net Profit: €65,186 (6.4% margin)

4. SPONSORSHIP STRATEGY
Five-tier sponsorship model designed to maximize partnership value:
- Title Sponsor: €120,000 (1 available) - Premium naming rights and benefits
- Platinum: €60,000 (3 available) - High-impact visibility
- Gold: €40,000 (4 available) - Strategic positioning
- Silver: €25,000 (6 available) - Solid market presence
- Bronze: €15,000 (8 available) - Entry-level partnership

5. TECHNOLOGY PLATFORM
PaguyubanConnect AI-powered B2B matchmaking platform features:
- Advanced cultural intelligence algorithms
- Real-time networking facilitation
- Post-event relationship tracking
- QR code integration for seamless connections
- Analytics dashboard for ROI measurement

6. RISK MANAGEMENT
Comprehensive risk assessment and mitigation strategies covering:
- Market fluctuations and economic conditions
- Technology platform reliability
- Venue and logistics coordination
- Regulatory compliance and permits
- Sponsor commitment and retention

7. COMPETITIVE ADVANTAGE
Unique positioning as the first AI-powered Indonesia-Germany cultural business event:
- Government endorsement and diplomatic support
- Exclusive diaspora community access
- Innovative technology integration
- Sustainable business model design
- Measurable ROI for all stakeholders

This business plan demonstrates our commitment to creating lasting value for sponsors, attendees, and the broader Indonesia-Germany business community.`,
    external_url:
      "https://docs.google.com/document/d/1dL88G5ty9ynfum2KYyaHmGVuf7msjIme7wYvf854204/edit",
  },
  {
    fileName: "Financial_Analysis_ROI_Model.xlsx",
    content: `PAGUYUBAN MESSE 2026 - FINANCIAL ANALYSIS & ROI MODEL

REVENUE BREAKDOWN ANALYSIS:
1. Sponsorship Revenue (€790,000 - 77.6%)
   - Title Sponsor: €120,000 x 1 = €120,000
   - Platinum: €60,000 x 3 = €180,000
   - Gold: €40,000 x 4 = €160,000
   - Silver: €25,000 x 6 = €150,000
   - Bronze: €15,000 x 8 = €120,000
   - Additional partnerships: €60,000

2. Ticket Sales (€104,660 - 10.3%)
   - Day 1 Standard: €45 x 400 = €18,000
   - Day 1 Student: €32 x 200 = €6,400
   - Day 2 Standard: €40 x 280 = €11,200
   - Day 2 Student: €28 x 120 = €3,360
   - Two-day Standard: €70 x 400 = €28,000
   - Two-day Student: €49 x 200 = €9,800
   - VIP Packages: €120 x 100 = €12,000
   - Techno Night: €20 x 800 = €16,000

3. Cost Structure Analysis (€953,474)
   - Venue: €235,920 (24.7%)
   - Marketing: €168,000 (17.6%)
   - Staffing: €158,000 (16.6%)
   - Entertainment: €156,654 (16.4%)
   - Operations: €132,000 (13.8%)
   - Technology: €66,900 (7.0%)
   - Speakers: €36,000 (3.8%)

SPONSORSHIP ROI CALCULATIONS:
Conservative estimates based on industry benchmarks:

Bronze Sponsor (€15,000):
- Expected qualified leads: 20-40
- Average lead value: €1,500-€4,000
- Potential pipeline: €30,000-€160,000
- ROI multiple: 2-10x

Gold Sponsor (€40,000):
- Expected qualified leads: 70-100
- Average lead value: €3,000-€8,000
- Potential pipeline: €210,000-€800,000
- ROI multiple: 5-20x

Title Sponsor (€120,000):
- Expected qualified leads: 200-300
- Average lead value: €5,000-€15,000
- Potential pipeline: €1,000,000-€4,500,000
- ROI multiple: 8-37x

SENSITIVITY ANALYSIS:
- Conservative scenario: 80% attendance = €815,328 revenue
- Optimistic scenario: 120% attendance = €1,222,392 revenue
- Break-even point: 74% of projected attendance

CASH FLOW PROJECTIONS:
Month 1-6: Initial sponsor commitments (40%)
Month 7-10: Major sponsor payments (50%)
Month 11-12: Final payments and event execution (10%)

RISK-ADJUSTED RETURNS:
Applying 15% risk discount to all projections maintains positive ROI across all scenarios with minimum 2x return for sponsors and 6.4% net margin for organizers.`,
    external_url: "https://docs.google.com/spreadsheets/d/example123",
  },
  {
    fileName: "Technology_Platform_Specifications.docx",
    content: `PAGUYUBANCONNECT AI PLATFORM - TECHNICAL SPECIFICATIONS

1. PLATFORM OVERVIEW
PaguyubanConnect represents a breakthrough in AI-powered B2B networking technology, specifically designed for cross-cultural business environments. The platform leverages advanced machine learning algorithms to facilitate meaningful connections between Indonesian and German business professionals.

2. CORE TECHNOLOGY FEATURES

2.1 Cultural Intelligence Engine
- Natural language processing optimized for Indonesian, German, and English
- Cultural context awareness for business protocol differences
- Behavioral pattern recognition for optimal matching
- Cross-cultural communication facilitation tools

2.2 AI Matchmaking Algorithm
- Multi-dimensional compatibility scoring based on:
  * Industry alignment and complementarity
  * Company size and growth stage matching
  * Geographic expansion interests
  * Investment capacity and seeking patterns
  * Technology adoption levels
  * Sustainability and ESG alignment

2.3 Real-Time Networking Features
- QR code instant connection system
- Live chat translation in 3 languages
- Meeting scheduler with timezone optimization
- Digital business card exchange
- Interest-based icebreaker suggestions
- Follow-up reminder automation

3. TECHNICAL ARCHITECTURE

3.1 Backend Infrastructure
- Cloud-native architecture on AWS/Azure
- Microservices design for scalability
- Real-time WebSocket connections
- RESTful API design
- PostgreSQL database with Redis caching
- Elasticsearch for advanced search capabilities

3.2 AI/ML Components
- TensorFlow/PyTorch models for matching algorithms
- Natural language processing using transformer models
- Computer vision for profile photo analysis
- Predictive analytics for connection success rates
- Continuous learning from user interactions

3.3 Security & Privacy
- End-to-end encryption for all communications
- GDPR compliance for European users
- OAuth 2.0 authentication
- Role-based access control
- Data anonymization for analytics
- Audit trails for all system interactions

4. MOBILE APPLICATION FEATURES

4.1 Pre-Event Functionality
- Profile creation with business interests
- AI-powered match suggestions
- Meeting scheduling and calendar integration
- Event agenda with personalized recommendations
- Document sharing and collaboration tools

4.2 During-Event Features
- Real-time location-based networking
- Instant messaging and video calls
- Digital booth visits and interactions
- Live session Q&A and polling
- Social media integration and sharing

4.3 Post-Event Tools
- Relationship management dashboard
- Follow-up automation and reminders
- Success metrics and ROI tracking
- Export capabilities for CRM integration
- Feedback collection and analysis

5. DEVELOPMENT ROADMAP

Phase 1 (Months 1-3): Core platform development
- Basic matching algorithm implementation
- User registration and profile management
- Fundamental networking features
- Basic mobile app functionality

Phase 2 (Months 4-6): Advanced AI features
- Cultural intelligence engine integration
- Real-time translation capabilities
- Advanced matching refinements
- Analytics dashboard development

Phase 3 (Months 7-8): Event integration
- Venue-specific features
- Live event management tools
- Payment integration for premium features
- Final testing and optimization

6. COMPETITIVE ADVANTAGE
PaguyubanConnect differentiates itself through:
- First platform designed specifically for Indonesia-Germany business networking
- Deep cultural intelligence integration
- AI-powered rather than simple keyword matching
- Sustainable business model with white-label licensing potential
- Government endorsement and diplomatic support

7. TECHNICAL REQUIREMENTS
- Minimum 10,000 concurrent users support
- 99.9% uptime SLA during event
- < 200ms response time for core features
- Multi-language support (Indonesian, German, English)
- Cross-platform compatibility (iOS, Android, Web)
- Offline mode for essential features

This technical platform represents a €66,900 investment in cutting-edge technology that will deliver measurable value for all event participants and serve as a foundation for future Indonesia-Germany business initiatives.`,
    external_url: null,
  },
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as User;
    if (!decoded || !isAdmin(decoded)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Ensure documents table exists
    await initializeDocumentTable();

    const createdDocuments = [];

    // Process each sample document with AI analysis
    for (const sampleDoc of sampleDocumentContents) {
      try {
        const analysis = await documentAnalyzer.analyzeDocument({
          content: sampleDoc.content,
          fileName: sampleDoc.fileName,
          fileSize: sampleDoc.content.length,
          mimeType: sampleDoc.fileName.endsWith(".pdf")
            ? "application/pdf"
            : sampleDoc.fileName.endsWith(".xlsx")
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const document = await createDocument({
          title: analysis.title,
          description: analysis.description,
          preview: analysis.preview,
          pages: analysis.pages,
          type: analysis.type,
          icon: analysis.icon,
          external_url: sampleDoc.external_url || undefined,
          restricted: analysis.suggestedRestricted,
          ai_generated: true,
          created_by: decoded.email,
        });

        createdDocuments.push(document);
      } catch (error) {
        console.error(
          `Failed to analyze document ${sampleDoc.fileName}:`,
          error
        );
      }
    }

    return NextResponse.json(
      {
        message: `Successfully created ${createdDocuments.length} documents with AI analysis`,
        documents: createdDocuments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Seed documents error:", error);
    return NextResponse.json(
      { error: "Failed to seed documents" },
      { status: 500 }
    );
  }
}

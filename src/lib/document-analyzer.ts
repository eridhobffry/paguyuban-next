// Document Analysis Service using Gemini AI
// Analyzes uploaded documents and generates marketing-optimized metadata
import { generateText } from "@/lib/ai/gemini-client";

interface DocumentAnalysisInput {
  content: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface DocumentAnalysisResult {
  title: string;
  description: string;
  preview: string;
  pages: string;
  type: string;
  icon: string;
  confidence: number;
  suggestedRestricted: boolean;
  marketingHighlights: string[];
}

export class DocumentAnalyzer {
  constructor() {}

  async analyzeDocument(
    input: DocumentAnalysisInput
  ): Promise<DocumentAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(input);

      const aiResponse = await generateText(prompt, {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1500,
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

      if (!aiResponse) {
        throw new Error("No response from Gemini API");
      }

      return this.parseAIResponse(aiResponse, input);
    } catch (error) {
      console.error("Document analysis error:", error);
      return this.generateFallbackAnalysis(input);
    }
  }

  async refineMetadata(input: {
    title: string;
    description: string;
    preview: string;
    pages?: string;
    type?: string;
    icon?: string;
  }): Promise<
    Pick<
      DocumentAnalysisResult,
      "title" | "description" | "preview" | "pages" | "type" | "icon"
    > & { marketingHighlights?: string[] }
  > {
    try {
      const prompt = `You are a senior marketing editor. Refine the following document metadata to maximize clarity and executive appeal.

CURRENT METADATA:
title: ${input.title}
description: ${input.description}
preview: ${input.preview}
pages: ${input.pages ?? ""}
type: ${input.type ?? ""}
icon: ${input.icon ?? ""}

REQUIREMENTS:
- Keep meaning, improve punchiness and clarity.
- description <= 200 chars, preview <= 150 chars, title <= 60 chars.
- Provide at most 3 marketingHighlights.
- Return JSON with keys: title, description, preview, pages, type, icon, marketingHighlights (array of strings).`;

      const aiResponse = await generateText(prompt, {
        temperature: 0.3,
        maxOutputTokens: 800,
      });
      const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      return {
        title: this.cleanText(parsed.title || input.title, 60),
        description: this.cleanText(
          parsed.description || input.description,
          200
        ),
        preview: this.cleanText(parsed.preview || input.preview, 150),
        pages: parsed.pages || input.pages || "",
        type: parsed.type || input.type || "Business Strategy",
        icon: this.validateIcon(parsed.icon) || input.icon || "FileText",
        marketingHighlights: Array.isArray(parsed.marketingHighlights)
          ? parsed.marketingHighlights
              .slice(0, 3)
              .map((h: string) => this.cleanText(h, 100))
          : undefined,
      };
    } catch (err) {
      console.error("Refine metadata error:", err);
      return {
        title: this.cleanText(input.title, 60),
        description: this.cleanText(input.description, 200),
        preview: this.cleanText(input.preview, 150),
        pages: input.pages || "",
        type: input.type || "Business Strategy",
        icon: this.validateIcon(input.icon || "FileText") || "FileText",
        // marketingHighlights intentionally omitted on fallback
      };
    }
  }

  private buildAnalysisPrompt(input: DocumentAnalysisInput): string {
    return `You are an expert marketing consultant and document analyst for Paguyuban Messe 2026, a premium Indonesia-Germany business event. 

TASK: Analyze this document and create compelling, investor-focused metadata that will attract stakeholders and sponsors.

DOCUMENT DETAILS:
- File: ${input.fileName}
- Size: ${(input.fileSize / 1024 / 1024).toFixed(2)} MB
- Type: ${input.mimeType}

DOCUMENT CONTENT:
${input.content.substring(0, 8000)} ${
      input.content.length > 8000 ? "...[truncated]" : ""
    }

CONTEXT: This document will be displayed in the "Executive Documentation" section of our sponsorship website. The section targets:
- German & Indonesian corporations seeking partnership opportunities
- Investors interested in the €7.32 Billion Indonesia-Germany trade market
- Business leaders looking for AI-powered B2B networking events
- Stakeholders evaluating €200K-€650K business pipeline potential

REQUIREMENTS: Generate a JSON response with the following structure:
{
  "title": "Compelling, professional title (max 60 characters)",
  "description": "Business-focused description highlighting value proposition (max 200 characters)",
  "preview": "Intriguing excerpt that makes stakeholders want to read more (max 150 characters)", 
  "pages": "Estimated page count (e.g., '47 pages', '15 pages')",
  "type": "Document category (Business Strategy, Financial Analysis, Technology, Market Research, Partnership Guide, etc.)",
  "icon": "Lucide icon name (FileText, BarChart3, Zap, Users, TrendingUp, Globe, Target, PieChart, etc.)",
  "confidence": 0.85,
  "suggestedRestricted": true/false,
  "marketingHighlights": ["Key selling point 1", "Key selling point 2", "Key selling point 3"]
}

OPTIMIZATION GUIDELINES:
1. TITLE: Should sound authoritative and valuable to C-level executives
2. DESCRIPTION: Focus on business benefits, ROI, market opportunities, strategic insights
3. PREVIEW: Teaser that creates urgency and curiosity
4. TYPE: Choose category that resonates with business audience
5. ICON: Select icon that visually represents the document's primary value
6. RESTRICTED: True for sensitive business data, false for marketing materials
7. HIGHLIGHTS: 3 compelling reasons why stakeholders should access this document

TONE: Professional, confidence-inspiring, data-driven, results-oriented
FOCUS: Business value, market opportunities, competitive advantages, financial benefits

Respond ONLY with valid JSON. No other text.`;
  }

  private parseAIResponse(
    aiResponse: string,
    input: DocumentAnalysisInput
  ): DocumentAnalysisResult {
    try {
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and clean the response
      return {
        title: this.cleanText(parsed.title || "Business Document", 60),
        description: this.cleanText(
          parsed.description ||
            "Strategic business documentation for partnership opportunities",
          200
        ),
        preview: this.cleanText(
          parsed.preview ||
            "Comprehensive analysis of market opportunities and strategic partnerships...",
          150
        ),
        pages: this.estimatePages(input.content, parsed.pages),
        type: parsed.type || "Business Strategy",
        icon: this.validateIcon(parsed.icon) || "FileText",
        confidence: Math.min(Math.max(parsed.confidence || 0.7, 0.1), 1.0),
        suggestedRestricted: parsed.suggestedRestricted !== false, // Default to true
        marketingHighlights: Array.isArray(parsed.marketingHighlights)
          ? parsed.marketingHighlights
              .slice(0, 3)
              .map((h: string) => this.cleanText(h, 100))
          : [
              "Strategic business insights",
              "Market opportunity analysis",
              "Partnership potential assessment",
            ],
      };
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return this.generateFallbackAnalysis(input);
    }
  }

  private generateFallbackAnalysis(
    input: DocumentAnalysisInput
  ): DocumentAnalysisResult {
    const fileName = input.fileName.replace(/\.[^/.]+$/, ""); // Remove extension
    const fileType = this.inferTypeFromFileName(input.fileName);

    return {
      title: this.titleCase(`${fileName} - ${fileType}`).substring(0, 60),
      description:
        `Strategic ${fileType.toLowerCase()} document for Paguyuban Messe 2026 business partnerships and market analysis.`.substring(
          0,
          200
        ),
      preview:
        "Comprehensive business documentation covering market opportunities, strategic partnerships, and investment potential...".substring(
          0,
          150
        ),
      pages: this.estimatePages(input.content),
      type: fileType,
      icon: this.inferIconFromType(fileType),
      confidence: 0.6,
      suggestedRestricted: true,
      marketingHighlights: [
        "Strategic business insights",
        "Market opportunity analysis",
        "Partnership development guide",
      ],
    };
  }

  private cleanText(text: string, maxLength: number): string {
    return text
      .replace(/[^\w\s\-.,!?()]/g, "")
      .trim()
      .substring(0, maxLength);
  }

  private titleCase(str: string): string {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
  }

  private validateIcon(icon: string): string | null {
    const validIcons = [
      "FileText",
      "BarChart3",
      "Zap",
      "Users",
      "TrendingUp",
      "Globe",
      "Target",
      "PieChart",
      "Euro",
      "Building",
      "Briefcase",
      "LineChart",
      "Calculator",
      "Award",
      "Shield",
      "Lightbulb",
      "Database",
      "Map",
    ];
    return validIcons.includes(icon) ? icon : null;
  }

  private inferTypeFromFileName(fileName: string): string {
    const name = fileName.toLowerCase();
    if (name.includes("business") || name.includes("plan"))
      return "Business Strategy";
    if (
      name.includes("financial") ||
      name.includes("budget") ||
      name.includes("roi")
    )
      return "Financial Analysis";
    if (
      name.includes("technical") ||
      name.includes("tech") ||
      name.includes("platform")
    )
      return "Technology";
    if (name.includes("market") || name.includes("research"))
      return "Market Research";
    if (name.includes("partnership") || name.includes("sponsor"))
      return "Partnership Guide";
    return "Business Strategy";
  }

  private inferIconFromType(type: string): string {
    switch (type) {
      case "Financial Analysis":
        return "BarChart3";
      case "Technology":
        return "Zap";
      case "Market Research":
        return "Users";
      case "Partnership Guide":
        return "Globe";
      default:
        return "FileText";
    }
  }

  private estimatePages(content: string, aiPages?: string): string {
    if (aiPages && aiPages.includes("page")) return aiPages;

    // Rough estimation: 250 words per page, 5 characters per word
    const estimatedPages = Math.max(1, Math.round(content.length / (250 * 5)));
    return `${estimatedPages} pages`;
  }
}

export const documentAnalyzer = new DocumentAnalyzer();

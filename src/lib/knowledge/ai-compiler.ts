import { generateText } from "@/lib/ai/gemini-client";
import { deepMerge } from "@/lib/knowledge/loader";

interface KnowledgeCompilationRequest {
  existingKnowledge: Record<string, unknown>;
  newKnowledge: Record<string, unknown>;
  context?: string;
  compilationType: "merge" | "enhance" | "validate" | "optimize";
}

interface KnowledgeCompilationResult {
  compiledKnowledge: Record<string, unknown>;
  conflicts: Array<{
    path: string;
    existingValue: unknown;
    newValue: unknown;
    resolution: "keep_existing" | "use_new" | "merge" | "enhanced";
    reasoning: string;
  }>;
  enhancements: Array<{
    path: string;
    type: "added" | "enriched" | "normalized" | "validated";
    description: string;
  }>;
  summary: string;
}

/**
 * AI-Powered Knowledge Compiler
 *
 * This service uses Gemini AI to intelligently merge, enhance, and optimize
 * knowledge overlays. It provides conflict resolution, data enrichment,
 * and quality improvements.
 */
export class AIKnowledgeCompiler {
  /**
   * Compile new knowledge with existing knowledge using AI assistance
   */
  async compileKnowledge(
    request: KnowledgeCompilationRequest
  ): Promise<KnowledgeCompilationResult> {
    const { existingKnowledge, newKnowledge, context, compilationType } =
      request;

    try {
      // Step 1: Detect conflicts and prepare compilation context
      const conflicts = this.detectConflicts(existingKnowledge, newKnowledge);

      // Step 2: Build AI prompt for intelligent compilation
      const prompt = this.buildCompilationPrompt(
        existingKnowledge,
        newKnowledge,
        conflicts,
        compilationType,
        context
      );

      // Step 3: Get AI recommendations
      const aiResponse = await generateText(prompt, {
        temperature: 0.3, // Lower temperature for more consistent decisions
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2000,
      });

      // Step 4: Parse AI response and apply recommendations
      const compilationInstructions = this.parseAIResponse(aiResponse);

      // Step 5: Execute compilation based on AI recommendations
      const result = this.executeCompilation(
        existingKnowledge,
        newKnowledge,
        compilationInstructions,
        conflicts
      );

      return result;
    } catch (error) {
      console.error("AI Knowledge Compilation failed:", error);

      // Fallback to simple merge
      return this.fallbackCompilation(
        existingKnowledge,
        newKnowledge,
        conflicts
      );
    }
  }

  /**
   * Detect conflicts between existing and new knowledge
   */
  private detectConflicts(
    existing: Record<string, unknown>,
    newData: Record<string, unknown>
  ): Array<{ path: string; existingValue: unknown; newValue: unknown }> {
    const conflicts: Array<{
      path: string;
      existingValue: unknown;
      newValue: unknown;
    }> = [];

    this.findConflictsRecursive(existing, newData, "", conflicts);

    return conflicts;
  }

  private findConflictsRecursive(
    existing: unknown,
    newData: unknown,
    currentPath: string,
    conflicts: Array<{
      path: string;
      existingValue: unknown;
      newValue: unknown;
    }>
  ): void {
    if (
      typeof existing === "object" &&
      existing !== null &&
      !Array.isArray(existing) &&
      typeof newData === "object" &&
      newData !== null &&
      !Array.isArray(newData)
    ) {
      const existingObj = existing as Record<string, unknown>;
      const newObj = newData as Record<string, unknown>;

      for (const key in newObj) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;

        if (key in existingObj) {
          const existingValue = existingObj[key];
          const newValue = newObj[key];

          if (
            this.isSimpleValue(existingValue) &&
            this.isSimpleValue(newValue)
          ) {
            if (existingValue !== newValue) {
              conflicts.push({
                path: newPath,
                existingValue,
                newValue,
              });
            }
          } else {
            this.findConflictsRecursive(
              existingValue,
              newValue,
              newPath,
              conflicts
            );
          }
        }
      }
    }
  }

  private isSimpleValue(value: unknown): boolean {
    return (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    );
  }

  /**
   * Build AI prompt for knowledge compilation
   */
  private buildCompilationPrompt(
    existing: Record<string, unknown>,
    newData: Record<string, unknown>,
    conflicts: Array<{
      path: string;
      existingValue: unknown;
      newValue: unknown;
    }>,
    type: string,
    context?: string
  ): string {
    return `You are an AI Knowledge Compiler for the Paguyuban Messe 2026 event management system.

TASK: ${type.toUpperCase()} knowledge data intelligently.

CONTEXT: ${context || "General knowledge update for event management system"}

EXISTING KNOWLEDGE STRUCTURE:
${JSON.stringify(existing, null, 2)}

NEW KNOWLEDGE TO INTEGRATE:
${JSON.stringify(newData, null, 2)}

DETECTED CONFLICTS (${conflicts.length}):
${conflicts
  .map(
    (c) => `- Path: ${c.path}
  Existing: ${JSON.stringify(c.existingValue)}
  New: ${JSON.stringify(c.newValue)}`
  )
  .join("\n")}

COMPILATION GUIDELINES:
1. For financial data: Always prefer newer, more accurate values
2. For event details: Merge complementary information, resolve conflicts intelligently
3. For contact info: Keep most recent and complete information
4. For arrays: Merge unique items, avoid duplicates
5. For timestamps: Always use newer values
6. For pricing: Validate consistency and prefer official sources

RESPONSE FORMAT (JSON):
{
  "decisions": [
    {
      "path": "conflict.path",
      "action": "keep_existing|use_new|merge|enhance",
      "reasoning": "Brief explanation of why this decision was made",
      "finalValue": "the resolved value"
    }
  ],
  "enhancements": [
    {
      "path": "enhanced.path", 
      "type": "added|enriched|normalized|validated",
      "description": "What enhancement was made"
    }
  ],
  "summary": "Brief summary of compilation results and key changes"
}

Provide intelligent, context-aware decisions that maintain data integrity while incorporating valuable new information.`;
  }

  /**
   * Parse AI response into actionable instructions
   */
  private parseAIResponse(aiResponse: string | null): any {
    if (!aiResponse) {
      return {
        decisions: [],
        enhancements: [],
        summary: "AI response unavailable",
      };
    }

    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn("Failed to parse AI response:", error);
    }

    return {
      decisions: [],
      enhancements: [],
      summary: "Failed to parse AI recommendations",
    };
  }

  /**
   * Execute compilation based on AI recommendations
   */
  private executeCompilation(
    existing: Record<string, unknown>,
    newData: Record<string, unknown>,
    instructions: any,
    conflicts: Array<{
      path: string;
      existingValue: unknown;
      newValue: unknown;
    }>
  ): KnowledgeCompilationResult {
    let compiled = { ...existing };
    const appliedEnhancements: Array<{
      path: string;
      type: "added" | "enriched" | "normalized" | "validated";
      description: string;
    }> = [];

    const resolvedConflicts: Array<{
      path: string;
      existingValue: unknown;
      newValue: unknown;
      resolution: "keep_existing" | "use_new" | "merge" | "enhanced";
      reasoning: string;
    }> = [];

    // Apply AI decisions
    if (instructions.decisions && Array.isArray(instructions.decisions)) {
      for (const decision of instructions.decisions) {
        const conflict = conflicts.find((c) => c.path === decision.path);
        if (conflict) {
          this.setDeepValue(compiled, decision.path, decision.finalValue);
          resolvedConflicts.push({
            ...conflict,
            resolution: decision.action,
            reasoning: decision.reasoning,
          });
        }
      }
    }

    // Apply simple merge for non-conflicting data
    compiled = deepMerge(compiled, newData);

    // Record enhancements
    if (instructions.enhancements && Array.isArray(instructions.enhancements)) {
      appliedEnhancements.push(...instructions.enhancements);
    }

    return {
      compiledKnowledge: compiled,
      conflicts: resolvedConflicts,
      enhancements: appliedEnhancements,
      summary: instructions.summary || "Knowledge compilation completed",
    };
  }

  /**
   * Fallback compilation when AI is unavailable
   */
  private fallbackCompilation(
    existing: Record<string, unknown>,
    newData: Record<string, unknown>,
    conflicts: Array<{
      path: string;
      existingValue: unknown;
      newValue: unknown;
    }>
  ): KnowledgeCompilationResult {
    // Simple merge with new data taking precedence
    const compiled = deepMerge(existing, newData);

    const resolvedConflicts = conflicts.map((conflict) => ({
      ...conflict,
      resolution: "use_new" as const,
      reasoning: "Fallback: Using new value (AI compilation unavailable)",
    }));

    return {
      compiledKnowledge: compiled,
      conflicts: resolvedConflicts,
      enhancements: [],
      summary: "Fallback compilation: Simple merge with new data precedence",
    };
  }

  /**
   * Set value at deep path in object
   */
  private setDeepValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): void {
    const keys = path.split(".");
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (
        !(key in current) ||
        typeof current[key] !== "object" ||
        current[key] === null ||
        Array.isArray(current[key])
      ) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Validate knowledge structure for event management system
   */
  async validateKnowledgeStructure(
    knowledge: Record<string, unknown>
  ): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  }> {
    const prompt = `Validate this knowledge structure for the Paguyuban Messe 2026 event management system:

${JSON.stringify(knowledge, null, 2)}

Check for:
1. Required event fields (dates, location, pricing)
2. Data consistency (financial calculations, dates)
3. Completeness (missing critical information)
4. Format correctness (URLs, emails, phone numbers)

Respond with JSON:
{
  "isValid": boolean,
  "errors": ["list of validation errors"],
  "suggestions": ["list of improvement suggestions"]
}`;

    try {
      const response = await generateText(prompt, {
        temperature: 0.2,
        maxOutputTokens: 1000,
      });

      const jsonMatch = response?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn("Knowledge validation failed:", error);
    }

    return {
      isValid: true,
      errors: [],
      suggestions: ["AI validation unavailable - manual review recommended"],
    };
  }

  /**
   * Generate knowledge summary for admin dashboard
   */
  async generateKnowledgeSummary(
    knowledge: Record<string, unknown>
  ): Promise<string> {
    const prompt = `Generate a concise summary of this knowledge base for the admin dashboard:

${JSON.stringify(knowledge, null, 2)}

Focus on:
- Key data points and coverage
- Data freshness and completeness  
- Critical information for event management
- Any notable gaps or issues

Keep it under 200 words, professional tone.`;

    try {
      const summary = await generateText(prompt, {
        temperature: 0.5,
        maxOutputTokens: 300,
      });

      return (
        summary ||
        "Knowledge base contains event management data for Paguyuban Messe 2026."
      );
    } catch (error) {
      console.warn("Knowledge summary generation failed:", error);
      return "Knowledge base active. Manual review recommended.";
    }
  }
}

// Export singleton instance
export const aiKnowledgeCompiler = new AIKnowledgeCompiler();

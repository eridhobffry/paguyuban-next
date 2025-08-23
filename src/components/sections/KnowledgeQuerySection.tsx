"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  Search,
  BookOpen,
  FileText,
  ExternalLink,
  Copy,
  Save,
  Star,
  Clock,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  Lightbulb,
  Target,
} from "lucide-react";
import { toast } from "sonner";

interface SourceCitation {
  document: string;
  section: string;
  content: string;
  relevance: number;
  page?: number;
  url?: string;
}

interface KnowledgeQueryResult {
  answer: string;
  sources: SourceCitation[];
  confidence: number;
  reasoning: string;
  suggestedFollowUp: string[];
  timestamp: string;
}

interface QueryHistory {
  id: string;
  query: string;
  result: KnowledgeQueryResult;
  timestamp: string;
}

interface QueryCapabilities {
  supportedQueryTypes: string[];
  maxSources: number;
  confidenceThreshold: number;
  features: string[];
  examples: string[];
}

export default function KnowledgeQuerySection() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<KnowledgeQueryResult | null>(null);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [capabilities, setCapabilities] = useState<QueryCapabilities | null>({
    supportedQueryTypes: [
      "event information",
      "financial data",
      "sponsorship details",
      "speaker profiles",
      "artist lineup",
      "document information",
      "venue details",
      "attendance figures",
    ],
    maxSources: 20,
    confidenceThreshold: 0.7,
    features: [
      "Source citations with document names and sections",
      "Confidence scoring",
      "Follow-up question suggestions",
      "Multi-source correlation",
      "Context-aware responses",
    ],
    examples: [
      "What are the total expected attendance figures for Paguyuban Messe 2026?",
      "How much revenue is expected from sponsorship deals?",
      "What are the benefits of the title sponsor package?",
      "Who are the keynote speakers and what are their expertise areas?",
      "What is the breakdown of costs for venue and entertainment?",
    ],
  });
  const [activeTab, setActiveTab] = useState("query");
  const [, setSelectedExample] = useState("");
  const [maxSources, setMaxSources] = useState(5);
  const [includeSources, setIncludeSources] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load capabilities on mount
  useEffect(() => {
    loadCapabilities();
  }, []);

  const loadCapabilities = async () => {
    try {
      const response = await fetch("/api/knowledge/query");
      if (response.ok) {
        const data = await response.json();
        setCapabilities(data);
      }
    } catch (_error) {
      console.error("Failed to load capabilities:", _error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/knowledge/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          maxSources,
          includeSources,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process query");
      }

      const data: KnowledgeQueryResult = await response.json();
      setResult(data);

      // Add to history
      const historyItem: QueryHistory = {
        id: Date.now().toString(),
        query: query.trim(),
        result: data,
        timestamp: data.timestamp,
      };
      setHistory((prev) => [historyItem, ...prev.slice(0, 9)]); // Keep last 10

      toast.success("Query processed successfully!");
    } catch (_error) {
      console.error("Query error:", _error);
      toast.error("Failed to process query. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const loadExample = (example: string) => {
    setQuery(example);
    setSelectedExample(example);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const formatConfidence = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    if (percentage >= 90)
      return { level: "High", color: "text-green-600", bg: "bg-green-50" };
    if (percentage >= 70)
      return { level: "Medium", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { level: "Low", color: "text-red-600", bg: "bg-red-50" };
  };

  const confidenceInfo = result ? formatConfidence(result.confidence) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Knowledge Assistant
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask questions about Paguyuban Messe 2026 using NotebookLM-style
            queries with source citations
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="query" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                New Query
              </TabsTrigger>
              <TabsTrigger value="examples" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Examples
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="query" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Question</label>
                  <Textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything about Paguyuban Messe 2026..."
                    className="min-h-[100px] resize-none"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Max Sources:</label>
                    <Input
                      type="number"
                      value={maxSources}
                      onChange={(e) =>
                        setMaxSources(
                          Math.max(1, parseInt(e.target.value) || 5)
                        )
                      }
                      className="w-20"
                      min="1"
                      max="20"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeSources"
                      checked={includeSources}
                      onChange={(e) => setIncludeSources(e.target.checked)}
                    />
                    <label
                      htmlFor="includeSources"
                      className="text-sm font-medium"
                    >
                      Include Source Citations
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing Query...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Ask Question
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              {capabilities?.examples && (
                <div className="grid gap-2">
                  <h3 className="font-medium">Try these example queries:</h3>
                  {capabilities.examples.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto p-3"
                      onClick={() => loadExample(example)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{example}</span>
                    </Button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No query history yet. Start by asking a question!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium truncate flex-1">
                              {item.query}
                            </h4>
                            <Badge variant="outline" className="ml-2">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.result.answer.substring(0, 150)}...
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="font-medium">Processing your query...</span>
              </div>
              <Progress value={undefined} className="w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {result && !isLoading && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Query Results
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(result.answer)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Star className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Answer */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Answer</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {result.answer}
                </p>
              </div>
            </div>

            <Separator />

            {/* Confidence and Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${confidenceInfo?.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className={`h-4 w-4 ${confidenceInfo?.color}`} />
                  <span className="font-medium">Confidence</span>
                </div>
                <div className={`text-2xl font-bold ${confidenceInfo?.color}`}>
                  {Math.round(result.confidence * 100)}%
                </div>
                <div className={`text-sm ${confidenceInfo?.color}`}>
                  {confidenceInfo?.level} confidence
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Sources</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {result.sources.length}
                </div>
                <div className="text-sm text-blue-600">
                  Documents referenced
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Timestamp</span>
                </div>
                <div className="text-sm font-bold text-purple-600">
                  {new Date(result.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Sources */}
            {result.sources.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Sources
                  </h3>
                  <div className="grid gap-3">
                    {result.sources.map((source, index) => (
                      <Card
                        key={index}
                        className="border-l-4 border-l-blue-500"
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">
                                  {source.document}
                                </h4>
                                {source.url && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {source.section}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {Math.round(source.relevance * 100)}% relevant
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {source.content}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Suggested Follow-up */}
            {result.suggestedFollowUp.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Suggested Follow-up Questions
                  </h3>
                  <div className="grid gap-2">
                    {result.suggestedFollowUp.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start text-left h-auto p-3"
                        onClick={() => loadExample(question)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{question}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

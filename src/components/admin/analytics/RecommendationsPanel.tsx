"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatRecommendationsDialog } from "@/components/admin/ChatRecommendationsDialog";
import { getRecommendationsWithCache } from "@/hooks/useAdminRecommendations";
import { extractProspectFromSummary } from "@/lib/prospect";
import type { ChatRecommendationsData } from "@/types/analytics";

interface RecommendationsPanelProps {
  chatTopTopics: Array<{ name: string; count: number }>;
  funnelA: Array<{ name: string; count: number }>;
}

export default function RecommendationsPanel({
  chatTopTopics,
  funnelA,
}: RecommendationsPanelProps) {
  const [recOpen, setRecOpen] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [recData, setRecData] = useState<ChatRecommendationsData | null>(null);

  const [currentProspect, setCurrentProspect] = useState<ReturnType<
    typeof extractProspectFromSummary
  > | null>(null);

  const handleRecommend = async (item: {
    sessionId: string;
    summary: string;
    sentiment: string | null;
  }) => {
    try {
      setRecLoading(true);
      setRecOpen(true);
      setRecData(null);

      // Extract prospect data from summary
      const prospect = extractProspectFromSummary(item.summary);
      setCurrentProspect(prospect);

      const data = await getRecommendationsWithCache({
        sessionId: item.sessionId,
        summary: item.summary,
        sentiment: item.sentiment,
        prospect,
      });
      setRecData(data);
    } catch {
      setRecData({ nextBestAction: "", recommendedActions: [], journey: [] });
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <>
      <Card variant="glass" className="p-7">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">
            AI-Powered Insights & Recommendations
          </h2>
          <p className="text-muted-foreground">
            Get personalized recommendations for each user session based on
            their chat history and behavior patterns.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Chat Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chatTopTopics.map((topic, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm">{topic.name}</span>
                  <span className="text-sm font-medium">{topic.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle>User Journey Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {funnelA.map((step, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm">{step.name}</span>
                  <span className="text-sm font-medium">{step.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleRecommend({
                  sessionId: "demo",
                  summary: "User is interested in partnership opportunities",
                  sentiment: "positive",
                })
              }
            >
              Generate Demo Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChatRecommendationsDialog
        open={recOpen}
        onOpenChange={setRecOpen}
        data={recData}
        loading={recLoading}
        initialProspect={currentProspect || undefined}
        onRegenerate={async (prospect) => {
          // Handle regeneration if needed
          console.log("Regenerate with prospect:", prospect);
        }}
      />
    </>
  );
}

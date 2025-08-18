"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { FollowUpsList, RecommendationsDialog } from "@/components/admin";
import { useChatSummaries } from "@/hooks/useChatSummaries";
import { getRecommendationsWithCache } from "@/hooks/useAdminRecommendations";
import type { ChatRecommendationsData } from "@/types/analytics";
import { extractProspectFromSummary } from "@/lib/prospect";

export default function AdminFollowUpsPage() {
  const [recOpen, setRecOpen] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [recData, setRecData] = useState<ChatRecommendationsData | null>(null);
  const [currentRecItem, setCurrentRecItem] = useState<{
    sessionId: string;
    summary: string;
    sentiment: string | null;
  } | null>(null);
  const [currentProspect, setCurrentProspect] = useState<ReturnType<typeof extractProspectFromSummary> | null>(null);

  const { summaries, deleteSummary } = useChatSummaries("30d");

  async function handleRecommend(item: {
    sessionId: string;
    summary: string;
    sentiment: string | null;
  }) {
    try {
      setRecLoading(true);
      setRecOpen(true);
      setRecData(null);
      setCurrentRecItem(item);
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
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card variant="glass" className="p-7">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Follow-ups
          </h1>
          <p className="text-muted-foreground">
            Review AI suggestions, mark follow-ups complete, and set reminders.
          </p>
        </div>
      </Card>

      <FollowUpsList
        items={summaries}
        onRecommend={(item) =>
          handleRecommend({
            sessionId: item.sessionId,
            summary: item.summary,
            sentiment: item.sentiment,
          })
        }
        onDelete={deleteSummary}
      />

      <RecommendationsDialog
        open={recOpen}
        onOpenChange={setRecOpen}
        loading={recLoading}
        data={recData}
        initialProspect={currentProspect || undefined}
        onRegenerate={async (prospect) => {
          if (!currentRecItem) return;
          try {
            setRecLoading(true);
            const fresh = await getRecommendationsWithCache(
              {
                sessionId: currentRecItem.sessionId,
                summary: currentRecItem.summary,
                sentiment: currentRecItem.sentiment,
                prospect,
              },
              { force: true }
            );
            setRecData(fresh);
            setCurrentProspect(prospect);
          } finally {
            setRecLoading(false);
          }
        }}
      />
    </div>
  );
}

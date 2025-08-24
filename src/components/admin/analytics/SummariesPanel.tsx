"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SummariesSection } from "@/components/admin";
import { useChatSummaries } from "@/hooks/useChatSummaries";

interface SummariesPanelProps {
  range: "7d" | "30d" | "90d";
}

export default function SummariesPanel({ range }: SummariesPanelProps) {
  const {
    summaries,
    loading: summariesLoading,
    hasMore: summariesHasMore,
    loadMore: loadMoreSummaries,
    deleteSummary,
  } = useChatSummaries(range);

  const deleteSummaryWithConfirm = async (id?: string) => {
    if (!id) return;
    await deleteSummary(id);
  };

  return (
    <Card variant="glass" className="p-7">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">
          Recent Chat Summaries
        </h2>
        <p className="text-muted-foreground">
          AI-generated insights from user conversations, organized by sentiment
          and key topics.
        </p>
      </div>
      <CardContent className="mt-6">
        <SummariesSection
          summaries={summaries}
          loading={summariesLoading}
          hasMore={summariesHasMore}
          onLoadMore={loadMoreSummaries}
          onDelete={deleteSummaryWithConfirm}
        />
      </CardContent>
    </Card>
  );
}

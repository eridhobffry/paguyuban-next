"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ChatSummaryItem = {
  id?: string;
  sessionId: string;
  summary: string;
  sentiment: string | null;
  createdAt: string;
};

export function ChatSummariesSection(props: {
  title?: string;
  summaries: ChatSummaryItem[];
  onDelete?: (id?: string) => void;
  onRecommend?: (item: ChatSummaryItem) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}) {
  const {
    title = "Recent Chat Summaries",
    summaries,
    onDelete,
    onRecommend,
    loading,
    hasMore,
    onLoadMore,
  } = props;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {summaries.map((r) => (
            <div
              key={`${r.sessionId}-${r.createdAt}`}
              className="p-3 rounded-md border"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString()}
                </div>
                <div className="flex items-center gap-3">
                  <a
                    className="text-sm underline"
                    href={`/admin/analytics?sessionId=${encodeURIComponent(
                      r.sessionId
                    )}`}
                  >
                    View session
                  </a>
                  {"id" in r && onDelete ? (
                    <button
                      className="text-sm underline text-red-600"
                      onClick={() => onDelete(r.id)}
                    >
                      Delete
                    </button>
                  ) : null}
                  {onRecommend ? (
                    <button
                      className="text-sm underline"
                      onClick={() => onRecommend(r)}
                    >
                      Recommend actions
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="text-sm">{r.summary}</div>
              {r.sentiment && (
                <div className="text-xs text-muted-foreground mt-1">
                  Sentiment: {r.sentiment}
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-center">
            {loading ? (
              <span className="text-sm text-muted-foreground">Loading…</span>
            ) : hasMore ? (
              <button className="text-sm underline" onClick={onLoadMore}>
                Load more
              </button>
            ) : summaries.length > 0 ? (
              <span className="text-sm text-muted-foreground">
                No more summaries
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

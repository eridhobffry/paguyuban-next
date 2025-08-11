"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RecommendedAction = {
  title: string;
  description: string;
  priority?: string;
};

type JourneyItem = {
  stage: string;
  insight: string;
  risk?: string;
  recommendation?: string;
};

export type ChatRecommendationsData = {
  nextBestAction: string;
  recommendedActions: RecommendedAction[];
  journey: JourneyItem[];
};

export function ChatRecommendationsDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  data: ChatRecommendationsData | null;
}) {
  const { open, onOpenChange, loading, data } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recommended Actions</DialogTitle>
          <DialogDescription>
            AI-suggested next steps and journey mapping
          </DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="space-y-3">
            <div className="h-4 w-48 bg-white/10 rounded" />
            <div className="h-4 w-80 bg-white/10 rounded" />
            <div className="h-4 w-64 bg-white/10 rounded" />
          </div>
        )}
        {!loading && data && (
          <div className="space-y-6 text-sm">
            <div>
              <div className="font-medium mb-1">Next Best Action</div>
              <div className="text-muted-foreground">
                {data.nextBestAction || "No suggestion"}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">Recommended Actions</div>
              <div className="space-y-2">
                {(data.recommendedActions || []).map((a, i) => (
                  <div key={i} className="p-2 rounded border">
                    <div className="font-medium">
                      {a.title}{" "}
                      {a.priority ? (
                        <span className="text-xs text-muted-foreground">
                          ({a.priority})
                        </span>
                      ) : null}
                    </div>
                    <div className="text-muted-foreground">{a.description}</div>
                  </div>
                ))}
                {(data.recommendedActions || []).length === 0 && (
                  <div className="text-muted-foreground">
                    No actions suggested
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">360 Journey</div>
              <div className="space-y-2">
                {(data.journey || []).map((j, i) => (
                  <div key={i} className="p-2 rounded border">
                    <div className="font-medium">{j.stage}</div>
                    <div className="text-muted-foreground">
                      Insight: {j.insight}
                    </div>
                    {j.risk ? (
                      <div className="text-muted-foreground">
                        Risk: {j.risk}
                      </div>
                    ) : null}
                    {j.recommendation ? (
                      <div className="text-muted-foreground">
                        Recommendation: {j.recommendation}
                      </div>
                    ) : null}
                  </div>
                ))}
                {(data.journey || []).length === 0 && (
                  <div className="text-muted-foreground">
                    No journey mapping available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

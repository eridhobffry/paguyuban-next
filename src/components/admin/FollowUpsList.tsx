"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { SummaryItem } from "@/types/analytics";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

type FollowUpsListProps = {
  items: SummaryItem[];
  onRecommend: (item: SummaryItem) => void;
  onDelete?: (id?: string) => Promise<void> | void;
};

type FollowUpState = {
  completedAtBySession: Record<string, string>; // sessionId -> ISO date string
  remindAtBySession: Record<string, string>; // sessionId -> ISO date string
};

const STORAGE_KEY = "admin-followups:v1";

export function FollowUpsList({
  items,
  onRecommend,
  onDelete,
}: FollowUpsListProps) {
  const [state, setState] = useState<FollowUpState>({
    completedAtBySession: {},
    remindAtBySession: {},
  });
  const [expandedBySession, setExpandedBySession] = useState<
    Record<string, boolean>
  >({});

  // Load persisted state once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FollowUpState;
        setState({
          completedAtBySession: parsed.completedAtBySession || {},
          remindAtBySession: parsed.remindAtBySession || {},
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  // Dedupe by sessionId and sort by createdAt desc
  const dedupedItems = useMemo(() => {
    const map = new Map<string, SummaryItem>();
    for (const it of items) {
      const existing = map.get(it.sessionId);
      if (!existing) {
        map.set(it.sessionId, it);
      } else if (new Date(it.createdAt) > new Date(existing.createdAt)) {
        map.set(it.sessionId, it);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [items]);

  const completedCount = useMemo(() => {
    return dedupedItems.filter((it) => state.completedAtBySession[it.sessionId])
      .length;
  }, [dedupedItems, state.completedAtBySession]);

  const pendingItems = useMemo(() => {
    return dedupedItems.filter(
      (it) => !state.completedAtBySession[it.sessionId]
    );
  }, [dedupedItems, state.completedAtBySession]);

  function toggleCompleted(sessionId: string) {
    setState((prev) => {
      const isDone = Boolean(prev.completedAtBySession[sessionId]);
      const nextCompleted = { ...prev.completedAtBySession };
      if (isDone) {
        delete nextCompleted[sessionId];
      } else {
        nextCompleted[sessionId] = new Date().toISOString();
      }
      return { ...prev, completedAtBySession: nextCompleted };
    });
  }

  function setReminder(sessionId: string, daysFromNow: number) {
    const remindAt = new Date();
    remindAt.setDate(remindAt.getDate() + daysFromNow);
    setState((prev) => ({
      ...prev,
      remindAtBySession: {
        ...prev.remindAtBySession,
        [sessionId]: remindAt.toISOString(),
      },
    }));
  }

  function clearReminder(sessionId: string) {
    setState((prev) => {
      const next = { ...prev.remindAtBySession };
      delete next[sessionId];
      return { ...prev, remindAtBySession: next };
    });
  }

  function formatDate(iso?: string) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Follow-ups</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-muted-foreground">
          Pending {pendingItems.length} · Completed {completedCount}
        </div>
        <div className="space-y-4">
          {dedupedItems.map((item) => {
            const completedAt = state.completedAtBySession[item.sessionId];
            const remindAt = state.remindAtBySession[item.sessionId];
            return (
              <div
                key={item.sessionId}
                className="p-3 rounded-md border"
                style={{
                  opacity: completedAt ? 0.6 : 1,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRecommend(item)}
                    >
                      Recommended follow up (AI)
                    </Button>
                    {onDelete ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={!item.id}
                          >
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Follow-up</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this follow-up?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button onClick={() => onDelete(item.id)}>
                                Confirm
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ) : null}
                    <Button
                      size="sm"
                      onClick={() => toggleCompleted(item.sessionId)}
                      className={
                        completedAt ? "bg-green-600 hover:bg-green-700" : ""
                      }
                    >
                      {completedAt
                        ? "Already followed up"
                        : "Mark as followed up"}
                    </Button>
                  </div>
                </div>
                <div className="text-sm mb-2">
                  {(() => {
                    const expanded = !!expandedBySession[item.sessionId];
                    const needsTruncate = item.summary.length > 200;
                    const preview = needsTruncate
                      ? item.summary.slice(0, 200) + "…"
                      : item.summary;
                    return (
                      <>
                        <span>
                          {expanded || !needsTruncate ? item.summary : preview}
                        </span>
                        {needsTruncate && (
                          <Button
                            variant="link"
                            size="sm"
                            className="px-1 h-auto text-xs align-baseline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedBySession((prev) => ({
                                ...prev,
                                [item.sessionId]: !expanded,
                              }));
                            }}
                          >
                            {expanded ? "Show less" : "Show more"}
                          </Button>
                        )}
                      </>
                    );
                  })()}
                </div>
                {item.sentiment ? (
                  <div className="text-xs text-muted-foreground mb-2">
                    Sentiment: {item.sentiment}
                  </div>
                ) : null}
                <Separator className="my-2" />
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Reminder:</span>
                  {!remindAt ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setReminder(item.sessionId, 3)}
                      >
                        in 3 days
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setReminder(item.sessionId, 5)}
                      >
                        in 5 days
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setReminder(item.sessionId, 7)}
                      >
                        in 7 days
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">
                        {formatDate(remindAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearReminder(item.sessionId)}
                      >
                        Clear
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {dedupedItems.length === 0 && (
            <div className="text-center text-gray-500 py-6 text-sm">
              No follow-ups available.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

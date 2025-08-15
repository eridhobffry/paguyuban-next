"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChatRecommendationsData } from "@/types/analytics";

type ProspectInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  interest?: string | null;
  budget?: string | null;
};

export function RecommendationsDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  data: ChatRecommendationsData | null;
  onRegenerate?: (prospect: ProspectInput) => Promise<void> | void;
  initialProspect?: ProspectInput;
}) {
  const { open, onOpenChange, loading, data, onRegenerate, initialProspect } = props;
  const [prospect, setProspect] = useState<ProspectInput>(initialProspect || {});
  const [showPersonalize, setShowPersonalize] = useState(false);

  useEffect(() => {
    setProspect(initialProspect || {});
  }, [initialProspect]);

  const { selectedEmail, selectedWa, sentimentLabel } = useMemo(() => {
    const s = (data?.sentiment || "").toLowerCase();
    const isPositive = s.startsWith("pos");
    const isNegative = s.startsWith("neg");
    const label = isPositive ? "Positive" : isNegative ? "Negative" : "Neutral";
    const email = isPositive
      ? data?.followUps?.emailPositive
      : isNegative
      ? data?.followUps?.emailNegative
      : data?.followUps?.emailNeutral;
    const wa = isPositive
      ? data?.followUps?.whatsappPositive
      : isNegative
      ? data?.followUps?.whatsappNegative
      : data?.followUps?.whatsappNeutral;
    return { selectedEmail: email, selectedWa: wa, sentimentLabel: label };
  }, [data]);

  const mailtoHref = useMemo(() => {
    if (!prospect.email || !selectedEmail) return undefined;
    const subjectBase = prospect.company
      ? `Next steps with ${prospect.company}`
      : `Follow-up on your inquiry`;
    const subject = encodeURIComponent(subjectBase);
    const body = encodeURIComponent(selectedEmail);
    return `mailto:${encodeURIComponent(prospect.email)}?subject=${subject}&body=${body}`;
  }, [prospect.email, prospect.company, selectedEmail]);

  const whatsappHref = useMemo(() => {
    if (!prospect.phone || !selectedWa) return undefined;
    const digits = String(prospect.phone).replace(/\D+/g, "");
    const text = encodeURIComponent(selectedWa);
    return `https://wa.me/${digits}?text=${text}`;
  }, [prospect.phone, selectedWa]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
            {onRegenerate ? (
              <div className="p-3 rounded border">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="font-medium">Refine</div>
                  <div className="flex gap-2">
                    <button
                      className="inline-flex items-center justify-center rounded-md border px-3 py-1 text-sm"
                      disabled={loading}
                      onClick={async () => {
                        try {
                          await onRegenerate?.(prospect);
                        } catch {}
                      }}
                    >
                      Regenerate
                    </button>
                    <button
                      className="inline-flex items-center justify-center rounded-md border px-3 py-1 text-sm"
                      onClick={() => setShowPersonalize((v) => !v)}
                    >
                      {showPersonalize ? "Hide Personalize" : "Personalize (optional)"}
                    </button>
                  </div>
                </div>
                {showPersonalize ? (
                  <div className="mt-2 grid md:grid-cols-2 gap-2">
                    <input
                      className="px-2 py-1 rounded border bg-transparent"
                      placeholder="Name"
                      value={prospect.name || ""}
                      onChange={(e) =>
                        setProspect((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                    <input
                      className="px-2 py-1 rounded border bg-transparent"
                      placeholder="Email"
                      value={prospect.email || ""}
                      onChange={(e) =>
                        setProspect((p) => ({ ...p, email: e.target.value }))
                      }
                    />
                    <input
                      className="px-2 py-1 rounded border bg-transparent"
                      placeholder="Phone"
                      value={prospect.phone || ""}
                      onChange={(e) =>
                        setProspect((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                    <input
                      className="px-2 py-1 rounded border bg-transparent"
                      placeholder="Company"
                      value={prospect.company || ""}
                      onChange={(e) =>
                        setProspect((p) => ({ ...p, company: e.target.value }))
                      }
                    />
                    <input
                      className="px-2 py-1 rounded border bg-transparent"
                      placeholder="Interest (e.g. sponsorship)"
                      value={prospect.interest || ""}
                      onChange={(e) =>
                        setProspect((p) => ({ ...p, interest: e.target.value }))
                      }
                    />
                    <input
                      className="px-2 py-1 rounded border bg-transparent"
                      placeholder="Budget"
                      value={prospect.budget || ""}
                      onChange={(e) =>
                        setProspect((p) => ({ ...p, budget: e.target.value }))
                      }
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
            {data.prospectSummary ? (
              <div>
                <div className="font-medium mb-1">Prospect Summary</div>
                <div className="text-muted-foreground">
                  {data.prospectSummary}
                </div>
              </div>
            ) : null}
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
            {data.followUps ? (
              <div>
                <div className="font-medium mb-2">Follow-up Templates</div>
                {data.sentiment ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    <>
                      <div className="p-2 rounded border space-y-2">
                        <div className="font-medium">Email ({sentimentLabel})</div>
                        <pre className="whitespace-pre-wrap text-muted-foreground">
                          {selectedEmail || "-"}
                        </pre>
                        <div className="flex gap-2">
                          <a
                            className="inline-flex items-center justify-center rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                            href={mailtoHref}
                            target={mailtoHref ? "_blank" : undefined}
                            rel={mailtoHref ? "noopener noreferrer" : undefined}
                            aria-disabled={!mailtoHref}
                          >
                            Send Email
                          </a>
                        </div>
                        {!prospect.email && (
                          <div className="text-xs text-muted-foreground">Add an email to enable sending</div>
                        )}
                      </div>
                      <div className="p-2 rounded border space-y-2">
                        <div className="font-medium">WhatsApp ({sentimentLabel})</div>
                        <pre className="whitespace-pre-wrap text-muted-foreground">
                          {selectedWa || "-"}
                        </pre>
                        <div className="flex gap-2">
                          <a
                            className="inline-flex items-center justify-center rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                            href={whatsappHref}
                            target={whatsappHref ? "_blank" : undefined}
                            rel={whatsappHref ? "noopener noreferrer" : undefined}
                            aria-disabled={!whatsappHref}
                          >
                            Open WhatsApp
                          </a>
                        </div>
                        {!prospect.phone && (
                          <div className="text-xs text-muted-foreground">Add a phone number to enable sending</div>
                        )}
                      </div>
                    </>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-2 rounded border">
                      <div className="font-medium mb-1">Email (Positive)</div>
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {data.followUps.emailPositive || "-"}
                      </pre>
                    </div>
                    <div className="p-2 rounded border">
                      <div className="font-medium mb-1">Email (Neutral)</div>
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {data.followUps.emailNeutral || "-"}
                      </pre>
                    </div>
                    <div className="p-2 rounded border">
                      <div className="font-medium mb-1">Email (Negative)</div>
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {data.followUps.emailNegative || "-"}
                      </pre>
                    </div>
                    <div className="p-2 rounded border">
                      <div className="font-medium mb-1">WhatsApp (Positive)</div>
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {data.followUps.whatsappPositive || "-"}
                      </pre>
                    </div>
                    <div className="p-2 rounded border">
                      <div className="font-medium mb-1">WhatsApp (Neutral)</div>
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {data.followUps.whatsappNeutral || "-"}
                      </pre>
                    </div>
                    <div className="p-2 rounded border">
                      <div className="font-medium mb-1">WhatsApp (Negative)</div>
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {data.followUps.whatsappNegative || "-"}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { RecommendationsDialog as ChatRecommendationsDialog };

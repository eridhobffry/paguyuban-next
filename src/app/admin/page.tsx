"use client";

import { useState } from "react";
import { useAdminData } from "@/hooks/useAdminData";
import {
  PendingRequests,
  UserManagement,
  ProcessedRequests,
  DocumentUpload,
  DocumentLibrary,
  EditDocumentModal,
  FollowUpsList,
  RecommendationsDialog,
} from "@/components/admin";
import { useChatSummaries } from "@/hooks/useChatSummaries";
import { getRecommendationsWithCache } from "@/hooks/useAdminRecommendations";
import { extractProspectFromSummary } from "@/lib/prospect";
import type { ChatRecommendationsData } from "@/types/analytics";
import type { DocumentRow } from "@/types/documents";
import { Card } from "@/components/ui/card";

export default function AdminDashboard() {
  const {
    accessRequests,
    users,
    documents,
    loading,
    fetchAccessRequests,
    fetchUsers,
    fetchDocuments,
    setAccessRequests,
    setUsers,
  } = useAdminData();
  const [editingDoc, setEditingDoc] = useState<DocumentRow | null>(null);
  const { summaries, deleteSummary } = useChatSummaries("30d");
  const [recOpen, setRecOpen] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [recData, setRecData] = useState<ChatRecommendationsData | null>(null);
  const [currentRecItem, setCurrentRecItem] = useState<{
    sessionId: string;
    summary: string;
    sentiment: string | null;
  } | null>(null);
  const [currentProspect, setCurrentProspect] = useState<ReturnType<typeof extractProspectFromSummary> | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card variant="glass" className="p-7">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage access requests, users, and documents. Financial analytics
            live under Financial.
          </p>
        </div>
      </Card>

      <div className="space-y-6">
        <FollowUpsList
          items={summaries.slice(0, 5)}
          onRecommend={handleRecommend}
          onDelete={(id) => deleteSummary(id)}
        />
        <div className="text-right">
          <a className="text-sm underline" href="/admin/follow-ups">
            View all follow-ups
          </a>
        </div>
        <PendingRequests
          requests={accessRequests}
          onRefresh={fetchAccessRequests}
          onUserRefresh={fetchUsers}
        />
        <UserManagement users={users} onRefresh={fetchUsers} />
        <ProcessedRequests
          requests={accessRequests}
          onRefresh={fetchAccessRequests}
          setAccessRequests={setAccessRequests}
          onUserRefresh={fetchUsers}
          setUsers={setUsers}
        />
        <Card variant="glass">
          <div className="mb-4">
            <h2 className="text-lg font-medium">Document Management</h2>
            <p className="text-sm text-muted-foreground">
              Upload and manage executive documents.
            </p>
          </div>
          <div className="space-y-6">
            <DocumentUpload onRefresh={fetchDocuments} />
            <DocumentLibrary
              documents={documents}
              onRefresh={fetchDocuments}
              onEdit={setEditingDoc}
            />
            {editingDoc && (
              <EditDocumentModal
                document={editingDoc}
                onClose={() => setEditingDoc(null)}
                onRefresh={fetchDocuments}
              />
            )}
          </div>
        </Card>
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
    </div>
  );
}

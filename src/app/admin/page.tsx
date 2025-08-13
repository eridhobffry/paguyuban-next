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
} from "@/components/admin";
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
      </div>
    </div>
  );
}

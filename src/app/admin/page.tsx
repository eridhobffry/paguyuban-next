"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminData } from "@/hooks/useAdminData";
import {
  AdminHeader,
  PendingRequests,
  UserManagement,
  ProcessedRequests,
  DocumentUpload,
  DocumentLibrary,
  EditDocumentModal,
} from "@/components/admin";
import { Document } from "@/types/admin";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const {
    accessRequests,
    users,
    documents,
    loading,
    fetchAccessRequests,
    fetchUsers,
    fetchDocuments,
  } = useAdminData();
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <AdminHeader />

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="users"
              onClick={(e) => {
                e.preventDefault();
                router.push("/admin/user");
              }}
            >
              User Management
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              onClick={(e) => {
                e.preventDefault();
                router.push("/admin/documents");
              }}
            >
              Document Management
            </TabsTrigger>
            <TabsTrigger
              value="financial"
              onClick={(e) => {
                e.preventDefault();
                router.push("/admin/financial");
              }}
            >
              Financial
            </TabsTrigger>
          </TabsList>
          {/* Intentionally omit <TabsContent value="financial"> to avoid jitter; clicking navigates to /admin/financial */}

          <TabsContent value="users" className="space-y-6">
            <PendingRequests
              requests={accessRequests}
              onRefresh={fetchAccessRequests}
              onUserRefresh={fetchUsers}
            />
            <UserManagement users={users} onRefresh={fetchUsers} />
            <ProcessedRequests requests={accessRequests} />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

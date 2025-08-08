"use client";

import {
  AdminHeader,
  DocumentLibrary,
  DocumentUpload,
  EditDocumentModal,
} from "@/components/admin";
import { useAdminData } from "@/hooks/useAdminData";
import { useState } from "react";
import { Document } from "@/types/admin";

export default function AdminDocumentsPage() {
  const { documents, loading, fetchDocuments } = useAdminData();
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
      </div>
    </div>
  );
}

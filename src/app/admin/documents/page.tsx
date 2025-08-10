"use client";

import {
  AdminHeader,
  DocumentLibrary,
  DocumentUpload,
  EditDocumentModal,
} from "@/components/admin";
import { useAdminData } from "@/hooks/useAdminData";
import { useState } from "react";
import type { DocumentRow } from "@/types/documents";

export default function AdminDocumentsPage() {
  const { documents, loading, fetchDocuments } = useAdminData();
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
      <AdminHeader />
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
  );
}

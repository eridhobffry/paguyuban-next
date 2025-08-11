"use client";

import {
  AdminHeader,
  DocumentLibrary,
  DocumentUpload,
  EditDocumentModal,
} from "@/components/admin";
import { useDocumentsLive } from "@/hooks/useDocumentsLive";
import { useState } from "react";
import type { DocumentRow } from "@/types/documents";

export default function AdminDocumentsPage() {
  const { documents, loading, refresh } = useDocumentsLive();
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
      <DocumentUpload onRefresh={refresh} />
      <DocumentLibrary
        documents={documents}
        onRefresh={refresh}
        onEdit={setEditingDoc}
      />
      {editingDoc && (
        <EditDocumentModal
          document={editingDoc}
          onClose={() => setEditingDoc(null)}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}

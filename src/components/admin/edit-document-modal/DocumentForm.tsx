"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentRow } from "@/types/documents";

interface DocumentFormProps {
  editingDoc: DocumentRow;
  onDocumentChange: (doc: DocumentRow) => void;
}

export default function DocumentForm({
  editingDoc,
  onDocumentChange,
}: DocumentFormProps) {
  return (
    <>
      <div>
        <Label>Title</Label>
        <Input
          value={editingDoc.title}
          onChange={(e) =>
            onDocumentChange({
              ...editingDoc,
              title: e.target.value,
            })
          }
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={editingDoc.description}
          onChange={(e) =>
            onDocumentChange({
              ...editingDoc,
              description: e.target.value,
            })
          }
          rows={3}
        />
      </div>
      <div>
        <Label>Preview</Label>
        <Textarea
          value={editingDoc.preview}
          onChange={(e) =>
            onDocumentChange({
              ...editingDoc,
              preview: e.target.value,
            })
          }
          rows={2}
        />
      </div>
    </>
  );
}

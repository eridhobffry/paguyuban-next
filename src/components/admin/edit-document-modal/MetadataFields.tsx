"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { documentTypes } from "@/types/admin";
import type { DocumentRow } from "@/types/documents";

interface MetadataFieldsProps {
  editingDoc: DocumentRow;
  onDocumentChange: (doc: DocumentRow) => void;
}

export default function MetadataFields({
  editingDoc,
  onDocumentChange,
}: MetadataFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Type</Label>
        <Select
          value={editingDoc.type}
          onValueChange={(value) =>
            onDocumentChange({ ...editingDoc, type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Slug (stable key)</Label>
        <Input
          value={editingDoc.slug ?? ""}
          onChange={(e) =>
            onDocumentChange({ ...editingDoc, slug: e.target.value })
          }
          placeholder="e.g. sponsorship-kit"
        />
      </div>
      <div>
        <Label>Pages</Label>
        <Input
          value={editingDoc.pages}
          onChange={(e) =>
            onDocumentChange({
              ...editingDoc,
              pages: e.target.value,
            })
          }
        />
      </div>
    </div>
  );
}

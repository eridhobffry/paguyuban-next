"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Upload } from "lucide-react";
import type { DocumentRow } from "@/types/documents";

interface PreviewPaneProps {
  editingDoc: DocumentRow;
  onDocumentChange: (doc: DocumentRow) => void;
  onFileReplace: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export default function PreviewPane({
  editingDoc,
  onDocumentChange,
  onFileReplace,
  isUploading = false,
}: PreviewPaneProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onFileReplace(file);
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>File</Label>
          {editingDoc.fileUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  editingDoc.fileUrl!,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
          )}
        </div>
        <div>
          <input
            id="replace-file-input"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
          />
          <Label htmlFor="replace-file-input">
            <Button variant="secondary" size="sm" disabled={isUploading}>
              <Upload className="w-4 h-4 mr-1" />
              {isUploading ? "Uploading..." : "Replace File"}
            </Button>
          </Label>
        </div>
      </div>
    </div>
  );
}

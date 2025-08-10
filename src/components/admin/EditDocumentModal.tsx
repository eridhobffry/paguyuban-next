"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { documentTypes } from "@/types/admin";
import type { DocumentRow } from "@/types/documents";
import { useMediaUpload } from "@/hooks/useUpload";
import { Eye, Upload } from "lucide-react";

interface EditDocumentModalProps {
  document: DocumentRow;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export function EditDocumentModal({
  document,
  onClose,
  onRefresh,
}: EditDocumentModalProps) {
  const [editingDoc, setEditingDoc] = useState<DocumentRow>(document);
  const [processing, setProcessing] = useState(false);
  const { uploading, uploadFile, commitTemp, discardTemp } =
    useMediaUpload("documents");

  const handleDocumentUpdate = async () => {
    setProcessing(true);
    try {
      const response = await fetch("/api/admin/documents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingDoc.id,
          title: editingDoc.title,
          description: editingDoc.description,
          preview: editingDoc.preview,
          pages: editingDoc.pages,
          type: editingDoc.type,
          icon: editingDoc.icon,
          file_url: editingDoc.fileUrl,
          external_url: editingDoc.externalUrl,
          restricted: editingDoc.restricted,
        }),
      });

      if (response.ok) {
        await onRefresh();
        commitTemp();
        onClose();
      } else {
        await discardTemp();
        alert("Failed to update document");
      }
    } catch (error) {
      console.error("Update error:", error);
      await discardTemp();
      alert("Failed to update document");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    await discardTemp();
    onClose();
  };

  const handleReplaceFile = async (file: File) => {
    try {
      const url = await uploadFile(file);
      setEditingDoc((prev) => ({
        ...prev,
        file_url: url,
        external_url: "",
      }));
    } catch (err) {
      console.error("Replace file upload error:", err);
      alert("Failed to upload new file");
    }
  };

  return (
    <Card className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="p-0 mb-4">
          <CardTitle>Edit Document</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={editingDoc.title}
              onChange={(e) =>
                setEditingDoc({
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
                setEditingDoc({
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
                setEditingDoc({
                  ...editingDoc,
                  preview: e.target.value,
                })
              }
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select
                value={editingDoc.type}
                onValueChange={(value) =>
                  setEditingDoc({ ...editingDoc, type: value })
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
              <Label>Pages</Label>
              <Input
                value={editingDoc.pages}
                onChange={(e) =>
                  setEditingDoc({
                    ...editingDoc,
                    pages: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={editingDoc.restricted}
              onChange={(e) =>
                setEditingDoc({
                  ...editingDoc,
                  restricted: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
            <Label>Restricted Access</Label>
          </div>
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleReplaceFile(file);
                  }}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <Label htmlFor="replace-file-input">
                  <Button variant="secondary" size="sm" disabled={uploading}>
                    <Upload className="w-4 h-4 mr-1" />
                    {uploading ? "Uploading..." : "Replace File"}
                  </Button>
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleDocumentUpdate}
                disabled={processing || uploading}
              >
                {processing ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

"use client";

import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
  const [newHighlight, setNewHighlight] = useState("");
  const original = document;
  const hasChanges = useMemo(() => {
    const a = editingDoc;
    const b = original;
    const sameArray = (x?: string[] | null, y?: string[] | null) =>
      JSON.stringify(x ?? []) === JSON.stringify(y ?? []);
    return !(
      a.title === b.title &&
      a.description === b.description &&
      a.preview === b.preview &&
      a.pages === b.pages &&
      a.type === b.type &&
      a.icon === b.icon &&
      a.restricted === b.restricted &&
      a.fileUrl === b.fileUrl &&
      a.externalUrl === b.externalUrl &&
      sameArray(
        a.marketingHighlights as string[] | null,
        b.marketingHighlights as string[] | null
      )
    );
  }, [editingDoc, original]);

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
          marketing_highlights: editingDoc.marketingHighlights ?? null,
        }),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Document updated");
        await onRefresh();
        commitTemp();
        onClose();
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data?.error || "Failed to update document");
        await discardTemp();
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Network error while updating");
      await discardTemp();
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
        fileUrl: url,
        externalUrl: "",
      }));
    } catch (err) {
      console.error("Replace file upload error:", err);
      alert("Failed to upload new file");
    }
  };

  const handleAddHighlight = () => {
    const value = newHighlight.trim();
    if (!value) return;
    setEditingDoc((prev) => ({
      ...prev,
      marketingHighlights: [
        ...((prev.marketingHighlights as string[] | null) ?? []),
        value,
      ],
    }));
    setNewHighlight("");
  };

  const handleRemoveHighlight = (index: number) => {
    setEditingDoc((prev) => ({
      ...prev,
      marketingHighlights: (
        (prev.marketingHighlights as string[] | null) ?? []
      ).filter((_, i) => i !== index),
    }));
  };

  const handleAIRefine = async () => {
    try {
      toast.info("Refining with AI...");
      const res = await fetch("/api/admin/documents/refine", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingDoc.title,
          description: editingDoc.description,
          preview: editingDoc.preview,
          pages: editingDoc.pages,
          type: editingDoc.type,
          icon: editingDoc.icon,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Refine failed");
      setEditingDoc((prev) => ({
        ...prev,
        title: data.refined.title ?? prev.title,
        description: data.refined.description ?? prev.description,
        preview: data.refined.preview ?? prev.preview,
        pages: data.refined.pages || prev.pages,
        type: data.refined.type || prev.type,
        icon: data.refined.icon || prev.icon,
        marketingHighlights:
          (data.refined.marketingHighlights as string[] | undefined) ??
          prev.marketingHighlights,
      }));
      toast.success("AI suggestions applied");
    } catch (err) {
      console.error(err);
      toast.error("AI refine failed");
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
          <div>
            <Label>Highlights</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add a highlight and press Enter or Add"
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddHighlight();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddHighlight}
              >
                Add
              </Button>
            </div>
            {Array.isArray(editingDoc.marketingHighlights) &&
              editingDoc.marketingHighlights.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editingDoc.marketingHighlights.map((h, i) => (
                    <Badge
                      key={`${h}-${i}`}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <span>{h}</span>
                      <button
                        type="button"
                        className="text-xs opacity-70 hover:opacity-100"
                        onClick={() => handleRemoveHighlight(i)}
                        aria-label={`Remove ${h}`}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
              <Button variant="outline" onClick={handleAIRefine}>
                AI Refine
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleDocumentUpdate}
                disabled={processing || uploading || !hasChanges}
              >
                {processing
                  ? "Saving..."
                  : hasChanges
                  ? "Save Changes"
                  : "No Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

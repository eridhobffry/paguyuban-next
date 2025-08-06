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
import { Document, documentTypes } from "@/types/admin";

interface EditDocumentModalProps {
  document: Document;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export function EditDocumentModal({
  document,
  onClose,
  onRefresh,
}: EditDocumentModalProps) {
  const [editingDoc, setEditingDoc] = useState<Document>(document);
  const [processing, setProcessing] = useState(false);

  const handleDocumentUpdate = async () => {
    setProcessing(true);
    try {
      const response = await fetch("/api/admin/documents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingDoc),
      });

      if (response.ok) {
        await onRefresh();
        onClose();
      } else {
        alert("Failed to update document");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update document");
    } finally {
      setProcessing(false);
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
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleDocumentUpdate} disabled={processing}>
              {processing ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

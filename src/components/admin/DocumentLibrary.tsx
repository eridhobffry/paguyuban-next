"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  BarChart3,
  Zap,
  Users,
  TrendingUp,
  Globe,
  Target,
  PieChart,
  Eye,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Brain,
} from "lucide-react";
import type { DocumentRow } from "@/types/documents";

interface DocumentLibraryProps {
  documents: DocumentRow[];
  onRefresh: () => Promise<void>;
  onEdit: (doc: DocumentRow) => void;
}

const iconComponents = {
  FileText,
  BarChart3,
  Zap,
  Users,
  TrendingUp,
  Globe,
  Target,
  PieChart,
};

export function DocumentLibrary({
  documents,
  onRefresh,
  onEdit,
}: DocumentLibraryProps) {
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);

  const getIconComponent = (iconName: string) => {
    return iconComponents[iconName as keyof typeof iconComponents] || FileText;
  };

  const handleDocumentDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setProcessingDocId(id);
    try {
      const response = await fetch("/api/admin/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await onRefresh();
      } else {
        alert("Failed to delete document");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete document");
    } finally {
      setProcessingDocId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Library ({documents.length})</CardTitle>
        <CardDescription>
          Manage your executive documentation for stakeholder access
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No documents yet. Upload your first document above.
          </p>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => {
              const IconComponent = getIconComponent(doc.icon);
              return (
                <div
                  key={doc.id}
                  className="p-6 border rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <IconComponent className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{doc.title}</h3>
                          {doc.aiGenerated && (
                            <Badge variant="outline" className="text-xs">
                              <Brain className="w-3 h-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                          {doc.restricted ? (
                            <Lock className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          {doc.pages} • {doc.type}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          {doc.description}
                        </p>
                        <p className="text-sm text-gray-500 italic">
                          &quot;{doc.preview}&quot;
                        </p>
                        {Array.isArray(doc.marketingHighlights) &&
                          doc.marketingHighlights.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {doc.marketingHighlights
                                .slice(0, 3)
                                .map((h, i) => (
                                  <Badge key={i} variant="secondary">
                                    {h}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        <div className="mt-3 text-xs text-gray-400">
                          Created by {doc.createdBy} on{" "}
                          {new Date(
                            doc.createdAt as unknown as string
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {(doc.fileUrl || doc.externalUrl) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (doc.externalUrl) {
                              window.open(
                                doc.externalUrl,
                                "_blank",
                                "noopener,noreferrer"
                              );
                            } else if (doc.fileUrl) {
                              window.open(
                                doc.fileUrl,
                                "_blank",
                                "noopener,noreferrer"
                              );
                            }
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(doc)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDocumentDelete(doc.id)}
                        disabled={processingDocId === doc.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

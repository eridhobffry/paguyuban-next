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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Upload,
  ExternalLink,
  Plus,
  Brain,
  FileText,
  BarChart3,
  Zap,
  Users,
  TrendingUp,
  Globe,
  Target,
  PieChart,
} from "lucide-react";
import { DocumentFormData, documentTypes, iconOptions } from "@/types/admin";

interface DocumentUploadProps {
  onRefresh: () => Promise<void>;
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

export function DocumentUpload({ onRefresh }: DocumentUploadProps) {
  const [uploadMode, setUploadMode] = useState<"file" | "url" | "manual">(
    "file"
  );
  const [uploadLoading, setUploadLoading] = useState(false);
  const [documentForm, setDocumentForm] = useState<DocumentFormData>({
    title: "",
    description: "",
    preview: "",
    pages: "",
    type: "",
    icon: "",
    external_url: "",
    restricted: true,
  });

  const handleFileUpload = async (file: File) => {
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/documents", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await onRefresh();
        alert("Document uploaded and analyzed successfully!");
      } else {
        alert("Failed to upload document");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleUrlUpload = async (url: string) => {
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("external_url", url);

      const response = await fetch("/api/admin/documents", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await onRefresh();
        alert("Document analyzed from URL successfully!");
      } else {
        alert("Failed to analyze document from URL");
      }
    } catch (error) {
      console.error("URL upload error:", error);
      alert("Failed to analyze document from URL");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleManualCreate = async () => {
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("manual_data", JSON.stringify(documentForm));

      const response = await fetch("/api/admin/documents", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await onRefresh();
        setDocumentForm({
          title: "",
          description: "",
          preview: "",
          pages: "",
          type: "",
          icon: "",
          external_url: "",
          restricted: true,
        });
        alert("Document created successfully!");
      } else {
        alert("Failed to create document");
      }
    } catch (error) {
      console.error("Manual create error:", error);
      alert("Failed to create document");
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-500" />
          AI-Powered Document Management
        </CardTitle>
        <CardDescription>
          Upload files, analyze URLs, or create documents manually. AI will
          generate optimized metadata for stakeholder engagement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={uploadMode}
          onValueChange={(value) =>
            setUploadMode(value as "file" | "url" | "manual")
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url">
              <ExternalLink className="w-4 h-4 mr-2" />
              Analyze URL
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Plus className="w-4 h-4 mr-2" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt"
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-lg font-medium">Upload Document</p>
                  <p className="text-sm text-gray-500">
                    PDF, DOC, DOCX, or TXT files supported
                  </p>
                  <p className="text-xs text-blue-600">
                    AI will automatically analyze and generate metadata
                  </p>
                </div>
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="url-input">Document URL</Label>
                <Input
                  id="url-input"
                  placeholder="https://docs.google.com/document/d/..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const url = (e.target as HTMLInputElement).value;
                      if (url) handleUrlUpload(url);
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => {
                  const input = document.getElementById(
                    "url-input"
                  ) as HTMLInputElement;
                  if (input?.value) handleUrlUpload(input.value);
                }}
                disabled={uploadLoading}
                className="w-full"
              >
                {uploadLoading ? "Analyzing..." : "Analyze URL with AI"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-title">Title</Label>
                <Input
                  id="manual-title"
                  value={documentForm.title}
                  onChange={(e) =>
                    setDocumentForm({
                      ...documentForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="Executive Business Plan"
                />
              </div>
              <div>
                <Label htmlFor="manual-pages">Pages</Label>
                <Input
                  id="manual-pages"
                  value={documentForm.pages}
                  onChange={(e) =>
                    setDocumentForm({
                      ...documentForm,
                      pages: e.target.value,
                    })
                  }
                  placeholder="47 pages"
                />
              </div>
              <div>
                <Label htmlFor="manual-type">Type</Label>
                <Select
                  value={documentForm.type}
                  onValueChange={(value) =>
                    setDocumentForm({ ...documentForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
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
                <Label htmlFor="manual-icon">Icon</Label>
                <Select
                  value={documentForm.icon}
                  onValueChange={(value) =>
                    setDocumentForm({ ...documentForm, icon: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => {
                      const IconComponent =
                        iconComponents[
                          icon.value as keyof typeof iconComponents
                        ];
                      return (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="manual-description">Description</Label>
                <Textarea
                  id="manual-description"
                  value={documentForm.description}
                  onChange={(e) =>
                    setDocumentForm({
                      ...documentForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Comprehensive business strategy with market analysis..."
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="manual-preview">Preview</Label>
                <Textarea
                  id="manual-preview"
                  value={documentForm.preview}
                  onChange={(e) =>
                    setDocumentForm({
                      ...documentForm,
                      preview: e.target.value,
                    })
                  }
                  placeholder="Detailed market opportunity analysis for Indonesia-Germany trade..."
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="manual-url">External URL (optional)</Label>
                <Input
                  id="manual-url"
                  value={documentForm.external_url}
                  onChange={(e) =>
                    setDocumentForm({
                      ...documentForm,
                      external_url: e.target.value,
                    })
                  }
                  placeholder="https://docs.google.com/document/d/..."
                />
              </div>
              <div className="md:col-span-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="manual-restricted"
                  checked={documentForm.restricted}
                  onChange={(e) =>
                    setDocumentForm({
                      ...documentForm,
                      restricted: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="manual-restricted">Restricted Access</Label>
              </div>
            </div>
            <Button
              onClick={handleManualCreate}
              disabled={
                uploadLoading || !documentForm.title || !documentForm.type
              }
              className="w-full"
            >
              {uploadLoading ? "Creating..." : "Create Document"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, RefreshCw, Eye, EyeOff, Sparkles } from "lucide-react";
import { Speaker } from "@/types/people";
import { Artist } from "@/types/people";
import { Sponsor } from "@/types/people";

interface KnowledgeData {
  speakers: Speaker[];
  artists: Artist[];
  sponsors: Sponsor[];
  overlay: Record<string, unknown>;
}

interface CompilationResult {
  conflicts?: Array<{
    path: string;
    existingValue: unknown;
    newValue: unknown;
    reasoning: string;
    resolution: string;
  }>;
  enhancements?: Array<{
    path: string;
    type: string;
    description: string;
  }>;
  summary: string;
  compiledKnowledge: Record<string, unknown>;
}

export default function KnowledgeAdminPage() {
  const [knowledge, setKnowledge] = useState<KnowledgeData>({
    speakers: [],
    artists: [],
    sponsors: [],
    overlay: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [compilationResult, setCompilationResult] =
    useState<CompilationResult | null>(null);

  // Manual entry form state
  const [manualDescription, setManualDescription] = useState("");
  const [processingSmartEntry, setProcessingSmartEntry] = useState(false);
  const { toast } = useToast();

  // Load current knowledge overlay with static knowledge merged
  const loadKnowledge = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/knowledge");
      if (!response.ok) throw new Error("Failed to load knowledge");

      const data = await response.json();

      setKnowledge(data);
      setJsonText(JSON.stringify(data.overlay, null, 2));
    } catch (error) {
      console.error("Error loading knowledge:", error);
      toast({
        title: "Error",
        description: "Failed to load knowledge overlay",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Save knowledge overlay
  const saveKnowledge = async () => {
    try {
      setSaving(true);
      let parsedOverlay: Record<string, unknown> = {};

      if (jsonText.trim()) {
        try {
          parsedOverlay = JSON.parse(jsonText);
        } catch {
          toast({
            title: "Invalid JSON",
            description: "Please check your JSON syntax",
            variant: "destructive",
          });
          return;
        }
      }

      const response = await fetch("/api/admin/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overlay: parsedOverlay,
          isActive: true, // Keep the overlay active
        }),
      });

      if (!response.ok) throw new Error("Failed to save knowledge");

      const updatedData = await response.json();
      setKnowledge((prev) => ({ ...prev, overlay: updatedData.overlay }));
      setJsonText(JSON.stringify(updatedData.overlay, null, 2));

      toast({
        title: "Success",
        description: "Knowledge overlay updated successfully",
      });
    } catch (error) {
      console.error("Error saving knowledge:", error);
      toast({
        title: "Error",
        description: "Failed to save knowledge overlay",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // AI-powered knowledge compilation
  const compileWithAI = async () => {
    try {
      setCompiling(true);
      let newKnowledge: Record<string, unknown> = {};

      if (jsonText.trim()) {
        try {
          newKnowledge = JSON.parse(jsonText);
        } catch {
          toast({
            title: "Invalid JSON",
            description: "Please check your JSON syntax before compiling",
            variant: "destructive",
          });
          return;
        }
      }

      const response = await fetch("/api/admin/knowledge/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newKnowledge,
          context: "Admin knowledge update via UI",
          compilationType: "enhance",
          autoApply: false, // Preview first
        }),
      });

      if (!response.ok) throw new Error("Compilation failed");

      const result = await response.json();
      setCompilationResult(result);

      toast({
        title: "AI Compilation Complete",
        description: `Found ${result.conflicts?.length || 0} conflicts, ${
          result.enhancements?.length || 0
        } enhancements`,
      });
    } catch (error) {
      console.error("Error compiling knowledge:", error);
      toast({
        title: "Compilation Error",
        description: "Failed to compile knowledge with AI",
        variant: "destructive",
      });
    } finally {
      setCompiling(false);
    }
  };

  // Apply AI compilation results
  const applyCompilation = async () => {
    if (!compilationResult) return;

    try {
      setSaving(true);
      const response = await fetch("/api/admin/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overlay: compilationResult.compiledKnowledge,
          isActive: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to apply compilation");

      const updatedData = await response.json();
      setKnowledge((prev) => ({ ...prev, overlay: updatedData.overlay }));
      setJsonText(JSON.stringify(updatedData.overlay, null, 2));
      setCompilationResult(null);

      toast({
        title: "Success",
        description: "AI-compiled knowledge applied successfully",
      });
    } catch (error) {
      console.error("Error applying compilation:", error);
      toast({
        title: "Error",
        description: "Failed to apply AI compilation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Upload CSV file
  const uploadCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `CSV uploaded successfully. ${result.recordsProcessed} records processed.`,
      });

      // Reload knowledge to show merged data
      await loadKnowledge();
    } catch (uploadError) {
      console.error("Error uploading CSV:", uploadError);
      toast({
        title: "Upload Error",
        description:
          uploadError instanceof Error
            ? uploadError.message
            : "Failed to upload CSV",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  // Handle JSON text changes
  const handleJsonChange = (value: string) => {
    setJsonText(value);
    try {
      if (value.trim()) {
        const parsed = JSON.parse(value);
        setKnowledge((prev) => ({ ...prev, overlay: parsed }));
      } else {
        setKnowledge((prev) => ({ ...prev, overlay: {} }));
      }
    } catch {
      // Invalid JSON - don't update overlay yet
    }
  };

  // Smart manual entry with AI assistance
  const addSmartEntry = async () => {
    if (!manualDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe what you want to add or update",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingSmartEntry(true);

      const response = await fetch("/api/admin/knowledge/smart-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: manualDescription,
          currentKnowledge: knowledge.overlay,
        }),
      });

      if (!response.ok) throw new Error("Failed to process smart entry");

      const result = await response.json();

      // Update knowledge state
      setKnowledge((prev) => ({ ...prev, overlay: result.updatedKnowledge }));
      setJsonText(JSON.stringify(result.updatedKnowledge, null, 2));

      // Clear form
      setManualDescription("");

      toast({
        title: "Smart Entry Added",
        description: `${result.summary}`,
      });
    } catch (error) {
      console.error("Error processing smart entry:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to process entry",
        variant: "destructive",
      });
    } finally {
      setProcessingSmartEntry(false);
    }
  };

  // Clear all knowledge
  const clearAllKnowledge = async () => {
    if (
      confirm(
        "Are you sure you want to clear all knowledge? This action cannot be undone."
      )
    ) {
      try {
        setKnowledge((prev) => ({ ...prev, overlay: {} }));
        setJsonText("{}");

        toast({
          title: "Knowledge Cleared",
          description: "All knowledge entries have been removed",
        });
      } catch (error) {
        console.error("Error clearing knowledge:", error);
        toast({
          title: "Error",
          description: "Failed to clear knowledge",
          variant: "destructive",
        });
      }
    }
  };

  // Validate JSON
  const isValidJson = () => {
    try {
      JSON.parse(jsonText);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    loadKnowledge();
  }, [loadKnowledge]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Knowledge Overlay Management
        </h1>
        <p className="text-muted-foreground">
          Manage dynamic knowledge data for the AI chat assistant. This data
          overrides static knowledge and supports CSV uploads.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Knowledge Base Status
            </CardTitle>
            <CardDescription>
              Live view of the dynamically compiled knowledge base.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Speakers: {knowledge.speakers.length}</span>
              <span>Artists: {knowledge.artists.length}</span>
              <span>Sponsors: {knowledge.sponsors.length}</span>
              <span>
                Manual Overlays: {Object.keys(knowledge.overlay).length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList>
            <TabsTrigger value="manual">Smart Entry</TabsTrigger>
            <TabsTrigger value="editor">JSON Editor</TabsTrigger>
            <TabsTrigger value="upload">CSV Upload</TabsTrigger>
            <TabsTrigger value="ai-compile">AI Compilation</TabsTrigger>
            <TabsTrigger value="preview">Live Knowledge Preview</TabsTrigger>
            <TabsTrigger value="dynamic-data">Dynamic Data Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Overlay Editor</CardTitle>
                <CardDescription>
                  Edit the knowledge overlay as JSON. Use dot notation for
                  nested paths (e.g., financials.revenue.total).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="json-editor">JSON Content</Label>
                  <Textarea
                    id="json-editor"
                    value={jsonText}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    placeholder='{"financials": {"revenue": {"total": 1018660}}}'
                    className={`min-h-[400px] font-mono ${
                      !isValidJson() && jsonText.trim()
                        ? "border-destructive"
                        : ""
                    }`}
                  />
                  {!isValidJson() && jsonText.trim() && (
                    <Alert variant="destructive">
                      <AlertDescription>Invalid JSON syntax</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={saveKnowledge}
                    disabled={saving || !isValidJson()}
                  >
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={compileWithAI}
                    disabled={compiling || !isValidJson()}
                  >
                    {compiling && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Compile
                  </Button>
                  <Button variant="outline" onClick={loadKnowledge}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Smart Entry</CardTitle>
                <CardDescription>
                  Describe what you want to add or update, and AI will
                  intelligently categorize and structure it for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smart-description">
                      Describe your update
                    </Label>
                    <Textarea
                      id="smart-description"
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder="e.g., 'Update the event location to Berlin Convention Center' or 'Add a new Bronze sponsor tier for €12,000' or 'Remove the old pricing information'"
                      className="min-h-[120px]"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe what you want to add, update, or delete. AI will
                      handle the categorization and structuring.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={addSmartEntry}
                      disabled={
                        !manualDescription.trim() || processingSmartEntry
                      }
                    >
                      {processingSmartEntry && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Sparkles className="mr-2 h-4 w-4" />
                      Process with AI
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setManualDescription("")}
                    >
                      Clear
                    </Button>
                    <Button variant="destructive" onClick={clearAllKnowledge}>
                      Clear All Knowledge
                    </Button>
                  </div>

                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Smart Entry Examples:</strong>
                      <br />
                      • &quot;Add a new speaker: John Doe, AI expert from
                      Google&quot;
                      <br />
                      • &quot;Update the venue capacity to 2000 people&quot;
                      <br />
                      • &quot;Set the Gold sponsor price to €45,000&quot;
                      <br />
                      • &quot;Remove the outdated contact phone number&quot;
                      <br />• &quot;Add networking session on Day 2 from 3-5
                      PM&quot;
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>CSV Upload</CardTitle>
                <CardDescription>
                  Upload CSV files with knowledge data. Format: path,value
                  columns where path uses dot notation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-upload">Choose CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={uploadCSV}
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing CSV...
                    </div>
                  )}
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>CSV Format Example:</strong>
                    <br />
                    <code>path,value</code>
                    <br />
                    <code>financials.revenue.total,1018660</code>
                    <br />
                    <code>event.location,Arena Berlin</code>
                    <br />
                    <code>sponsorship.bronze.price,15000</code>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-compile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Knowledge Compilation
                </CardTitle>
                <CardDescription>
                  Use AI to intelligently merge new knowledge with existing
                  data, resolve conflicts, and enhance information quality.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {compilationResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        AI Compilation Ready
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium mb-2">
                          Conflicts Resolved (
                          {compilationResult.conflicts?.length || 0})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {compilationResult.conflicts?.map(
                            (conflict, idx: number) => (
                              <div
                                key={idx}
                                className="text-xs p-2 bg-yellow-50 rounded"
                              >
                                <div className="font-mono">{conflict.path}</div>
                                <div className="text-muted-foreground">
                                  {conflict.reasoning}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">
                          Enhancements (
                          {compilationResult.enhancements?.length || 0})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {compilationResult.enhancements?.map(
                            (enhancement, idx: number) => (
                              <div
                                key={idx}
                                className="text-xs p-2 bg-blue-50 rounded"
                              >
                                <div className="font-mono">
                                  {enhancement.path}
                                </div>
                                <div className="text-muted-foreground">
                                  {enhancement.description}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm">{compilationResult.summary}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={applyCompilation} disabled={saving}>
                        {saving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Apply AI Compilation
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCompilationResult(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">
                        AI-Powered Knowledge Enhancement
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Let AI analyze your knowledge changes and provide
                        intelligent compilation with conflict resolution.
                      </p>
                      <Button
                        onClick={compileWithAI}
                        disabled={
                          compiling || !jsonText.trim() || !isValidJson()
                        }
                      >
                        {compiling && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Sparkles className="mr-2 h-4 w-4" />
                        Compile with AI
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        • AI will analyze conflicts between existing and new
                        knowledge
                      </p>
                      <p>
                        • Intelligent merging based on data types and context
                      </p>
                      <p>• Quality enhancements and validation</p>
                      <p>• Preview before applying changes</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Knowledge Preview
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Preview of the current knowledge overlay structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showPreview ? (
                  <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-96">
                    {JSON.stringify(knowledge, null, 2)}
                  </pre>
                ) : (
                  <div className="text-muted-foreground">
                    Click the eye icon to preview the knowledge structure
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dynamic-data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Data Sources</CardTitle>
                <CardDescription>
                  This data is pulled in real-time from the database. Edit this
                  information on their respective admin pages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    Speakers ({knowledge.speakers.length})
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {knowledge.speakers.map((s) => s.name).join(", ")}
                  </div>
                  <Button asChild variant="link" className="p-0 h-4">
                    <a href="/admin/speakers">Edit Speakers</a>
                  </Button>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    Artists ({knowledge.artists.length})
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {knowledge.artists.map((a) => a.name).join(", ")}
                  </div>
                  <Button asChild variant="link" className="p-0 h-4">
                    <a href="/admin/artists">Edit Artists</a>
                  </Button>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    Sponsors ({knowledge.sponsors.length})
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {knowledge.sponsors.map((s) => s.name).join(", ")}
                  </div>
                  <Button asChild variant="link" className="p-0 h-4">
                    <a href="/admin/sponsors">Edit Sponsors</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

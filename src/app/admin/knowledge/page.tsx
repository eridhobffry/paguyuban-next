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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Eye, Sparkles } from "lucide-react";
import KnowledgeQuerySection from "@/components/sections/KnowledgeQuerySection";
import { Speaker } from "@/types/people";
import { Artist } from "@/types/people";
import { Sponsor } from "@/types/people";

interface KnowledgeData {
  speakers: Speaker[];
  artists: Artist[];
  sponsors: Sponsor[];
  overlay: Record<string, unknown>;
}

export default function KnowledgeAdminPage() {
  const [knowledge, setKnowledge] = useState<KnowledgeData>({
    speakers: [],
    artists: [],
    sponsors: [],
    overlay: {},
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [manualDescription, setManualDescription] = useState("");
  const [processingSmartEntry, setProcessingSmartEntry] = useState(false);
  const { toast } = useToast();

  // Load knowledge from API
  const loadKnowledge = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/knowledge");
      if (!response.ok) throw new Error("Failed to load knowledge");
      const data = await response.json();
      setKnowledge(data);
    } catch (error) {
      console.error("Error loading knowledge:", error);
      toast({
        title: "Error",
        description: "Failed to load knowledge",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Smart entry handler
  const handleSmartEntrySubmit = async () => {
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

      setKnowledge((prev) => ({ ...prev, overlay: result.updatedKnowledge }));
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

  // CSV upload handler
  const handleCSVUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      event.target.value = "";
    }
  };

  // Query handler (placeholder)
  const _handleQuerySubmit = () => {
    toast({
      title: "Coming Soon",
      description:
        "Interactive querying will be available once we resolve AI dependencies",
    });
  };

  // Toggle preview function
  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
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
          🧠 Knowledge Brain Management
        </h1>
        <p className="text-muted-foreground">
          Your unified knowledge system - see, manage, and interact with your
          event data.
        </p>
      </div>

      <div className="grid gap-6">
        <Tabs defaultValue="brain-map" className="space-y-4">
          <TabsList className="grid grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="brain-map">🧠 Brain Map</TabsTrigger>
            <TabsTrigger value="admin-query">💬 Query</TabsTrigger>
            <TabsTrigger value="dynamic-data">📊 Data Sources</TabsTrigger>
            <TabsTrigger value="manual">✨ Smart Entry</TabsTrigger>
            <TabsTrigger value="upload">📁 CSV Upload</TabsTrigger>
          </TabsList>

          {/* 🧠 Brain Map Tab */}
          <TabsContent value="brain-map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🧠 Knowledge Brain Map</span>
                  <Button variant="outline" size="sm" onClick={loadKnowledge}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  Visual overview of your knowledge ecosystem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-4">
                      <div className="text-lg font-medium text-blue-700">
                        People & Talent
                      </div>
                      <div className="text-2xl font-bold">
                        {knowledge.speakers.length + knowledge.artists.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total people
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                      <div className="text-lg font-medium text-green-700">
                        Business
                      </div>
                      <div className="text-2xl font-bold">
                        {knowledge.sponsors.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sponsors
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="pt-4">
                      <div className="text-lg font-medium text-purple-700">
                        Knowledge
                      </div>
                      <div className="text-2xl font-bold">
                        {Object.keys(knowledge.overlay).length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Manual entries
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview Toggle */}
                <div className="flex justify-center">
                  <Button variant="outline" onClick={handleTogglePreview}>
                    <Eye className="h-4 w-4 mr-1" />
                    {showPreview ? "Hide" : "Show"} Knowledge Preview
                  </Button>
                </div>

                {showPreview && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Knowledge Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-64">
                        {JSON.stringify(knowledge, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href="/admin/speakers">Manage Speakers</a>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <a href="/admin/artists">Manage Artists</a>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <a href="/admin/sponsors">Manage Sponsors</a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTogglePreview}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Toggle Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 💬 Query Tab */}
          <TabsContent value="admin-query" className="space-y-4">
            <KnowledgeQuerySection />
          </TabsContent>

          {/* 📊 Data Sources Tab */}
          <TabsContent value="dynamic-data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📊 Data Sources</CardTitle>
                <CardDescription>
                  Live data from your database. Edit on respective admin pages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>👥 Speakers:</span>
                    <Badge variant="secondary">
                      {knowledge.speakers.length}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {knowledge.speakers
                      .slice(0, 3)
                      .map((s) => s.name)
                      .join(", ")}
                    {knowledge.speakers.length > 3 &&
                      ` +${knowledge.speakers.length - 3} more`}
                  </div>
                  <Button asChild variant="link" className="p-0 h-4">
                    <a href="/admin/speakers">Edit Speakers</a>
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>🎵 Artists:</span>
                    <Badge variant="secondary">
                      {knowledge.artists.length}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {knowledge.artists
                      .slice(0, 3)
                      .map((a) => a.name)
                      .join(", ")}
                    {knowledge.artists.length > 3 &&
                      ` +${knowledge.artists.length - 3} more`}
                  </div>
                  <Button asChild variant="link" className="p-0 h-4">
                    <a href="/admin/artists">Edit Artists</a>
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>💼 Sponsors:</span>
                    <Badge variant="secondary">
                      {knowledge.sponsors.length}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {knowledge.sponsors
                      .slice(0, 2)
                      .map((s) => s.name)
                      .join(", ")}
                    {knowledge.sponsors.length > 2 &&
                      ` +${knowledge.sponsors.length - 2} more`}
                  </div>
                  <Button asChild variant="link" className="p-0 h-4">
                    <a href="/admin/sponsors">Edit Sponsors</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ✨ Smart Entry Tab */}
          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>✨ Smart Entry</CardTitle>
                <CardDescription>
                  Describe what you want to add or update, and AI will
                  categorize it for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smart-description">
                    Describe your update
                  </Label>
                  <Textarea
                    id="smart-description"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="e.g., 'Update the event location to Berlin Convention Center' or 'Add a new Bronze sponsor tier for €12,000'"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSmartEntrySubmit}
                    disabled={!manualDescription.trim() || processingSmartEntry}
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
                </div>

                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Examples:</strong>
                    <br />• &quot;Add a new speaker: John Doe, AI expert from
                    Google&quot;
                    <br />• &quot;Update venue capacity to 2000 people&quot;
                    <br />• &quot;Set Gold sponsor price to €45,000&quot;
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 📁 CSV Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📁 CSV Upload</CardTitle>
                <CardDescription>
                  Upload CSV files with knowledge data. Format: path,value
                  columns.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-upload">Choose CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing CSV...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UploadControlsProps {
  onUrlUpload: (url: string) => void;
  onManualCreate: () => void;
  isLoading?: boolean;
  mode: "url" | "manual";
}

export default function UploadControls({
  onUrlUpload,
  onManualCreate,
  isLoading = false,
  mode,
}: UploadControlsProps) {
  const [url, setUrl] = useState("");

  const handleUrlSubmit = () => {
    if (url.trim()) {
      onUrlUpload(url.trim());
      setUrl("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleUrlSubmit();
    }
  };

  if (mode === "url") {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="url-input">Document URL</Label>
          <Input
            id="url-input"
            placeholder="https://docs.google.com/document/d/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={handleUrlSubmit}
          disabled={isLoading || !url.trim()}
          className="w-full"
        >
          {isLoading ? "Analyzing..." : "Analyze URL with AI"}
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={onManualCreate} disabled={isLoading} className="w-full">
      {isLoading ? "Creating..." : "Create Document"}
    </Button>
  );
}

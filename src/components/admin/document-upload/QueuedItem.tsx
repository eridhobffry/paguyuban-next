"use client";

import { Clock, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface QueuedItemProps {
  file: File;
  progress?: number;
  onRemove: () => void;
  status?: "pending" | "uploading" | "completed" | "error";
}

export default function QueuedItem({
  file,
  progress = 0,
  onRemove,
  status = "pending",
}: QueuedItemProps) {
  const getStatusColor = () => {
    switch (status) {
      case "uploading":
        return "text-blue-500";
      case "completed":
        return "text-green-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "uploading":
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case "completed":
        return <FileText className="w-4 h-4 text-green-500" />;
      case "error":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg border">
      {getStatusIcon()}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-gray-500">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
        {status === "uploading" && (
          <Progress value={progress} className="mt-2" />
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={status === "uploading"}
        className="h-8 w-8 p-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

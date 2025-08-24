"use client";

import { useState } from "react";
import QueuedItem from "./QueuedItem";

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
}

interface UploadProgressListProps {
  queue: UploadQueueItem[];
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
}

export default function UploadProgressList({
  queue,
  onRemove,
  onRetry,
}: UploadProgressListProps) {
  if (queue.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">
        Upload Queue ({queue.length})
      </h4>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {queue.map((item) => (
          <QueuedItem
            key={item.id}
            file={item.file}
            progress={item.progress}
            status={item.status}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

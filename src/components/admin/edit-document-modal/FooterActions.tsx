"use client";

import { Button } from "@/components/ui/button";

interface FooterActionsProps {
  onAIRefine: () => Promise<void>;
  onCancel: () => Promise<void>;
  onSave: () => Promise<void>;
  hasChanges: boolean;
  isProcessing?: boolean;
  isUploading?: boolean;
}

export default function FooterActions({
  onAIRefine,
  onCancel,
  onSave,
  hasChanges,
  isProcessing = false,
  isUploading = false,
}: FooterActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onAIRefine}>
        AI Refine
      </Button>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        onClick={onSave}
        disabled={isProcessing || isUploading || !hasChanges}
      >
        {isProcessing
          ? "Saving..."
          : hasChanges
          ? "Save Changes"
          : "No Changes"}
      </Button>
    </div>
  );
}

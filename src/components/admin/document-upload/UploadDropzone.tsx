"use client";

import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  accept?: string;
}

export default function UploadDropzone({
  onFileSelect,
  isLoading = false,
  accept = ".pdf,.doc,.docx,.txt",
}: UploadDropzoneProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
        accept={accept}
        disabled={isLoading}
      />
      <Label htmlFor="file-upload" className="cursor-pointer">
        <div className="space-y-2">
          <Upload className="w-12 h-12 mx-auto text-gray-400" />
          <p className="text-lg font-medium">
            {isLoading ? "Uploading..." : "Upload Document"}
          </p>
          <p className="text-sm text-gray-500">
            PDF, DOC, DOCX, or TXT files supported
          </p>
          <p className="text-xs text-blue-600">
            Uploads use secure Blob storage; metadata can be edited after
          </p>
        </div>
      </Label>
    </div>
  );
}

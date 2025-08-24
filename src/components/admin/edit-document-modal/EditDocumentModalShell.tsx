"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface EditDocumentModalShellProps {
  children: React.ReactNode;
}

export default function EditDocumentModalShell({
  children,
}: EditDocumentModalShellProps) {
  return (
    <Card className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="p-0 mb-4">
          <CardTitle>Edit Document</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-4">{children}</CardContent>
      </div>
    </Card>
  );
}

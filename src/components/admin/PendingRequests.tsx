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
import { AccessRequest } from "@/types/admin";

interface PendingRequestsProps {
  requests: AccessRequest[];
  onRefresh: () => Promise<void>;
  onUserRefresh: () => Promise<void>;
}

export function PendingRequests({
  requests,
  onRefresh,
  onUserRefresh,
}: PendingRequestsProps) {
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleRequest = async (id: number, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      const response = await fetch("/api/admin/access-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action }),
      });

      if (response.ok) {
        await onRefresh();
        await onUserRefresh();
      } else {
        alert("Failed to process request");
      }
    } catch (error) {
      console.error("Failed to process request:", error);
      alert("Failed to process request");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter((req) => req.status === "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Pending Access Requests ({pendingRequests.length})
        </CardTitle>
        <CardDescription>
          New requests waiting for your approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No pending requests at this time.
          </p>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/20"
              >
                <div>
                  <p className="font-medium">{request.email}</p>
                  <p className="text-sm text-gray-500">
                    Requested:{" "}
                    {new Date(request.requested_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRequest(request.id, "approve")}
                    disabled={processingId === request.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingId === request.id ? "Processing..." : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRequest(request.id, "reject")}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? "Processing..." : "Reject"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

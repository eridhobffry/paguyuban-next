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
import { User } from "@/types/admin";

interface PendingRequestsProps {
  requests: User[];
  onRefresh: () => Promise<void>;
  onUserRefresh: () => Promise<void>;
}

export function PendingRequests({
  requests,
  onRefresh,
  onUserRefresh,
}: PendingRequestsProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleRequest = async (email: string, action: "approve" | "reject") => {
    setProcessingId(email);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, action }),
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
                    {request.requested_at
                      ? new Date(request.requested_at).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRequest(request.email, "approve")}
                    disabled={processingId === request.email}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingId === request.email
                      ? "Processing..."
                      : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRequest(request.email, "reject")}
                    disabled={processingId === request.email}
                  >
                    {processingId === request.email
                      ? "Processing..."
                      : "Reject"}
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

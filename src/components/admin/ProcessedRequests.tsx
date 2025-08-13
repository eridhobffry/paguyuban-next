"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User as AdminUser } from "@/types/admin";
import { Button } from "@/components/ui/button";

interface ProcessedRequestsProps {
  requests: AdminUser[];
  onRefresh: () => Promise<void>;
  setAccessRequests: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  onUserRefresh: () => Promise<void>;
  setUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function ProcessedRequests({
  requests,
  onRefresh,
  setAccessRequests,
  onUserRefresh,
  setUsers,
}: ProcessedRequestsProps) {
  const handleDelete = async (email: string) => {
    try {
      // optimistic update
      let previous: AdminUser[] | null = null;
      setAccessRequests((curr) => {
        previous = curr;
        return curr.filter((r) => r.email !== email);
      });
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "delete" }),
      });
      if (!response.ok) {
        // revert
        if (previous) setAccessRequests(previous);
        alert("Failed to delete request");
        return;
      }
      // ensure fresh state from server in background
      onRefresh().catch(() => {});
    } catch (e) {
      console.error("Delete request failed", e);
      alert("Delete request failed");
    }
  };
  const handleApprove = async (email: string) => {
    let previous: AdminUser[] | null = null;
    setAccessRequests((curr) => {
      previous = curr;
      return curr.map((r) =>
        r.email === email ? { ...r, status: "active" } : r
      );
    });

    // Optimistically add/update Users list immediately
    let previousUsers: AdminUser[] | null = null;
    setUsers((curr) => {
      previousUsers = curr;
      const existing = curr.find((u) => u.email === email);
      if (existing) {
        return curr.map((u) =>
          u.email === email ? { ...u, status: "active" as const } : u
        );
      }
      const optimisticUser: AdminUser = {
        id: `optimistic-${email}`,
        email,
        role: "member",
        status: "active",
        created_at: new Date().toISOString(),
      } as AdminUser;
      return [optimisticUser, ...curr];
    });
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "approve" }),
      });
      if (!response.ok) {
        if (previous) setAccessRequests(previous);
        if (previousUsers) setUsers(previousUsers);
        alert("Failed to approve request");
        return;
      }
      onUserRefresh().catch(() => {});
      onRefresh().catch(() => {});
    } catch (e) {
      if (previous) setAccessRequests(previous);
      if (previousUsers) setUsers(previousUsers);
      console.error("Approve request failed", e);
      alert("Approve request failed");
    }
  };
  const processedRequests = requests.filter((req) => req.status !== "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processed Requests ({processedRequests.length})</CardTitle>
        <CardDescription>
          Previously approved or rejected requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {processedRequests.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No processed requests yet.
          </p>
        ) : (
          <div className="space-y-4">
            {processedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/20"
              >
                <div>
                  <p className="font-medium">{request.email}</p>
                  <p className="text-sm text-gray-500">
                    Requested:{" "}
                    {request.requested_at
                      ? new Date(
                          request.requested_at as string
                        ).toLocaleDateString()
                      : "-"}
                    {request.approved_at ? (
                      <>
                        {" • "}
                        Processed:{" "}
                        {new Date(
                          request.approved_at as string
                        ).toLocaleDateString()}
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.toUpperCase()}
                  </Badge>
                  {request.status === "rejected" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(request.email)}
                    >
                      Approve
                    </Button>
                  )}
                  {/* Sync button removed in single-table model */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm("Delete this user?")) {
                        handleDelete(request.email);
                      }
                    }}
                  >
                    Delete
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

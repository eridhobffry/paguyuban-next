"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface AccessRequest {
  id: number;
  email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
}

interface User {
  id: string;
  email: string;
  user_type: string;
  created_at: string;
  is_active: boolean;
}

export default function AdminDashboard() {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [processingEmail, setProcessingEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAccessRequests();
    fetchUsers();
  }, []);

  const fetchAccessRequests = async () => {
    try {
      const response = await fetch("/api/admin/access-requests");
      if (response.ok) {
        const data = await response.json();
        setAccessRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch access requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

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
        // Refresh the lists
        await fetchAccessRequests();
        await fetchUsers();
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

  const handleUserAccess = async (
    email: string,
    action: "revoke" | "restore" | "delete"
  ) => {
    setProcessingEmail(email);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, action }),
      });

      if (response.ok) {
        // Refresh the user list
        await fetchUsers();
      } else {
        alert("Failed to update user access");
      }
    } catch (error) {
      console.error("Failed to update user access:", error);
      alert("Failed to update user access");
    } finally {
      setProcessingEmail(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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

  const pendingRequests = accessRequests.filter(
    (req) => req.status === "pending"
  );
  const processedRequests = accessRequests.filter(
    (req) => req.status !== "pending"
  );

  const activeUsers = users.filter((user) => user.is_active);
  const inactiveUsers = users.filter((user) => !user.is_active);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage access requests for Paguyuban Messe 2026
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => router.push("/")} variant="outline">
              View Site
            </Button>
            <Button onClick={handleLogout} variant="destructive">
              Logout
            </Button>
          </div>
        </div>

        {/* Pending Requests */}
        <Card className="mb-8">
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
                    className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800"
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
                        {processingId === request.id
                          ? "Processing..."
                          : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRequest(request.id, "reject")}
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id
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

        {/* User Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Management ({users.length} total users)</CardTitle>
            <CardDescription>Manage access for approved users</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No users found.</p>
            ) : (
              <div className="space-y-6">
                {/* Active Users */}
                {activeUsers.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-700 mb-3">
                      Active Users ({activeUsers.length})
                    </h4>
                    <div className="space-y-3">
                      {activeUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20"
                        >
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-sm text-gray-500">
                              Joined:{" "}
                              {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-green-100 text-green-800">
                              ACTIVE
                            </Badge>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUserAccess(user.email, "revoke")
                                }
                                disabled={processingEmail === user.email}
                                className="border-orange-600 text-orange-600 hover:bg-orange-50"
                              >
                                {processingEmail === user.email
                                  ? "Revoking..."
                                  : "Revoke"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Are you sure you want to permanently delete ${user.email}? This cannot be undone.`
                                    )
                                  ) {
                                    handleUserAccess(user.email, "delete");
                                  }
                                }}
                                disabled={processingEmail === user.email}
                              >
                                {processingEmail === user.email
                                  ? "Deleting..."
                                  : "Delete"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inactive Users */}
                {inactiveUsers.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-700 mb-3">
                      Revoked Users ({inactiveUsers.length})
                    </h4>
                    <div className="space-y-3">
                      {inactiveUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-red-50 dark:bg-red-900/20"
                        >
                          <div>
                            <p className="font-medium text-gray-600">
                              {user.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              Joined:{" "}
                              {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-red-100 text-red-800">
                              REVOKED
                            </Badge>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUserAccess(user.email, "restore")
                                }
                                disabled={processingEmail === user.email}
                                className="border-green-600 text-green-600 hover:bg-green-50"
                              >
                                {processingEmail === user.email
                                  ? "Restoring..."
                                  : "Restore"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Are you sure you want to permanently delete ${user.email}? This cannot be undone.`
                                    )
                                  ) {
                                    handleUserAccess(user.email, "delete");
                                  }
                                }}
                                disabled={processingEmail === user.email}
                              >
                                {processingEmail === user.email
                                  ? "Deleting..."
                                  : "Delete"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Requests */}
        <Card>
          <CardHeader>
            <CardTitle>
              Processed Requests ({processedRequests.length})
            </CardTitle>
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
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{request.email}</p>
                      <p className="text-sm text-gray-500">
                        Requested:{" "}
                        {new Date(request.requested_at).toLocaleDateString()}
                        {request.approved_at && (
                          <>
                            {" • "}
                            Processed:{" "}
                            {new Date(request.approved_at).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

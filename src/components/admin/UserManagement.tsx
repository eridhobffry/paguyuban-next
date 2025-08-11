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
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/admin";

interface UserManagementProps {
  users: User[];
  onRefresh: () => Promise<void>;
}

export function UserManagement({ users, onRefresh }: UserManagementProps) {
  const [processingEmail, setProcessingEmail] = useState<string | null>(null);

  const handleUserAccess = async (
    email: string,
    action: "revoke" | "restore" | "delete" | "promote" | "demote"
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
        await onRefresh();
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

  const activeUsers = users.filter((user) => user.is_active);
  const inactiveUsers = users.filter((user) => !user.is_active);

  return (
    <Card>
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
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">
                            ACTIVE
                          </Badge>
                          {user.user_type === "admin" && (
                            <Badge className="bg-blue-100 text-blue-800">
                              ADMIN
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {user.user_type !== "admin" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                handleUserAccess(user.email, "promote")
                              }
                              disabled={processingEmail === user.email}
                            >
                              Promote to Admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                handleUserAccess(user.email, "demote")
                              }
                              disabled={processingEmail === user.email}
                            >
                              Demote to Member
                            </Button>
                          )}
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
  );
}

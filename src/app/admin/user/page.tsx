"use client";

import {
  AdminHeader,
  PendingRequests,
  UserManagement,
  ProcessedRequests,
} from "@/components/admin";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminUserPage() {
  const { accessRequests, users, loading, fetchAccessRequests, fetchUsers } =
    useAdminData();

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
        <AdminHeader />
        <div className="space-y-6">
          <PendingRequests
            requests={accessRequests}
            onRefresh={fetchAccessRequests}
            onUserRefresh={fetchUsers}
          />
          <UserManagement users={users} onRefresh={fetchUsers} />
          <ProcessedRequests requests={accessRequests} />
        </div>
      </div>
    </div>
  );
}

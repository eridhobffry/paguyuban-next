import { useState, useEffect } from "react";
import { AccessRequest, User, Document } from "@/types/admin";

export function useAdminData() {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/admin/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  };

  useEffect(() => {
    fetchAccessRequests();
    fetchUsers();
    fetchDocuments();
  }, []);

  return {
    accessRequests,
    users,
    documents,
    loading,
    fetchAccessRequests,
    fetchUsers,
    fetchDocuments,
    setAccessRequests,
    setUsers,
    setDocuments,
  };
}

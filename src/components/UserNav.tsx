"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserNavProps {
  userEmail?: string;
  isAdmin?: boolean;
}

export function UserNav({ userEmail, isAdmin }: UserNavProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {userEmail && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Welcome, {userEmail}
        </span>
      )}
      {isAdmin && (
        <Link href="/admin">
          <Button variant="outline" size="sm">
            Admin Dashboard
          </Button>
        </Link>
      )}
      <Button onClick={handleLogout} variant="outline" size="sm">
        Logout
      </Button>
    </div>
  );
}

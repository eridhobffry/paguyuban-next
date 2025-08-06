"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function AdminHeader() {
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
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage access requests and documents for Paguyuban Messe 2026
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
  );
}

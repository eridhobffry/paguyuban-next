import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserManagement } from "@/components/admin/UserManagement";
import type { User } from "@/types/admin";

describe("UserManagement component", () => {
  it("renders active and disabled users and triggers actions", async () => {
    const onRefresh = vi.fn(async () => {});
    const users: User[] = [
      {
        id: "1",
        email: "member@x.com",
        role: "member",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        email: "disabled@x.com",
        role: "member",
        status: "disabled",
        created_at: new Date().toISOString(),
      },
      {
        id: "3",
        email: "admin@x.com",
        role: "admin",
        status: "active",
        created_at: new Date().toISOString(),
      },
    ];

    // Mock fetch for PATCH calls
    vi.spyOn(global, "fetch").mockResolvedValue({ ok: true } as Response);

    render(<UserManagement users={users} onRefresh={onRefresh} />);

    expect(
      screen.getByText("User Management (3 total users)")
    ).toBeInTheDocument();

    const disableButtons = screen.getAllByText(/Disable/i);
    fireEvent.click(disableButtons[0]);
    expect(fetch).toHaveBeenCalled();
  });
});

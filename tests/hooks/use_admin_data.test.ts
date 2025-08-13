import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAdminData } from "@/hooks/useAdminData";

describe("useAdminData", () => {
  it("fetches users and requests", async () => {
    const usersPayload = {
      users: [
        {
          id: "1",
          email: "a@b.com",
          role: "member",
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ],
    };
    vi.spyOn(global, "fetch").mockImplementation((url: any) => {
      if (String(url).includes("/api/admin/users")) {
        return Promise.resolve({
          ok: true,
          json: async () => usersPayload,
        } as any);
      }
      if (String(url).includes("/api/admin/documents")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ documents: [] }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    const { result } = renderHook(() => useAdminData());

    // Allow effects to run
    await act(async () => {});

    expect(result.current.users.length).toBeGreaterThan(0);
    expect(result.current.accessRequests.length).toBeGreaterThan(0);
  });
});

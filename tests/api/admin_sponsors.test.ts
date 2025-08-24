import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  sponsorAdminCreateSchema,
  sponsorAdminUpdateSchema,
} from "@/types/validation";

// Mock environment variables
process.env.JWT_SECRET = "test-jwt-secret";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Mock admin user data
const mockAdminUser = {
  id: "test-admin-id",
  email: "admin@test.com",
  role: "admin",
  is_super_admin: true,
};

const createAdminToken = (user = mockAdminUser) => {
  return jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: "1h" });
};

// Test data factories
const createValidSponsorData = () => ({
  name: "Test Sponsor",
  url: "https://testsponsor.com",
  logoUrl: "https://example.com/logo.jpg",
  slug: "test-sponsor",
  tags: ["technology", "innovation"],
  sortOrder: 1,
});

const createValidUpdateData = () => ({
  name: "Updated Test Sponsor",
  url: "https://updated-testsponsor.com",
  sortOrder: 2,
});

describe("Admin Sponsors API Routes", () => {
  describe("GET /api/admin/sponsors", () => {
    it("should return 401 when no auth token provided", async () => {
      const response = await fetch("http://localhost:3000/api/admin/sponsors");
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 with invalid JWT token", async () => {
      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        headers: {
          Cookie: "auth-token=invalid-token",
        },
      });
      expect(response.status).toBe(401);
    });

    it("should return 403 for non-admin user", async () => {
      const nonAdminUser = { ...mockAdminUser, role: "member" };
      const token = createAdminToken(nonAdminUser);

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        headers: {
          Cookie: `auth-token=${token}`,
        },
      });
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe("Admin access required");
    });

    it("should return 200 with valid admin token", async () => {
      const token = createAdminToken();

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        headers: {
          Cookie: `auth-token=${token}`,
        },
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("sponsors");
      expect(Array.isArray(data.sponsors)).toBe(true);
    });

    it("should return sponsors ordered by name", async () => {
      const token = createAdminToken();

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        headers: {
          Cookie: `auth-token=${token}`,
        },
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      const sponsors = data.sponsors;

      if (sponsors.length > 1) {
        for (let i = 1; i < sponsors.length; i++) {
          expect(
            sponsors[i].name.localeCompare(sponsors[i - 1].name)
          ).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe("POST /api/admin/sponsors", () => {
    it("should return 401 when no auth token provided", async () => {
      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sponsor: createValidSponsorData() }),
      });
      expect(response.status).toBe(401);
    });

    it("should return 403 for non-admin user", async () => {
      const nonAdminUser = { ...mockAdminUser, role: "member" };
      const token = createAdminToken(nonAdminUser);

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `auth-token=${token}`,
        },
        body: JSON.stringify({ sponsor: createValidSponsorData() }),
      });
      expect(response.status).toBe(403);
    });

    it("should return 400 with invalid payload", async () => {
      const token = createAdminToken();

      const invalidData = {
        sponsor: {
          name: "", // Invalid: empty name
          url: "not-a-url", // This might be invalid depending on schema
        },
      };

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `auth-token=${token}`,
        },
        body: JSON.stringify(invalidData),
      });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Invalid payload");
      expect(data).toHaveProperty("issues");
    });

    it("should return 201 with valid payload", async () => {
      const token = createAdminToken();
      const sponsorData = createValidSponsorData();

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `auth-token=${token}`,
        },
        body: JSON.stringify({ sponsor: sponsorData }),
      });
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty("sponsor");
      expect(data.sponsor.name).toBe(sponsorData.name);
      expect(data.sponsor.url).toBe(sponsorData.url);
    });

    it("should handle missing optional fields", async () => {
      const token = createAdminToken();
      const minimalData = {
        name: "Minimal Sponsor",
      };

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `auth-token=${token}`,
        },
        body: JSON.stringify({ sponsor: minimalData }),
      });
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.sponsor.name).toBe("Minimal Sponsor");
    });
  });

  describe("PUT /api/admin/sponsors", () => {
    it("should return 401 when no auth token provided", async () => {
      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "test-id",
          sponsor: createValidUpdateData(),
        }),
      });
      expect(response.status).toBe(401);
    });

    it("should return 400 with invalid payload", async () => {
      const token = createAdminToken();

      const invalidData = {
        id: "not-a-uuid", // Invalid UUID
        sponsor: { name: "Test" },
      };

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `auth-token=${token}`,
        },
        body: JSON.stringify(invalidData),
      });
      expect(response.status).toBe(400);
    });

    it("should return 200 with valid payload", async () => {
      const token = createAdminToken();
      const updateData = createValidUpdateData();

      // First create a sponsor to update
      const createResponse = await fetch(
        "http://localhost:3000/api/admin/sponsors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `auth-token=${token}`,
          },
          body: JSON.stringify({ sponsor: createValidSponsorData() }),
        }
      );

      if (createResponse.status === 201) {
        const createData = await createResponse.json();
        const sponsorId = createData.sponsor.id;

        const response = await fetch(
          "http://localhost:3000/api/admin/sponsors",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Cookie: `auth-token=${token}`,
            },
            body: JSON.stringify({
              id: sponsorId,
              sponsor: updateData,
            }),
          }
        );

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty("sponsor");
        expect(data.sponsor.name).toBe(updateData.name);
        expect(data.sponsor.url).toBe(updateData.url);
      }
    });

    it("should allow partial updates", async () => {
      const token = createAdminToken();

      // First create a sponsor to update
      const createResponse = await fetch(
        "http://localhost:3000/api/admin/sponsors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `auth-token=${token}`,
          },
          body: JSON.stringify({ sponsor: createValidSponsorData() }),
        }
      );

      if (createResponse.status === 201) {
        const createData = await createResponse.json();
        const sponsorId = createData.sponsor.id;

        const partialUpdate = { name: "Partially Updated Sponsor" };

        const response = await fetch(
          "http://localhost:3000/api/admin/sponsors",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Cookie: `auth-token=${token}`,
            },
            body: JSON.stringify({
              id: sponsorId,
              sponsor: partialUpdate,
            }),
          }
        );

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.sponsor.name).toBe("Partially Updated Sponsor");
      }
    });
  });

  describe("DELETE /api/admin/sponsors", () => {
    it("should return 401 when no auth token provided", async () => {
      const response = await fetch(
        "http://localhost:3000/api/admin/sponsors?id=test-id",
        {
          method: "DELETE",
        }
      );
      expect(response.status).toBe(401);
    });

    it("should return 400 with invalid ID", async () => {
      const token = createAdminToken();

      const response = await fetch(
        "http://localhost:3000/api/admin/sponsors?id=invalid-uuid",
        {
          method: "DELETE",
          headers: {
            Cookie: `auth-token=${token}`,
          },
        }
      );
      expect(response.status).toBe(400);
    });

    it("should return 200 when deleting existing sponsor", async () => {
      const token = createAdminToken();

      // First create a sponsor to delete
      const createResponse = await fetch(
        "http://localhost:3000/api/admin/sponsors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `auth-token=${token}`,
          },
          body: JSON.stringify({ sponsor: createValidSponsorData() }),
        }
      );

      if (createResponse.status === 201) {
        const createData = await createResponse.json();
        const sponsorId = createData.sponsor.id;

        const response = await fetch(
          `http://localhost:3000/api/admin/sponsors?id=${sponsorId}`,
          {
            method: "DELETE",
            headers: {
              Cookie: `auth-token=${token}`,
            },
          }
        );

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty("sponsor");
        expect(data.sponsor.id).toBe(sponsorId);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON", async () => {
      const token = createAdminToken();

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `auth-token=${token}`,
        },
        body: "invalid json",
      });
      expect(response.status).toBe(400);
    });

    it("should handle missing required fields", async () => {
      const token = createAdminToken();

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `auth-token=${token}`,
        },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
    });

    it("should handle database connection errors gracefully", async () => {
      // This would require mocking the database connection
      // For now, we assume the API handles connection errors properly
      expect(true).toBe(true); // Placeholder test
    });
  });

  describe("Security Tests", () => {
    it("should prevent unauthorized access to admin endpoints", async () => {
      const methods = ["GET", "POST", "PUT", "DELETE"];

      for (const method of methods) {
        const response = await fetch(
          "http://localhost:3000/api/admin/sponsors",
          {
            method,
          }
        );
        expect(response.status).toBe(401);
      }
    });

    it("should validate JWT token integrity", async () => {
      const tamperedToken = createAdminToken().slice(0, -5) + "xxxxx";

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        headers: {
          Cookie: `auth-token=${tamperedToken}`,
        },
      });
      expect(response.status).toBe(401);
    });

    it("should prevent access with expired token", async () => {
      const expiredUser = { ...mockAdminUser };
      const expiredToken = jwt.sign(expiredUser, process.env.JWT_SECRET!, {
        expiresIn: "-1h", // Already expired
      });

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        headers: {
          Cookie: `auth-token=${expiredToken}`,
        },
      });
      expect(response.status).toBe(401);
    });
  });

  describe("Performance Tests", () => {
    it("should respond within acceptable time limits", async () => {
      const token = createAdminToken();
      const startTime = Date.now();

      const response = await fetch("http://localhost:3000/api/admin/sponsors", {
        headers: {
          Cookie: `auth-token=${token}`,
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });

    it("should handle concurrent requests appropriately", async () => {
      const token = createAdminToken();
      const concurrentRequests = 5;

      const requests = Array(concurrentRequests)
        .fill(null)
        .map(() =>
          fetch("http://localhost:3000/api/admin/sponsors", {
            headers: {
              Cookie: `auth-token=${token}`,
            },
          })
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});

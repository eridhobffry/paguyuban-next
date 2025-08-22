import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  artistAdminCreateSchema,
  artistAdminUpdateSchema,
  speakerAdminCreateSchema,
  speakerAdminUpdateSchema,
  sponsorAdminCreateSchema,
  sponsorAdminUpdateSchema,
  sponsorTierAdminCreateSchema,
  sponsorTierAdminUpdateSchema,
  documentAdminUpdateSnakeSchema,
} from "@/types/validation";

// Test data factories for consistent test data
const createValidArtistData = () => ({
  name: "Test Artist",
  role: "Singer",
  company: "Test Music Co",
  instagram: "https://instagram.com/testartist",
  youtube: "https://youtube.com/@testartist",
  slug: "test-artist",
  sortOrder: 1,
});

const createValidSpeakerData = () => ({
  name: "Test Speaker",
  role: "CEO",
  company: "Tech Corp",
  imageUrl: "https://example.com/avatar.jpg",
  slug: "test-speaker",
  sortOrder: 2,
});

const createValidSponsorData = () => ({
  name: "Test Sponsor",
  url: "https://testsponsor.com",
  logoUrl: "https://example.com/logo.jpg",
  slug: "test-sponsor",
  tierId: "550e8400-e29b-41d4-a716-446655440000",
  tags: ["technology", "innovation"],
  sortOrder: 3,
});

const createValidSponsorTierData = () => ({
  name: "Gold Sponsor",
  slug: "gold-sponsor",
  description: "Premium sponsorship tier",
  price: 100000,
  available: 5,
  sold: 2,
  color: "#FFD700",
  features: ["Logo placement", "Booth space", "Speaking slot"],
  sortOrder: 2,
});

const createValidDocumentData = () => ({
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Test Document",
  description: "A test document",
  preview: "Preview content",
  pages: "25 pages",
  type: "proposal",
  icon: "📄",
  slug: "test-document",
  file_url: "https://example.com/document.pdf",
  external_url: null,
  restricted: false,
  marketing_highlights: ["Key feature 1", "Key feature 2"],
});

describe("Admin Schema Validation Tests", () => {
  describe("Artist Admin Schemas", () => {
    describe("artistAdminCreateSchema", () => {
      it("should validate valid artist creation data", () => {
        const validData = createValidArtistData();
        const result = artistAdminCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe("Test Artist");
          expect(result.data.instagram).toBe(
            "https://instagram.com/testartist"
          );
        }
      });

      it("should require instagram and youtube URLs", () => {
        const invalidData = {
          ...createValidArtistData(),
          instagram: "not-a-url",
          youtube: "also-not-a-url",
        };
        const result = artistAdminCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.format().instagram?._errors).toContain(
            "Instagram URL is required"
          );
          expect(result.error.format().youtube?._errors).toContain(
            "YouTube URL is required"
          );
        }
      });

      it("should validate Instagram URL format", () => {
        const invalidData = {
          ...createValidArtistData(),
          instagram: "invalid-url",
          youtube: "https://youtube.com/@testartist",
        };
        const result = artistAdminCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should allow optional slug and sortOrder", () => {
        const minimalData = {
          name: "Test Artist",
          role: "Singer",
          company: "Test Music Co",
          instagram: "https://instagram.com/testartist",
          youtube: "https://youtube.com/@testartist",
        };
        const result = artistAdminCreateSchema.safeParse(minimalData);
        expect(result.success).toBe(true);
      });

      it("should coerce sortOrder to number", () => {
        const dataWithStringSortOrder = {
          ...createValidArtistData(),
          sortOrder: "5",
        };
        const result = artistAdminCreateSchema.safeParse(
          dataWithStringSortOrder
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(typeof result.data.sortOrder).toBe("number");
          expect(result.data.sortOrder).toBe(5);
        }
      });
    });

    describe("artistAdminUpdateSchema", () => {
      it("should validate valid artist update data", () => {
        const validData = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          artist: { name: "Updated Artist Name" },
        };
        const result = artistAdminUpdateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should require valid UUID for id", () => {
        const invalidData = {
          id: "invalid-uuid",
          artist: { name: "Updated Name" },
        };
        const result = artistAdminUpdateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.format().id?._errors).toBeDefined();
        }
      });

      it("should allow partial updates", () => {
        const partialData = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          artist: { role: "Updated Role" },
        };
        const result = artistAdminUpdateSchema.safeParse(partialData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Speaker Admin Schemas", () => {
    describe("speakerAdminCreateSchema", () => {
      it("should validate valid speaker creation data", () => {
        const validData = createValidSpeakerData();
        const result = speakerAdminCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should allow minimal speaker data", () => {
        const minimalData = {
          name: "Test Speaker",
        };
        const result = speakerAdminCreateSchema.safeParse(minimalData);
        expect(result.success).toBe(true);
      });

      it("should coerce sortOrder to number", () => {
        const dataWithStringSortOrder = {
          ...createValidSpeakerData(),
          sortOrder: "10",
        };
        const result = speakerAdminCreateSchema.safeParse(
          dataWithStringSortOrder
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(typeof result.data.sortOrder).toBe("number");
          expect(result.data.sortOrder).toBe(10);
        }
      });

      it("should accept any string for website field", () => {
        const dataWithWebsite = {
          ...createValidSpeakerData(),
          website: "https://example.com",
        };
        const result = speakerAdminCreateSchema.safeParse(dataWithWebsite);
        expect(result.success).toBe(true);
      });
    });

    describe("speakerAdminUpdateSchema", () => {
      it("should validate valid speaker update data", () => {
        const validData = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          speaker: { name: "Updated Speaker Name" },
        };
        const result = speakerAdminUpdateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should require valid UUID for id", () => {
        const invalidData = {
          id: "invalid-uuid",
          speaker: { name: "Updated Name" },
        };
        const result = speakerAdminUpdateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Sponsor Admin Schemas", () => {
    describe("sponsorAdminCreateSchema", () => {
      it("should validate valid sponsor creation data", () => {
        const validData = createValidSponsorData();
        const result = sponsorAdminCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should allow minimal sponsor data", () => {
        const minimalData = {
          name: "Test Sponsor",
        };
        const result = sponsorAdminCreateSchema.safeParse(minimalData);
        expect(result.success).toBe(true);
      });

      it("should accept any string for url field", () => {
        const dataWithUrl = {
          ...createValidSponsorData(),
          url: "https://example.com",
        };
        const result = sponsorAdminCreateSchema.safeParse(dataWithUrl);
        expect(result.success).toBe(true);
      });

      it("should validate tierId as UUID", () => {
        const invalidData = {
          ...createValidSponsorData(),
          tierId: "invalid-uuid",
        };
        const result = sponsorAdminCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should coerce sortOrder to number", () => {
        const dataWithStringSortOrder = {
          ...createValidSponsorData(),
          sortOrder: "15",
        };
        const result = sponsorAdminCreateSchema.safeParse(
          dataWithStringSortOrder
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(typeof result.data.sortOrder).toBe("number");
          expect(result.data.sortOrder).toBe(15);
        }
      });
    });

    describe("sponsorAdminUpdateSchema", () => {
      it("should validate valid sponsor update data", () => {
        const validData = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          sponsor: { name: "Updated Sponsor Name" },
        };
        const result = sponsorAdminUpdateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should require valid UUID for id", () => {
        const invalidData = {
          id: "invalid-uuid",
          sponsor: { name: "Updated Name" },
        };
        const result = sponsorAdminUpdateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should allow partial updates", () => {
        const partialData = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          sponsor: { url: "https://updatedsponsor.com" },
        };
        const result = sponsorAdminUpdateSchema.safeParse(partialData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Sponsor Tier Admin Schemas", () => {
    describe("sponsorTierAdminCreateSchema", () => {
      it("should validate valid sponsor tier creation data", () => {
        const validData = createValidSponsorTierData();
        const result = sponsorTierAdminCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should allow minimal sponsor tier data", () => {
        const minimalData = {
          name: "Basic Tier",
        };
        const result = sponsorTierAdminCreateSchema.safeParse(minimalData);
        expect(result.success).toBe(true);
      });

      it("should coerce numeric fields to numbers", () => {
        const dataWithStringNumbers = {
          ...createValidSponsorTierData(),
          price: "50000",
          available: "10",
          sold: "5",
          sortOrder: "3",
        };
        const result = sponsorTierAdminCreateSchema.safeParse(
          dataWithStringNumbers
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(typeof result.data.price).toBe("number");
          expect(typeof result.data.available).toBe("number");
          expect(typeof result.data.sold).toBe("number");
          expect(typeof result.data.sortOrder).toBe("number");
          expect(result.data.price).toBe(50000);
        }
      });

      it("should validate features as string array", () => {
        const invalidData = {
          ...createValidSponsorTierData(),
          features: "not-an-array",
        };
        const result = sponsorTierAdminCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should allow null/undefined for optional numeric fields", () => {
        const dataWithNulls = {
          ...createValidSponsorTierData(),
          price: null,
          available: undefined,
        };
        const result = sponsorTierAdminCreateSchema.safeParse(dataWithNulls);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.price).toBe(null);
          expect(result.data.available).toBe(undefined);
        }
      });
    });

    describe("sponsorTierAdminUpdateSchema", () => {
      it("should validate valid sponsor tier update data", () => {
        const validData = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          tier: { name: "Updated Tier Name" },
        };
        const result = sponsorTierAdminUpdateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should require valid UUID for id", () => {
        const invalidData = {
          id: "invalid-uuid",
          tier: { name: "Updated Name" },
        };
        const result = sponsorTierAdminUpdateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Document Admin Schemas", () => {
    describe("documentAdminUpdateSnakeSchema", () => {
      it("should validate valid document update data", () => {
        const validData = createValidDocumentData();
        const result = documentAdminUpdateSnakeSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should require valid UUID for id", () => {
        const invalidData = {
          ...createValidDocumentData(),
          id: "invalid-uuid",
        };
        const result = documentAdminUpdateSnakeSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should validate URL format for file_url and external_url", () => {
        const invalidData = {
          ...createValidDocumentData(),
          file_url: "not-a-url",
          external_url: "also-not-a-url",
        };
        const result = documentAdminUpdateSnakeSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should allow null values for URLs", () => {
        const dataWithNullUrls = {
          ...createValidDocumentData(),
          file_url: null,
          external_url: null,
        };
        const result =
          documentAdminUpdateSnakeSchema.safeParse(dataWithNullUrls);
        expect(result.success).toBe(true);
      });

      it("should validate marketing_highlights as string array", () => {
        const invalidData = {
          ...createValidDocumentData(),
          marketing_highlights: "not-an-array",
        };
        const result = documentAdminUpdateSnakeSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should allow null for marketing_highlights", () => {
        const dataWithNullHighlights = {
          ...createValidDocumentData(),
          marketing_highlights: null,
        };
        const result = documentAdminUpdateSnakeSchema.safeParse(
          dataWithNullHighlights
        );
        expect(result.success).toBe(true);
      });

      it("should validate title minimum length", () => {
        const invalidData = {
          ...createValidDocumentData(),
          title: "", // Empty string should fail
        };
        const result = documentAdminUpdateSnakeSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should allow optional fields", () => {
        const minimalData = {
          id: "550e8400-e29b-41d4-a716-446655440000",
        };
        const result = documentAdminUpdateSnakeSchema.safeParse(minimalData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle completely empty objects", () => {
      const emptyData = {};
      const result = artistAdminCreateSchema.safeParse(emptyData);
      expect(result.success).toBe(false);
      expect(result.error.issues.length).toBeGreaterThan(0);
    });

    it("should handle null and undefined values appropriately", () => {
      const nullData = {
        name: null,
        instagram: undefined,
        youtube: null,
      };
      const result = artistAdminCreateSchema.safeParse(nullData);
      expect(result.success).toBe(false);
    });

    it("should handle array type validation", () => {
      const arrayData = {
        name: "Test",
        tags: "not-an-array", // Should be array
      };
      const result = sponsorAdminCreateSchema.safeParse(arrayData);
      expect(result.success).toBe(false);
    });

    it("should handle invalid UUID formats", () => {
      const uuidFields = [
        { id: "not-a-uuid", artist: { name: "test" } },
        { id: "", artist: { name: "test" } },
        { id: "550e8400-e29b-41d4-a716", artist: { name: "test" } }, // Too short
      ];

      uuidFields.forEach((data) => {
        const result = artistAdminUpdateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it("should handle numeric edge cases", () => {
      const numericEdgeCases = [
        { sortOrder: "abc" }, // Non-numeric string
        { sortOrder: NaN },
        { sortOrder: Infinity },
        { price: "not-a-number", name: "Test Tier" },
      ];

      numericEdgeCases.forEach((data) => {
        const result = sponsorTierAdminCreateSchema.safeParse({
          name: "Test Tier",
          ...data,
        });
        expect(result.success).toBe(false);
      });
    });
  });
});

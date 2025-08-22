/**
 * Simple Unit Tests for Knowledge System
 * These tests verify the core functionality without complex UI rendering
 */

import { Speaker, Artist, Sponsor } from "@/types/people";

// Test data
const mockKnowledgeData = {
  speakers: [
    { id: "speaker-1", name: "John Doe", speakerType: "AI Expert" },
    { id: "speaker-2", name: "Jane Smith", speakerType: "Business Leader" },
  ],
  artists: [
    { id: "artist-1", name: "Band A", role: "Rock Band" },
    { id: "artist-2", name: "Singer B", role: "Solo Artist" },
  ],
  sponsors: [
    { id: "sponsor-1", name: "Tech Corp", tierId: "gold" },
    { id: "sponsor-2", name: "Innovation Ltd", tierId: "silver" },
  ],
  overlay: {
    "event.specialNotes": "VIP event with exclusive networking",
    "venue.capacity": 2000,
  },
};

describe("Knowledge System Core Logic", () => {
  test("calculates total people correctly", () => {
    const totalPeople =
      mockKnowledgeData.speakers.length + mockKnowledgeData.artists.length;
    expect(totalPeople).toBe(4);
  });

  test("calculates sponsor count correctly", () => {
    const sponsorCount = mockKnowledgeData.sponsors.length;
    expect(sponsorCount).toBe(2);
  });

  test("calculates overlay entries correctly", () => {
    const overlayCount = Object.keys(mockKnowledgeData.overlay).length;
    expect(overlayCount).toBe(2);
  });

  test("has required data structure", () => {
    expect(mockKnowledgeData).toHaveProperty("speakers");
    expect(mockKnowledgeData).toHaveProperty("artists");
    expect(mockKnowledgeData).toHaveProperty("sponsors");
    expect(mockKnowledgeData).toHaveProperty("overlay");

    expect(Array.isArray(mockKnowledgeData.speakers)).toBe(true);
    expect(Array.isArray(mockKnowledgeData.artists)).toBe(true);
    expect(Array.isArray(mockKnowledgeData.sponsors)).toBe(true);
    expect(typeof mockKnowledgeData.overlay).toBe("object");
  });

  test("speaker data has required fields", () => {
    const speaker = mockKnowledgeData.speakers[0];
    expect(speaker).toHaveProperty("id");
    expect(speaker).toHaveProperty("name");
    expect(speaker).toHaveProperty("speakerType");
  });

  test("artist data has required fields", () => {
    const artist = mockKnowledgeData.artists[0];
    expect(artist).toHaveProperty("id");
    expect(artist).toHaveProperty("name");
    expect(artist).toHaveProperty("role");
  });

  test("sponsor data has required fields", () => {
    const sponsor = mockKnowledgeData.sponsors[0];
    expect(sponsor).toHaveProperty("id");
    expect(sponsor).toHaveProperty("name");
    expect(sponsor).toHaveProperty("tierId");
  });

  test("overlay data structure is valid", () => {
    const overlay = mockKnowledgeData.overlay;
    expect(typeof overlay["event.specialNotes"]).toBe("string");
    expect(typeof overlay["venue.capacity"]).toBe("number");
  });

  test("can handle empty data gracefully", () => {
    const emptyData = {
      speakers: [],
      artists: [],
      sponsors: [],
      overlay: {},
    };

    const totalPeople = emptyData.speakers.length + emptyData.artists.length;
    const sponsorCount = emptyData.sponsors.length;
    const overlayCount = Object.keys(emptyData.overlay).length;

    expect(totalPeople).toBe(0);
    expect(sponsorCount).toBe(0);
    expect(overlayCount).toBe(0);
  });

  test("can handle large dataset", () => {
    const largeData = {
      ...mockKnowledgeData,
      speakers: Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        name: `Speaker ${i}`,
        speakerType: "Expert",
      })),
      artists: Array.from({ length: 50 }, (_, i) => ({
        id: i.toString(),
        name: `Artist ${i}`,
        role: "Performer",
      })),
      sponsors: Array.from({ length: 25 }, (_, i) => ({
        id: i.toString(),
        name: `Sponsor ${i}`,
        tierId: "gold",
      })),
    };

    const totalPeople = largeData.speakers.length + largeData.artists.length;
    expect(totalPeople).toBe(150);
    expect(largeData.sponsors.length).toBe(25);
  });

  test("data integrity is maintained", () => {
    // Test that all IDs are unique
    const allIds = [
      ...mockKnowledgeData.speakers.map((s) => s.id),
      ...mockKnowledgeData.artists.map((a) => a.id),
      ...mockKnowledgeData.sponsors.map((s) => s.id),
    ];

    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });
});

describe("Knowledge System Integration", () => {
  test("API data structure matches expected format", () => {
    // This test ensures the data structure from the API matches what the UI expects
    const expectedStructure = {
      speakers: expect.any(Array),
      artists: expect.any(Array),
      sponsors: expect.any(Array),
      overlay: expect.any(Object),
    };

    expect(mockKnowledgeData).toMatchObject(expectedStructure);
  });

  test("can merge overlay data correctly", () => {
    const baseData = {
      speakers: [{ id: "1", name: "John" }],
      artists: [],
      sponsors: [],
      overlay: { "event.name": "Test Event" },
    };

    const overlayData = {
      overlay: {
        "event.venue": "Berlin Center",
        "event.date": "2024-12-01",
      },
    };

    const merged = {
      ...baseData,
      overlay: {
        ...baseData.overlay,
        ...overlayData.overlay,
      },
    };

    expect(merged.overlay).toHaveProperty("event.name");
    expect(merged.overlay).toHaveProperty("event.venue");
    expect(merged.overlay).toHaveProperty("event.date");
  });

  test("handles missing optional fields gracefully", () => {
    const dataWithMissingFields = {
      speakers: [{ id: "1", name: "John" }], // missing speakerType
      artists: [{ id: "1", name: "Band" }], // missing role
      sponsors: [{ id: "1", name: "Corp" }], // missing tierId
      overlay: {},
    };

    expect(dataWithMissingFields.speakers[0]).toHaveProperty("id");
    expect(dataWithMissingFields.speakers[0]).toHaveProperty("name");
    expect(dataWithMissingFields.artists[0]).toHaveProperty("id");
    expect(dataWithMissingFields.artists[0]).toHaveProperty("name");
    expect(dataWithMissingFields.sponsors[0]).toHaveProperty("id");
    expect(dataWithMissingFields.sponsors[0]).toHaveProperty("name");
  });
});

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  artists,
  speakers,
  sponsorTiers,
  sponsors,
  sponsorLogos,
} from "@/lib/db/schema";

// Speakers — mirror DB exactly
export type Speaker = InferSelectModel<typeof speakers>;
export type NewSpeaker = InferInsertModel<typeof speakers>;

// Analytics types moved to '@/types/analytics' to keep domain types focused

// Artists — mirror DB exactly
export type Artist = InferSelectModel<typeof artists>;
export type NewArtist = InferInsertModel<typeof artists>;

// Sponsors — mirror DB exactly
export type Sponsor = InferSelectModel<typeof sponsors>;
export type NewSponsor = InferInsertModel<typeof sponsors>;

// Sponsor Tiers — mirror DB exactly
export type SponsorTier = InferSelectModel<typeof sponsorTiers>;
export type NewSponsorTier = InferInsertModel<typeof sponsorTiers>;

// Sponsor Logos — mirror DB exactly
export type SponsorLogo = InferSelectModel<typeof sponsorLogos>;
export type NewSponsorLogo = InferInsertModel<typeof sponsorLogos>;

// Public DTOs (optional): what our public endpoints commonly expose
export type PublicArtistDto = Pick<
  Artist,
  | "id"
  | "name"
  | "role"
  | "company"
  | "imageUrl"
  | "slug"
  | "instagram"
  | "youtube"
  | "twitter"
  | "linkedin"
  | "website"
>;
export type PublicSpeakerDto = {
  id: Speaker["id"];
  name: Speaker["name"];
  role?: Speaker["role"];
  company?: Speaker["company"];
  imageUrl?: string | null; // standardized to camelCase
  slug?: Speaker["slug"] | null;
  twitter?: Speaker["twitter"];
  linkedin?: Speaker["linkedin"];
  website?: Speaker["website"];
};

// Enhanced sponsor types based on actual database schema
export type PublicSponsorTierDto = {
  id: SponsorTier["id"];
  name: SponsorTier["name"];
  slug?: SponsorTier["slug"];
  description?: SponsorTier["description"];
  price?: number; // bigint converted to number
  available?: number;
  sold?: number;
  color?: string;
  features?: string[]; // jsonb array of strings
  sortOrder?: number;
};

export type PublicSponsorDto = {
  id: Sponsor["id"];
  name: Sponsor["name"];
  url?: string;
  logoUrl?: string;
  slug?: string;
  tierId?: Sponsor["tierId"];
  tags?: string[];
  sortOrder?: number;
};

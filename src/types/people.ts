import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { artists, speakers } from "@/lib/db/schema";

// Speakers — mirror DB exactly
export type Speaker = InferSelectModel<typeof speakers>;
export type NewSpeaker = InferInsertModel<typeof speakers>;

// Artists — mirror DB exactly
export type Artist = InferSelectModel<typeof artists>;
export type NewArtist = InferInsertModel<typeof artists>;

// Public DTOs (optional): what our public endpoints commonly expose
export type PublicArtistDto = Pick<
  Artist,
  | "id"
  | "name"
  | "role"
  | "company"
  | "imageUrl"
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
  image_url?: string | null; // kept to match current public API field
  twitter?: Speaker["twitter"];
  linkedin?: Speaker["linkedin"];
  website?: Speaker["website"];
};

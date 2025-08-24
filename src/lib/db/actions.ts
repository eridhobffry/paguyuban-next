import { db } from "@/lib/db";
import { speakers, artists, sponsors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NewSpeaker, NewArtist, NewSponsor } from "@/types/people";

// Speaker Actions
export async function createSpeaker(data: NewSpeaker) {
  return db.insert(speakers).values(data).returning();
}

export async function updateSpeaker(id: string, data: Partial<NewSpeaker>) {
  return db.update(speakers).set(data).where(eq(speakers.id, id)).returning();
}

export async function deleteSpeaker(id: string) {
  return db.delete(speakers).where(eq(speakers.id, id)).returning();
}

// Artist Actions
export async function createArtist(data: NewArtist) {
  return db.insert(artists).values(data).returning();
}

export async function updateArtist(id: string, data: Partial<NewArtist>) {
  return db.update(artists).set(data).where(eq(artists.id, id)).returning();
}

export async function deleteArtist(id: string) {
  return db.delete(artists).where(eq(artists.id, id)).returning();
}

// Sponsor Actions
export async function createSponsor(data: NewSponsor) {
  return db.insert(sponsors).values(data).returning();
}

export async function updateSponsor(id: string, data: Partial<NewSponsor>) {
  return db.update(sponsors).set(data).where(eq(sponsors.id, id)).returning();
}

export async function deleteSponsor(id: string) {
  return db.delete(sponsors).where(eq(sponsors.id, id)).returning();
}

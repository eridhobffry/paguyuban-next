import { documents } from "@/lib/db/schema";

export type DocumentRow = typeof documents.$inferSelect;
export type NewDocumentRow = typeof documents.$inferInsert;

// Public API shape derived from Drizzle DocumentRow to stay in sync with DB
export type PublicDocument = {
  id: DocumentRow["id"];
  title: DocumentRow["title"];
  description: DocumentRow["description"];
  preview: DocumentRow["preview"];
  pages: DocumentRow["pages"];
  type: DocumentRow["type"];
  icon: DocumentRow["icon"];
  slug?: DocumentRow["slug"];
  restricted: DocumentRow["restricted"];
  // snake_case fields exposed by public API, typed from DB columns
  file_url?: DocumentRow["fileUrl"];
  external_url?: DocumentRow["externalUrl"];
  ai_generated: DocumentRow["aiGenerated"];
  marketing_highlights?: DocumentRow["marketingHighlights"];
};

// Admin API input shape (snake_case), aligned to SQL columns
export interface DocumentInput {
  title: string;
  description: string;
  preview: string;
  pages: string;
  type: string;
  icon: string;
  slug?: string;
  file_url?: string;
  external_url?: string;
  restricted: boolean;
  file_size?: number;
  mime_type?: string;
  ai_generated?: boolean;
  created_by: string;
}

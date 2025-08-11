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
  restricted: DocumentRow["restricted"];
  // snake_case fields exposed by public API, typed from DB columns
  file_url?: DocumentRow["fileUrl"];
  external_url?: DocumentRow["externalUrl"];
  ai_generated: DocumentRow["aiGenerated"];
  marketing_highlights?: DocumentRow["marketingHighlights"];
};

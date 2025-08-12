export const PUBLIC_DOWNLOAD_KEY = {
  BROCHURE: "brochure",
  PROPOSAL: "proposal",
  SPONSORSHIP_KIT: "sponsorship-kit",
  FINANCIAL_REPORT: "financial-report",
  SPONSOR_DECK: "sponsor-deck",
  WORKSHOP_GUIDE: "workshop-guide",
  SCHEDULE: "schedule",
  TECHNICAL_SPECS: "technical-specs",
} as const;

export type DownloadKey =
  (typeof PUBLIC_DOWNLOAD_KEY)[keyof typeof PUBLIC_DOWNLOAD_KEY];

// Legacy fallback: key -> preferred type label
export const KEY_TO_TYPE: Record<DownloadKey, string> = {
  brochure: "Brochure",
  proposal: "Proposal",
  "sponsorship-kit": "Sponsorship Kit",
  "financial-report": "Financial Report",
  "sponsor-deck": "Sponsor Deck",
  "workshop-guide": "Workshop Guide",
  schedule: "Schedule",
  "technical-specs": "Technical Specs",
};

// Inverse mapping for convenience in admin utilities (type -> key)
export const TYPE_TO_KEY: Record<string, DownloadKey> = Object.fromEntries(
  Object.entries(KEY_TO_TYPE).map(([k, v]) => [v, k as DownloadKey])
) as Record<string, DownloadKey>;

// Fallback static files served via /public
export const KEY_TO_FALLBACK_FILE: Record<DownloadKey, string> = {
  brochure: "/docs/brochure.pdf",
  proposal: "/docs/proposal.pdf",
  "sponsorship-kit": "/docs/sponsorship-kit.pdf",
  "financial-report": "/docs/financial-report.pdf",
  "sponsor-deck": "/docs/sponsor-deck.pdf",
  "workshop-guide": "/docs/workshop-guide.pdf",
  schedule: "/docs/schedule.pdf",
  "technical-specs": "/docs/technical-specs.pdf",
};

export function getPublicDownloadUrl(key: DownloadKey): string {
  return `/api/documents/public/download/${key}`;
}

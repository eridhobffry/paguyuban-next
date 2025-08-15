export type Prospect = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  interest?: string | null;
  budget?: string | null;
};

// Extracts prospect details from a chat summary string.
// Example summary format:
// "Alex Positive from Sunrise Corp submitted a partnership inquiry via the website. They are interested in: Gold sponsorship. Budget indicated: $25k. Contact: alex.pos@example.com · +1-111-111-1111. Source: website. Message: We are excited about partnering and ready to move fast."
export function extractProspectFromSummary(summary: string): Prospect {
  const nameMatch = summary.match(/^(.+?)\s+from\s+/);
  const companyMatch = summary.match(/from\s+(.+?)\s+submitted/);
  const interestMatch = summary.match(/interested in:\s*([^.]+)\./);
  const budgetMatch = summary.match(/Budget indicated:\s*([^.]+)\./);
  // Capture the rest of the line after "Contact:" (emails/phones may be separated by dot, bullet, etc.)
  const contactSection = summary.match(/Contact:\s*([^\n]+)/i);

  const name = nameMatch?.[1]?.trim() || null;
  const company = companyMatch?.[1]?.trim() || null;
  const interest = interestMatch?.[1]?.trim() || null;
  const budget = budgetMatch?.[1]?.trim() || null;

  let email: string | null = null;
  let phone: string | null = null;
  if (contactSection) {
    const contactText = contactSection[1]?.trim() || "";
    // Extract email anywhere in the contact text
    const emailMatch = contactText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
    if (emailMatch) email = emailMatch[0];
    // Extract a phone-like sequence (supports +, spaces, dashes, parentheses)
    const phoneMatch = contactText.match(/\+?\d[\d\s\-().]{6,}\d/);
    if (phoneMatch) phone = phoneMatch[0].trim();
  }

  return { name, email, phone, company, interest, budget };
}

// Simple heuristic language detection tuned for ID/MS/EN/DE

export type Lang = "id" | "ms" | "en" | "de";

const ID_WORDS = [
  "kapan",
  "dimana",
  "di mana",
  "berapa",
  "harga",
  "acara",
  "bisnis",
  "saya",
  "tertarik",
  "penyelanggara",
  "manfaat",
  "jadwal",
];

const MS_WORDS = [
  "bila",
  "di mana",
  "berapa",
  "harga",
  "acara",
  "perniagaan",
  "syarikat",
  "saya",
  "nak",
  "penaja",
  "manfaat",
  "jadual",
  "hubungi",
];

const DE_WORDS = ["wann", "wo", "wie", "veranstaltung", "preis", "geschäft"];

export function detectLanguage(text: string): Lang {
  const t = (text || "").toLowerCase();
  const tokens = new Set((t.match(/[a-z]+/g) || []).filter(Boolean));
  const score = (words: string[]) =>
    words.reduce((s, w) => {
      if (w.includes(" ")) return s + (t.includes(w) ? 2 : 0); // phrase match gets higher weight
      return s + (tokens.has(w) ? 1 : 0);
    }, 0);

  const idScore = score(ID_WORDS);
  const msScore = score(MS_WORDS);
  const deScore = score(DE_WORDS);

  if (idScore === 0 && msScore === 0 && deScore === 0) return "en";
  if (idScore >= msScore && idScore >= deScore) return "id";
  if (msScore >= idScore && msScore >= deScore) return "ms";
  return "de";
}

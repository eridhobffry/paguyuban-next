"""
Language detection utilities shared across AI service and HF Space.
Supports: Indonesian (id), Malay (ms), German (de), English (en default).
"""

from typing import Literal

Lang = Literal["id", "ms", "de", "en"]

ID_WORDS = [
    "kapan",
    "dimana",
    "di mana",
    "berapa",
    "harga",
    "acara",
    "bisnis",
    "saya",
    "tertarik",
    "sponsor",
    "manfaat",
    "jadwal",
]

MS_WORDS = [
    "bila",
    "di mana",
    "dimana",
    "berapa",
    "harga",
    "acara",
    "perniagaan",
    "syarikat",
    "nak",
    "penaja",
    "manfaat",
    "jadual",
    "hubungi",
]

DE_WORDS = ["wann", "wo", "wie", "veranstaltung", "preis", "geschäft", "hilfe"]


def detect_language(text: str) -> Lang:
    t = (text or "").lower()

    def score(words):
        return sum(1 for w in words if w in t)

    id_s = score(ID_WORDS)
    ms_s = score(MS_WORDS)
    de_s = score(DE_WORDS)
    if id_s == 0 and ms_s == 0 and de_s == 0:
        return "en"
    # prefer the higher score; tie-breaking prefers id over ms over de
    if id_s >= ms_s and id_s >= de_s:
        return "id"
    if ms_s >= id_s and ms_s >= de_s:
        return "ms"
    return "de"


def get_language_prompt(language: Lang) -> str:
    if language == "id":
        return "Harap balas dalam Bahasa Indonesia (Bahasa Indonesia)."
    if language == "ms":
        return "Sila balas dalam Bahasa Melayu."
    if language == "de":
        return "Bitte auf Deutsch antworten."
    return "Please respond in English."


"""
Heuristic memory signals for preferences and interactions.
These are returned as memory_diff for the Next BFF to persist.
"""
from typing import Dict, Any, List


SPONSOR_WORDS = [
    "sponsor", "sponsorship", "penaja", "sponsorship", "kemitraan", "partnership",
]
BUDGET_WORDS = ["budget", "anggaran", "belanja", "€", "eur", "euro", "harga"]


def detect_memory_diff(query: str, language: str) -> Dict[str, Any]:
    q = (query or "").lower()
    prefs: Dict[str, Any] = {}
    interactions: List[Dict[str, Any]] = []

    # Language preference
    if language in ("id", "ms", "de", "en"):
        prefs["preferred_language"] = language

    # Sponsor interest
    sponsor_interest = any(w in q for w in SPONSOR_WORDS)
    budget_mentioned = any(w in q for w in BUDGET_WORDS)
    if sponsor_interest:
        interactions.append({
            "type": "sponsor_interest",
            "action": "asked",
            "sentiment": "neutral",
            "budget_mentioned": budget_mentioned,
        })

    if not prefs and not interactions:
        return {}

    return {
        "preferences": prefs,
        "sponsor_interactions": interactions,
    }


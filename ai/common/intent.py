"""
Shared intent analyzer with multilingual keyword support.
"""
from typing import Dict, List


class IntentAnalyzer:
    def __init__(self) -> None:
        self.intent_patterns: Dict[str, List[str]] = {
            # Event-related intents
            "event_timing": [
                "when", "date", "time", "schedule",
                "kapan", "waktu", "jadwal", "jadual",
                "wann", "zeit",
            ],
            "event_location": [
                "where", "location", "venue", "place",
                "dimana", "di mana", "lokasi",
                "wo", "ort",
            ],
            "event_pricing": [
                "price", "cost", "fee", "tier", "sponsor",
                "harga", "biaya", "penaja", "preis",
            ],
            "event_artists": [
                "artist", "performer", "music", "band", "singer",
                "artis", "penyanyi", "sänger",
            ],
            "event_speakers": [
                "speaker", "talk", "presentation", "pembicara", "sprecher",
            ],

            # Business-related intents
            "business_partnership": ["partnership", "sponsor", "collaborate", "kerjasama", "partnerschaft"],
            "business_budget": ["budget", "investment", "roi", "return", "anggaran", "investition"],
            "business_analysis": ["analysis", "data", "report", "metrics", "analisis", "analyse"],

            # User interaction intents
            "prospect_analysis": ["interested", "contact", "lead", "conversion", "tertarik"],
            "personalized_response": ["help", "assist", "support", "question", "bantuan", "hilfe"],
        }

    def analyze_intent(self, query: str, language: str = "en") -> str:
        q = (query or "").lower()
        best_intent = "general_inquiry"
        best_score = 0.0
        for intent, keywords in self.intent_patterns.items():
            score = 0.0
            for kw in keywords:
                if kw in q:
                    score += len(kw)
                    # modest boost for language-aligned hits
                    if language == "id" and kw in ["kapan", "dimana", "jadwal", "harga", "bantuan"]:
                        score *= 1.2
                    elif language == "ms" and kw in ["bila", "di mana", "jadual", "harga"]:
                        score *= 1.2
                    elif language == "de" and kw in ["wann", "wo", "preis", "hilfe"]:
                        score *= 1.2
            if score > best_score:
                best_score = score
                best_intent = intent
        return best_intent


def analyze_intent(query: str, language: str = "en") -> str:
    return IntentAnalyzer().analyze_intent(query, language)


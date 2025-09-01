"""
Shared static knowledge for Paguyuban Messe 2026.
Optionally, callers can overlay dynamic data fetched from Next.js BE.
"""
from typing import Dict, Any

STATIC_KNOWLEDGE: Dict[str, Any] = {
    "event": {
        "name": "Paguyuban Messe 2026 - Level-Up Indonesia",
        "dates": "August 7-8, 2026",
        "location": "Arena Berlin",
        "venue": {
            "main_hall": "6,500m² exhibition space",
            "beach_club": "Waterfront VVIP networking area",
            "club_berlin": "Evening entertainment space",
        },
    },
    "sponsorship_tiers": [
        {"name": "Title", "price": "€120,000", "benefits": ["Naming rights", "50 AI matches"]},
        {"name": "Platinum", "price": "€60,000", "benefits": ["30 AI matches", "20 VIP passes"]},
        {"name": "Gold", "price": "€40,000", "benefits": ["20 AI matches", "15 VIP passes"]},
        {"name": "Silver", "price": "€25,000", "benefits": ["10 AI matches", "10 VIP passes"]},
        {"name": "Bronze", "price": "€15,000", "benefits": ["5 AI matches", "5 VIP passes"]},
    ],
    "artists": [
        {"name": "Tulus", "genre": "Premier vocalist"},
        {"name": "Dewa 19", "genre": "Indonesian rock legends"},
        {"name": "The Panturas", "genre": "Indonesian indie rock"},
        {"name": "Efek Rumah Kaca", "genre": "Alternative rock"},
    ],
}


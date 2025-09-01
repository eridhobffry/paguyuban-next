"""
Configuration for Paguyuban AI Service
"""

import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field


class AIServiceSettings(BaseSettings):
    """AI Service Configuration"""

    # Service Configuration
    service_name: str = "paguyuban-ai"
    version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")

    # Ollama Configuration
    ollama_base_url: str = Field(default="http://localhost:11434", env="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="qwen2.5:7b-instruct", env="OLLAMA_MODEL")
    ollama_timeout: int = Field(default=300, env="OLLAMA_TIMEOUT")  # seconds

    # AI Model Configuration
    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", env="EMBEDDING_MODEL")
    embedding_dimensions: int = Field(default=384, env="EMBEDDING_DIMENSIONS")

    # Guardrails Configuration
    guardrail_model: str = Field(default="meta-llama/LlamaGuard-3-8B", env="GUARDRAIL_MODEL")
    toxicity_threshold: float = Field(default=0.5, env="TOXICITY_THRESHOLD")

    # Vector Database Configuration
    qdrant_url: str = Field(default="http://localhost:6333", env="QDRANT_URL")
    qdrant_collection: str = Field(default="paguyuban_events", env="QDRANT_COLLECTION")
    vector_dimension: int = Field(default=384, env="VECTOR_DIMENSION")

    # Database Configuration (if needed for direct access)
    database_url: Optional[str] = Field(default=None, env="DATABASE_URL")

    # Performance Configuration
    max_concurrent_requests: int = Field(default=3, env="MAX_CONCURRENT_REQUESTS")
    request_timeout: int = Field(default=300, env="REQUEST_TIMEOUT")  # seconds
    model_cache_size: str = Field(default="4GB", env="MODEL_CACHE_SIZE")

    # Feature Flags
    enable_rag: bool = Field(default=True, env="ENABLE_RAG")
    enable_guardrails: bool = Field(default=True, env="ENABLE_GUARDRAILS")
    enable_multilingual: bool = Field(default=True, env="ENABLE_MULTILINGUAL")

    # API Configuration
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8001, env="API_PORT")
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "https://paguyuban-messe.com"],
        env="CORS_ORIGINS"
    )

    # Logging Configuration
    log_level: str = Field(default="INFO", env="LOG_LEVEL")

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = AIServiceSettings()

# Event Knowledge Base Configuration
PAGUYUBAN_KNOWLEDGE = {
    "event": {
        "name": "Paguyuban Messe 2026 - Level-Up Indonesia",
        "dates": "August 7-8, 2026",
        "location": "Arena Berlin",
        "venue": {
            "main_hall": "6,500m² exhibition space",
            "beach_club": "Waterfront VVIP networking area",
            "club_berlin": "Evening entertainment space"
        },
        "attendance": {
            "total": "5,800-6,800 participants",
            "business": "1,440-1,680 professionals"
        }
    },
    "sponsorship_tiers": [
        {"name": "Title", "price": "€120,000", "benefits": ["Naming rights", "50 AI matches"]},
        {"name": "Platinum", "price": "€60,000", "benefits": ["30 AI matches", "20 VIP passes"]},
        {"name": "Gold", "price": "€40,000", "benefits": ["20 AI matches", "15 VIP passes"]},
        {"name": "Silver", "price": "€25,000", "benefits": ["10 AI matches", "10 VIP passes"]},
        {"name": "Bronze", "price": "€15,000", "benefits": ["5 AI matches", "5 VIP passes"]}
    ],
    "artists": [
        {"name": "Tulus", "genre": "Premier vocalist"},
        {"name": "Dewa 19", "genre": "Indonesian rock legends"},
        {"name": "The Panturas", "genre": "Indonesian indie rock"},
        {"name": "Efek Rumah Kaca", "genre": "Alternative rock"}
    ]
}

# Language Detection Keywords
INDONESIAN_KEYWORDS = [
    "kapan", "dimana", "berapa", "harga", "biaya", "konser", "artis",
    "saya", "tertarik", "acara", "bisnis", "jakarta", "indonesia"
]

GERMAN_KEYWORDS = [
    "wann", "wo", "wie", "preis", "veranstaltung", "berlin", "termin"
]

# Chat Context Limits
MAX_CHAT_HISTORY = 20
MAX_TOKENS_PER_MESSAGE = 1000
MAX_TOTAL_TOKENS = 8000

# Search Configuration
SEARCH_RESULTS_LIMIT = 10
SEARCH_SIMILARITY_THRESHOLD = 0.7

# Event Creation Configuration
MAX_EVENT_TITLE_LENGTH = 200
MAX_EVENT_DESCRIPTION_LENGTH = 2000
SUPPORTED_LANGUAGES = ["en", "id", "ms", "de"]

# Malay (Bahasa Melayu) keywords for detection
MALAY_KEYWORDS = [
    "bila", "di mana", "dimana", "berapa", "harga", "acara", "perniagaan",
    "syarikat", "nak", "penaja", "manfaat", "jadual", "hubungi"
]

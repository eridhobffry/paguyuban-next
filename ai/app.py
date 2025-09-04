"""
Paguyuban Messe AI Service - Data-Driven Agent Architecture
Simplified FastAPI server for Phase 2.25 data-driven agents
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
from contextlib import asynccontextmanager
import json
import jwt
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from ai.contracts import EventPlan, AnalyticsReport, ContractReview
from ai.common.memory import detect_memory_diff
from ai.common.lang import get_language_prompt
from ai.common.intent import IntentAnalyzer
from ai.ollama_client import OllamaClient, map_model, OllamaError
import time

# Simplified configuration
class SimpleSettings:
    service_name = "paguyuban-ai"
    version = "2.25.0"
    debug = True

settings = SimpleSettings()
_startup_time = datetime.now()
_ollama_client = None  # lazy

def _is_ollama_enabled() -> bool:
    return os.getenv("AI_ENABLE_OLLAMA", "0") == "1"

def _get_ollama() -> Optional[OllamaClient]:
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = OllamaClient(timeout_ms=int(os.getenv("OLLAMA_TIMEOUT_MS", "800")))
    return _ollama_client

def _is_memory_diff_enabled() -> bool:
    return os.getenv("AI_MEMORY_DIFF", "1") == "1"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Authentication setup
security = HTTPBearer()

def get_ai_service_secret() -> str:
    """Get AI service JWT secret from environment"""
    secret = os.getenv('AI_SERVICE_JWT_SECRET')
    
    if not secret:
        if os.getenv('NODE_ENV') == 'production':
            raise RuntimeError('AI_SERVICE_JWT_SECRET must be configured in production')
        
        # Development fallback
        logger.warning('Using development AI service JWT secret. Configure AI_SERVICE_JWT_SECRET for production.')
        return 'dev-secret-ai-service-auth-never-use-in-production'
    
    return secret

def verify_ai_service_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify JWT token from Next.js service"""
    try:
        token = credentials.credentials
        secret = get_ai_service_secret()
        
        payload = jwt.decode(
            token,
            secret,
            algorithms=['HS256'],
            issuer='paguyuban-next',
            audience='paguyuban-ai',
            options={
                'verify_exp': True,
                'verify_nbf': True,
                'verify_iat': True,
            }
        )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )

# Data-Driven Agent Architecture
class DataDrivenAgent:
    """Simplified data-driven agent for Phase 2.25"""

    def __init__(self):
        self._intent = IntentAnalyzer()
        # Include multilingual keywords (EN/ID/MS/DE)
        self.intent_patterns = {
            # Timing / general event info
            "event_details": [
                "when", "date", "time", "schedule", "jadwal", "jadual", "kapan", "bila", "diadakan",
                "where", "dimana", "di mana", "lokasi", "venue",
                "artists", "speakers", "artis", "pembicara", "sänger",
            ],
            # Pricing / sponsorship
            "pricing_info": [
                "price", "cost", "fee", "ticket", "sponsorship", "sponsor", "harga", "biaya", "preis", "penaja",
            ],
            # Prospect / partnership
            "prospect_analysis": [
                "interested", "contact", "lead", "conversion", "tertarik", "kerjasama", "partnerschaft"
            ],
            # General help
            "personalized_response": ["help", "assist", "support", "question", "bantuan", "hilfe"],
        }

    def analyze_intent(self, query: str, language: str = "en") -> str:
        # Delegate to shared analyzer for consistency
        return self._intent.analyze_intent(query, language)

    def decide_data_needs(self, intent: str, query: str, session_id: str = None) -> Dict[str, Any]:
        """Agentic decision-making for data requirements"""
        data_requirements = {
            "intent": intent,
            "query": query,
            "session_id": session_id,
            "data_sources": []
        }

        if intent == "prospect_analysis":
            data_requirements["data_sources"] = [
                {"type": "chat_logs", "session_id": session_id, "limit": 20},
                {"type": "prospect_data", "session_id": session_id}
            ]
        elif intent == "event_details":
            data_requirements["data_sources"] = [
                {"type": "artists", "upcoming_only": True},
                {"type": "speakers", "confirmed_only": True}
            ]
        elif intent in ("pricing_info", "event_pricing"):
            data_requirements["data_sources"] = [
                {"type": "sponsors", "include_tiers": True},
                {"type": "event_pricing", "current": True}
            ]

        return data_requirements

    def generate_response(self, query: str, intent: str, context_data: Dict[str, Any], language: str = "en") -> str:
        """Generate response based on intent, data, and language"""
        if intent == "prospect_analysis":
            return self._generate_prospect_analysis(query, context_data)
        elif intent in ("event_details", "event_timing"):
            return self._generate_event_details(query, context_data, language)
        elif intent in ("pricing_info", "event_pricing"):
            return self._generate_pricing_info(query, context_data, language)
        else:
            return self._generate_general_response(query, context_data, language)

    def _generate_prospect_analysis(self, query: str, context_data: Dict[str, Any]) -> str:
        chat_logs = context_data.get("chat_logs", [])
        prospect = context_data.get("prospect", {})

        response = "Based on our conversation history and your interest in partnership opportunities:\n\n"

        if prospect:
            response += f"I understand you're interested in {prospect.get('interest', 'our services')}. "
            if prospect.get('budget'):
                response += f"With your budget of {prospect.get('budget')}, here are some relevant options:\n\n"

        response += "Here are the key partnership opportunities that match your interests:\n"
        response += "• Platinum Sponsorship: €50,000 - Premium branding and speaking opportunities\n"
        response += "• Gold Sponsorship: €25,000 - Enhanced visibility and networking\n"
        response += "• Silver Sponsorship: €10,000 - Standard sponsorship package\n\n"

        response += "Would you like me to provide more details about any of these options?"

        return response

    def _generate_event_details(self, query: str, context_data: Dict[str, Any], language: str = "en") -> str:
        # Try to use any provided event context to enrich details
        ev = context_data.get("event_context") or {}
        availability = ev.get("availability") or {}
        sponsors = ev.get("sponsors") or []
        tiers = ev.get("tiers") or []
        sponsor_line_en = (
            f"Current sponsors: {len(sponsors)}" if isinstance(sponsors, list) and len(sponsors) else None
        )
        sponsor_line_id = (
            f"Sponsor saat ini: {len(sponsors)}" if isinstance(sponsors, list) and len(sponsors) else None
        )
        sponsor_line_ms = (
            f"Penaja semasa: {len(sponsors)}" if isinstance(sponsors, list) and len(sponsors) else None
        )
        # Show quick availability if present
        def fmt_avail(av: Dict[str, Any], names: List[str]) -> Optional[str]:
            parts = []
            for n in names:
                v = av.get(n)
                if v is not None:
                    parts.append(f"{n}: {v}")
            return ", ".join(parts) if parts else None

        if language == "id":
            base = [
                "Paguyuban Messe 2026 akan diadakan pada 7-8 Agustus 2026 di Arena Berlin, Jerman.",
                "",
                "Tema: Digital Innovation & Cultural Heritage",
                "",
                "Sorotan Jadwal:",
                "• Hari 1: Pembukaan, B2B matchmaking, lokakarya budaya",
                "• Hari 2: Showcase inovasi, leadership talks, konser grand finale",
            ]
            if sponsor_line_id:
                base.append("")
                base.append(sponsor_line_id)
            avail = fmt_avail(availability, ["title", "platinum", "gold", "silver", "bronze"])
            if avail:
                base.append(f"Ketersediaan paket: {avail}")
            base.append("")
            base.append("Ada info spesifik yang ingin Anda ketahui?")
            return "\n".join(base)
        if language == "ms":
            base = [
                "Paguyuban Messe 2026 akan diadakan pada 7-8 Ogos 2026 di Arena Berlin, Jerman.",
                "",
                "Maklumat lanjut:",
                "• Tema: Inovasi Digital & Warisan Budaya",
                "",
                "Sorotan Jadual:",
                "• Hari 1: Perasmian dan persembahan budaya",
                "• Hari 2: Rangkaian perniagaan dan bengkel",
            ]
            if sponsor_line_ms:
                base.append("")
                base.append(sponsor_line_ms)
            avail = fmt_avail(availability, ["title", "platinum", "gold", "silver", "bronze"])
            if avail:
                base.append(f"Ketersediaan pakej: {avail}")
            base.append("")
            base.append("Ada perkara khusus yang anda ingin tahu?")
            return "\n".join(base)
        base = [
            "Here’s the information about our upcoming Paguyuban Messe event:",
            "",
            "• Date: August 7-8, 2026",
            "• Location: Arena Berlin, Germany",
            "• Theme: “Digital Innovation & Cultural Heritage”",
            "",
            "Schedule Highlights:",
            "• Day 1: Opening ceremony, B2B matchmaking, cultural workshops",
            "• Day 2: Innovation showcases, leadership talks, grand finale concert",
        ]
        if sponsor_line_en:
            base.append("")
            base.append(sponsor_line_en)
        avail = fmt_avail(availability, ["title", "platinum", "gold", "silver", "bronze"])
        if avail:
            base.append(f"Tier availability: {avail}")
        base.append("")
        base.append("Would you like more specific information about any aspect of the event?")
        return "\n".join(base)

    def _generate_pricing_info(self, query: str, context_data: Dict[str, Any], language: str = "en") -> str:
        # Prefer dynamic pricing info from event_context.sponsors/tiers when provided
        ev = context_data.get("event_context") or {}
        tiers = ev.get("tiers") or []
        sponsors = ev.get("sponsors") or []
        availability = ev.get("availability") or {}

        def fmt_price(p: Any) -> Optional[str]:
            try:
                if p is None:
                    return None
                # Already a number? format as €xx,xxx
                if isinstance(p, (int, float)):
                    return f"€{int(p):,}".replace(",", ".")
                # String? return as-is
                return str(p)
            except Exception:
                return None

        def tier_lines() -> List[str]:
            lines: List[str] = []
            if isinstance(tiers, list) and tiers:
                for t in tiers:
                    name = t.get("name") if isinstance(t, dict) else None
                    price = fmt_price((t.get("price") if isinstance(t, dict) else None))
                    rem = t.get("remaining") if isinstance(t, dict) else None
                    bits = []
                    if name:
                        bits.append(str(name))
                    if price:
                        bits.append(str(price))
                    if rem is not None:
                        bits.append(f"remaining {rem}")
                    if bits:
                        lines.append("• " + " — ".join(bits))
            return lines

        if language == "id":
            header = ["Berikut pilihan harga sponsorship saat ini:"]
            lines = tier_lines()
            if not lines:
                # Fallback static tiers
                lines = [
                    "• Platinum: €50.000 — Hak logo utama, sesi keynote, akses VIP",
                    "• Gold: €25.000 — Logo panggung & situs, booth premium",
                    "• Silver: €10.000 — Logo di situs & program, booth standar",
                ]
            sponsor_info = (
                f"Jumlah sponsor aktif: {len(sponsors)}" if isinstance(sponsors, list) and len(sponsors) else None
            )
            avail_parts = []
            for k in ["title", "platinum", "gold", "silver", "bronze"]:
                v = availability.get(k)
                if v is not None:
                    avail_parts.append(f"{k}: {v}")
            out = header + [""] + ["Paket Sponsorship:"] + lines
            if sponsor_info:
                out += ["", sponsor_info]
            if avail_parts:
                out += [f"Ketersediaan paket: {', '.join(avail_parts)}"]
            return "\n".join(out)
        if language == "ms":
            header = ["Berikut pilihan harga penajaan semasa:"]
            lines = tier_lines()
            if not lines:
                lines = [
                    "• Platinum: €50,000 — Penjenamaan utama, slot keynote, akses VIP",
                    "• Gold: €25,000 — Logo pentas & laman, lokasi booth premium",
                    "• Silver: €10,000 — Logo di laman & program, booth standard",
                ]
            sponsor_info = (
                f"Penaja aktif: {len(sponsors)}" if isinstance(sponsors, list) and len(sponsors) else None
            )
            avail_parts = []
            for k in ["title", "platinum", "gold", "silver", "bronze"]:
                v = availability.get(k)
                if v is not None:
                    avail_parts.append(f"{k}: {v}")
            out = header + [""] + ["Pakej Penajaan:"] + lines
            if sponsor_info:
                out += ["", sponsor_info]
            if avail_parts:
                out += [f"Ketersediaan pakej: {', '.join(avail_parts)}"]
            return "\n".join(out)
        header = ["Here are our current sponsorship pricing options:"]
        lines = tier_lines()
        if not lines:
            lines = [
                "• Platinum: €50,000 — Prime logo placement, keynote slot, VIP networking",
                "• Gold: €25,000 — Main stage & website logo, speaking opportunity, booth premium",
                "• Silver: €10,000 — Website/program logo, standard booth, attendance",
            ]
        sponsor_info = (
            f"Current sponsors: {len(sponsors)}" if isinstance(sponsors, list) and len(sponsors) else None
        )
        avail_parts = []
        for k in ["title", "platinum", "gold", "silver", "bronze"]:
            v = availability.get(k)
            if v is not None:
                avail_parts.append(f"{k}: {v}")
        out = header + [""] + ["Sponsorship Packages:"] + lines
        if sponsor_info:
            out += ["", sponsor_info]
        if avail_parts:
            out += [f"Tier availability: {', '.join(avail_parts)}"]
        out += ["", "Would you like to discuss which option best fits your needs?"]
        return "\n".join(out)

    def _generate_general_response(self, query: str, context_data: Dict[str, Any], language: str = "en") -> str:
        if language == "id":
            return (
                "Paguyuban Messe 2026 akan diadakan pada 7-8 Agustus 2026 di Arena Berlin.\n\n"
                "Terima kasih atas ketertarikan Anda pada Paguyuban Messe! Saya siap membantu informasi acara, peluang kemitraan, dan perayaan budaya.\n\n"
                "Bagaimana saya bisa membantu hari ini? Saya dapat menyampaikan:\n"
                "• Jadwal acara dan penampil\n"
                "• Opsi sponsorship dan kemitraan\n"
                "• Pameran budaya dan lokakarya\n"
                "• Informasi pendaftaran dan tiket\n"
            )
        if language == "ms":
            return (
                "Paguyuban Messe 2026 akan diadakan pada 7-8 Ogos 2026 di Arena Berlin.\n\n"
                "Terima kasih atas minat anda terhadap Paguyuban Messe! Saya sedia membantu dengan maklumat acara, peluang penajaan, dan sambutan budaya.\n\n"
                "Bagaimana saya boleh bantu hari ini? Saya boleh kongsi:\n"
                "• Jadual acara dan persembahan\n"
                "• Pilihan penajaan dan kerjasama\n"
                "• Pameran budaya dan bengkel\n"
                "• Maklumat pendaftaran dan tiket\n"
            )
        return """Thank you for your interest in Paguyuban Messe! I'm here to help you with information about our event, partnership opportunities, and cultural celebration.

How can I assist you today? I can provide details about:
• Event schedule and featured performers
• Sponsorship and partnership options
• Cultural exhibits and workshops
• Registration and ticketing information

Please let me know what specific information you're looking for!"""

# Global agent instance
data_agent = DataDrivenAgent()
_intent_analyzer = IntentAnalyzer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting Paguyuban AI Service - Data-Driven Agent Architecture v2.25")
    yield
    logger.info("Shutting down Paguyuban AI Service")

# Create FastAPI app
app = FastAPI(
    title="Paguyuban AI Service - Data-Driven Agent Architecture",
    description="Phase 2.25: Simplified AI service for data-driven agents",
    version="2.25.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://paguyuban-messe.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint with dependency validation"""
    now = datetime.now()
    uptime_seconds = (now - _startup_time).total_seconds()
    
    # Check internal dependencies
    dependencies = {}
    all_healthy = True
    
    try:
        # Validate agent initialization
        dependencies["data_agent"] = data_agent is not None
        dependencies["intent_patterns"] = len(data_agent.intent_patterns) > 0
        
        # Check configuration
        dependencies["config_loaded"] = hasattr(settings, 'service_name')
        dependencies["app_loaded"] = True
        
        # Validate core functionality with a test query
        try:
            test_intent = data_agent.analyze_intent("test query", "en")
            dependencies["intent_analysis"] = test_intent is not None
        except Exception:
            dependencies["intent_analysis"] = False
            all_healthy = False
            
        # Future: Add external dependency checks here
        # dependencies["redis"] = await check_redis_connection()
        # dependencies["vector_db"] = await check_vector_db_connection()
        
    except Exception as e:
        logger.error(f"Health check dependency validation failed: {e}")
        all_healthy = False
        dependencies["validation_error"] = str(e)
    
    # Determine overall status
    status = "healthy" if all_healthy and all(dependencies.values()) else "degraded"
    
    return {
        "status": status,
        "service": settings.service_name,
        "version": settings.version,
        "architecture": "Data-Driven Agent v2.25",
        "timestamp": now.isoformat(),
        "uptime": uptime_seconds,
        "dependencies": dependencies,
        "endpoints": {
            "chat_generate": "/api/chat/generate",
            "event_chat": "/api/event/chat", 
            "chat_summary": "/api/analytics/chat/summary",
            "event_plan": "/api/contracts/event-plan",
            "analytics_report": "/api/contracts/analytics-report",
            "contract_review": "/api/contracts/contract-review",
        }
    }

@app.post("/api/chat/generate")
async def generate_chat_response(
    request: Dict[str, Any],
    token_payload: Dict[str, Any] = Depends(verify_ai_service_token),
    http_request: Request = None,
):
    """Generate data-driven chat response"""
    try:
        _t_start = time.perf_counter()
        query = request.get("query", "")
        # Language: priority from body, else detect
        from ai.common.lang import detect_language
        language = request.get("language") or detect_language(query)
        session_id = request.get("session_id")
        context_data = request.get("context_data", {})

        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        # Phase 2.25 Data-Driven Agent Architecture
        intent = data_agent.analyze_intent(query, language)
        data_requirements = data_agent.decide_data_needs(intent, query, session_id)
        # Optionally run Ollama for generation when enabled
        response = None
        if _is_ollama_enabled():
            try:
                model = map_model((http_request.headers.get("x-ai-model") if http_request else None))
                # Use chat format with system message to steer language and role
                system = (
                    f"You are an assistant for Paguyuban Messe 2026. Respond in the user's language.\n"
                    f"{get_language_prompt(language)}\n"
                    f"Keep answers concise and factual."
                )
                messages = [
                    {"role": "system", "content": system},
                    {"role": "user", "content": query},
                ]
                response = _get_ollama().chat(model, messages, options={"temperature": 0.5, "num_predict": 256})
            except (TimeoutError, OllamaError):
                response = None
        if not response:
            response = data_agent.generate_response(query, intent, context_data, language)
        mem = detect_memory_diff(query, language)
        # Echo routing/cache headers into metadata
        hdr = http_request.headers if http_request else {}
        meta = {
            "intent": intent,
            "data_requirements": data_requirements,
            "architecture": "Phase 2.25 Data-Driven Agent",
            "timestamp": datetime.now().isoformat(),
            "model_used": hdr.get("x-ai-model"),
            "route_reason": hdr.get("x-route-reason"),
            "cache_status": hdr.get("x-cache"),
            "client_intent": hdr.get("x-intent"),
            "task_complexity": hdr.get("x-task-complexity"),
            "involves": hdr.get("x-involves"),
            "language": language,
            "correlation_id": hdr.get("x-correlation-id"),
        }

        # latency
        meta["latency_ms"] = int((time.perf_counter() - _t_start) * 1000)

        # Structured info log for SLOs
        try:
            logger.info(
                "ai_chat_generate model=%s route=%s lang=%s intent=%s complexity=%s cache=%s latency_ms=%s corr=%s",
                meta.get("model_used"),
                meta.get("route_reason"),
                meta.get("language"),
                meta.get("intent"),
                meta.get("task_complexity"),
                meta.get("cache_status"),
                meta.get("latency_ms"),
                meta.get("correlation_id"),
            )
        except Exception:
            pass

        out = {"result": response, "metadata": meta}
        if _is_memory_diff_enabled() and mem:
            out["memory_diff"] = mem
        return out

    except Exception as e:
        logger.error("Chat generation error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Chat generation failed: {str(e)}")

@app.post("/api/event/chat")
async def event_chat_response(
    request: Dict[str, Any],
    token_payload: Dict[str, Any] = Depends(verify_ai_service_token),
    http_request: Request = None,
):
    """Generate event-specific response using data-driven agent"""
    try:
        _t_start = time.perf_counter()
        query = request.get("query", "")
        from ai.common.lang import detect_language
        language = request.get("language") or detect_language(query)
        session_id = request.get("session_id")
        context_data = request.get("context_data", {})

        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        # Analyze intent and generate response
        intent = data_agent.analyze_intent(query, language)
        data_requirements = data_agent.decide_data_needs(intent, query, session_id)
        # Optionally run Ollama when enabled
        response = None
        if _is_ollama_enabled():
            try:
                model = map_model((http_request.headers.get("x-ai-model") if http_request else None))
                system = (
                    f"You are an assistant for Paguyuban Messe 2026. Respond in the user's language.\n"
                    f"{get_language_prompt(language)}\n"
                    f"Keep answers concise and factual."
                )
                messages = [
                    {"role": "system", "content": system},
                    {"role": "user", "content": query},
                ]
                response = _get_ollama().chat(model, messages, options={"temperature": 0.5, "num_predict": 256})
            except (TimeoutError, OllamaError):
                response = None
        if not response:
            response = data_agent.generate_response(query, intent, context_data, language)
        mem = detect_memory_diff(query, language)

        hdr = http_request.headers if http_request else {}
        meta = {
            "intent": intent,
            "data_sources_needed": data_requirements.get("data_sources", []),
            "architecture": "Phase 2.25 Data-Driven Agent",
            "model_used": hdr.get("x-ai-model"),
            "route_reason": hdr.get("x-route-reason"),
            "cache_status": hdr.get("x-cache"),
            "client_intent": hdr.get("x-intent"),
            "task_complexity": hdr.get("x-task-complexity"),
            "involves": hdr.get("x-involves"),
            "language": language,
            "timestamp": datetime.now().isoformat(),
            "correlation_id": hdr.get("x-correlation-id"),
        }
        # latency
        meta["latency_ms"] = int((time.perf_counter() - _t_start) * 1000)

        # Structured info log for SLOs
        try:
            logger.info(
                "ai_event_chat model=%s route=%s lang=%s intent=%s complexity=%s cache=%s latency_ms=%s corr=%s",
                meta.get("model_used"),
                meta.get("route_reason"),
                meta.get("language"),
                meta.get("intent"),
                meta.get("task_complexity"),
                meta.get("cache_status"),
                meta.get("latency_ms"),
                meta.get("correlation_id"),
            )
        except Exception:
            pass

        out = {"result": response, "metadata": meta}
        if _is_memory_diff_enabled() and mem:
            out["memory_diff"] = mem
        return out

    except Exception as e:
        logger.error("Event chat error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Event chat failed: {str(e)}")

@app.post("/api/analytics/chat/summary")
async def generate_chat_summary(
    request: Dict[str, Any],
    token_payload: Dict[str, Any] = Depends(verify_ai_service_token),
    http_request: Request = None,
):
    """Generate simplified chat summary"""
    try:
        _t_start = time.perf_counter()
        transcript = request.get("transcript", "")
        language = request.get("language", "en")

        if not transcript:
            raise HTTPException(status_code=400, detail="Transcript is required")

        # Simple summary generation for Phase 2.25
        summary = f"Chat Summary ({language}):\n\n"
        summary += f"Transcript Length: {len(transcript)} characters\n"
        summary += f"Language: {language}\n"
        summary += f"Generated: {datetime.now().isoformat()}\n\n"
        summary += "This is a simplified summary generated by the Phase 2.25 data-driven agent architecture."

        hdr = http_request.headers if http_request else {}
        meta = {
            "architecture": "Phase 2.25 Data-Driven Agent",
            "language": language,
            "timestamp": datetime.now().isoformat(),
            "model_used": hdr.get("x-ai-model"),
            "route_reason": hdr.get("x-route-reason"),
            "cache_status": hdr.get("x-cache"),
            "client_intent": hdr.get("x-intent"),
            "task_complexity": hdr.get("x-task-complexity"),
            "involves": hdr.get("x-involves"),
            "correlation_id": hdr.get("x-correlation-id"),
        }
        # latency
        meta["latency_ms"] = int((time.perf_counter() - _t_start) * 1000)
        return {"summary": summary, "metadata": meta}

    except Exception as e:
        logger.error("Summary generation error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")

# End of Phase 2.25 Data-Driven Agent Architecture
# Additional endpoints can be added here as we expand the architecture

# ---- Phase 7: Output Contract Endpoints (scaffold, deterministic) ----

@app.post("/api/contracts/event-plan")
async def make_event_plan(
    _body: Dict[str, Any],
    token_payload: Dict[str, Any] = Depends(verify_ai_service_token),
    http_request: Request = None,
):
    plan = EventPlan(
        title="Nusantara Business & Culture Day",
        date_range="2026-08-07 to 2026-08-08",
        city="Berlin",
        personas=["Investors", "SME Founders", "Cultural Organizations"],
        goals=["Deal-flow", "Brand exposure", "Community building"],
        budget_band="€25,000–€60,000",
        risks=["Scheduling conflicts", "Sponsor overlap", "Logistics"],
        sponsor_targets=["Telco", "Banking", "FMCG"],
        next_actions=["Confirm venue zones", "Lock headliners", "Publish sponsor deck"],
    )
    hdr = http_request.headers if http_request else {}
    return {
        "event_plan": plan.model_dump(),
        "metadata": {
            "model_used": hdr.get("x-ai-model"),
            "route_reason": hdr.get("x-route-reason"),
            "timestamp": datetime.now().isoformat(),
        },
    }


@app.post("/api/contracts/analytics-report")
async def make_analytics_report(
    body: Dict[str, Any],
    token_payload: Dict[str, Any] = Depends(verify_ai_service_token),
    http_request: Request = None,
):
    question = str(body.get("question")) if body and body.get("question") else "What is the sponsorship ROI baseline?"
    report = AnalyticsReport(
        question=question,
        data_sources=["chat_logs", "sponsor_tiers"],
        method="Heuristic summarization",
        findings=["77.6% revenue from sponsors", "ROI depends on pipeline and ACV"],
        caveats=["Illustrative numbers"],
        decisions=["Prioritize Gold & Platinum outreach"],
        appendix={"n": 2},
    )
    hdr = http_request.headers if http_request else {}
    return {
        "analytics_report": report.model_dump(),
        "metadata": {
            "model_used": hdr.get("x-ai-model"),
            "route_reason": hdr.get("x-route-reason"),
            "timestamp": datetime.now().isoformat(),
        },
    }


@app.post("/api/contracts/contract-review")
async def make_contract_review(
    body: Dict[str, Any],
    token_payload: Dict[str, Any] = Depends(verify_ai_service_token),
    http_request: Request = None,
):
    title = str(body.get("doc_title") or body.get("title") or "Sponsorship Agreement – Draft")
    review = ContractReview(
        doc_title=title,
        clauses_risky=["Broad indemnity", "Unlimited liability"],
        redlines=["Cap liability at fees", "Mutual indemnity"],
        negotiation_positions=["Tiered exposure", "Flexible deliverables"],
        summary="Key risks identified; redlines proposed for balanced terms.",
    )
    hdr = http_request.headers if http_request else {}
    return {
        "contract_review": review.model_dump(),
        "metadata": {
            "model_used": hdr.get("x-ai-model"),
            "route_reason": hdr.get("x-route-reason"),
            "timestamp": datetime.now().isoformat(),
        },
    }

# ---- Intent Analyze Endpoint ----

@app.post("/api/ai/intent/analyze")
async def analyze_intent(
    body: Dict[str, Any],
    token_payload: Dict[str, Any] = Depends(verify_ai_service_token),
):
    """Lightweight intent analysis for Next intent resolver.

    Request body:
      { query: string, language?: string, session_id?: string, user_id?: string, context?: object }
    Response:
      { intent: string, confidence: float }
    """
    try:
        query = str(body.get("query") or "").strip()
        if not query:
            return {"intent": "general_inquiry", "confidence": 0.0}
        lang = str(body.get("language") or "en").strip().lower()
        # Use shared analyzer
        intent = _intent_analyzer.analyze_intent(query, lang)
        # Simple confidence heuristic
        base_conf = 0.7
        if intent in {"event_details", "event_timing", "event_location", "pricing_info", "prospect_analysis"}:
            conf = 0.85
        else:
            conf = base_conf
        return {"intent": intent, "confidence": conf}
    except Exception as e:
        logger.error("Intent analyze error: %s", str(e))
        # Degrade gracefully
        return {"intent": "general_inquiry", "confidence": 0.0}

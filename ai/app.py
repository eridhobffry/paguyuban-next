"""
Paguyuban Messe AI Service
FastAPI server for AI-powered event management features
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import structlog
from contextlib import asynccontextmanager

from .config import settings
from .ollama_client import OllamaClient
from .embeddings import EmbeddingService
from .guardrails import GuardrailService
from .rag import RAGService
from .agents import (
    ConversationalSearchAgent,
    EventCreatorAgent,
    ModerationAgent,
    AnalyticsAgent,
    EventChatAgent,
    ProspectAnalyzer
)

# Configure structured logging
logger = structlog.get_logger()

# Global services
ollama_client = None
embedding_service = None
guardrail_service = None
rag_service = None

# Performance monitoring
import time
import psutil
from functools import wraps

def monitor_performance(func):
    """Decorator to monitor function performance"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        try:
            result = await func(*args, **kwargs)

            end_time = time.time()
            end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

            logger.info(f"{func.__name__} completed", extra={
                "duration": round(end_time - start_time, 2),
                "memory_used": round(end_memory - start_memory, 2),
                "memory_total": round(end_memory, 2)
            })

            return result

        except Exception as e:
            end_time = time.time()
            logger.error(f"{func.__name__} failed", extra={
                "duration": round(end_time - start_time, 2),
                "error": str(e)
            })
            raise

    return wrapper

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global ollama_client, embedding_service, guardrail_service, rag_service

    logger.info("Starting Paguyuban AI Service...")

    # Initialize services
    ollama_client = OllamaClient()
    embedding_service = EmbeddingService()
    guardrail_service = GuardrailService()
    rag_service = RAGService()

    # Initialize agents
    app.state.conversational_agent = ConversationalSearchAgent(
        ollama_client, rag_service, guardrail_service
    )
    app.state.event_creator_agent = EventCreatorAgent(
        ollama_client, embedding_service, guardrail_service
    )
    app.state.moderation_agent = ModerationAgent(guardrail_service)
    app.state.analytics_agent = AnalyticsAgent(
        ollama_client, embedding_service, rag_service
    )
    app.state.event_chat_agent = EventChatAgent(ollama_client)
    app.state.prospect_analyzer = ProspectAnalyzer(ollama_client)

    logger.info("AI Service initialized successfully")

    yield

    logger.info("Shutting down AI Service...")

# Create FastAPI app
app = FastAPI(
    title="Paguyuban AI Service",
    description="AI-powered backend for Paguyuban Messe event management",
    version="1.0.0",
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
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "paguyuban-ai",
        "ollama_connected": ollama_client.is_connected() if ollama_client else False
    }

@app.post("/api/chat/generate")
@monitor_performance
async def generate_chat_response(request: dict):
    """Generate chat response using ConversationalSearchAgent"""
    try:
        query = request.get("query", "")
        context = request.get("context", {})

        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        response = await app.state.conversational_agent.generate_response(query, context)
        return {"result": response}

    except Exception as e:
        logger.error("Chat generation error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Chat generation failed: {str(e)}")

@app.post("/api/event/chat")
@monitor_performance
async def event_chat_response(request: dict):
    """Generate event-specific chat response using EventChatAgent"""
    try:
        query = request.get("query", "")
        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        # Use the EventChatAgent for event-specific questions
        response = app.state.event_chat_agent.answer_question(query)
        return {"result": response}

    except Exception as e:
        logger.error("Event chat error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Event chat failed: {str(e)}")

@app.post("/api/analytics/chat/summary")
@monitor_performance
async def generate_chat_summary(request: dict):
    """Generate chat summary for analytics"""
    try:
        transcript = request.get("transcript", "")
        language = request.get("language", "en")

        if not transcript:
            raise HTTPException(status_code=400, detail="Transcript is required")

        summary = await app.state.analytics_agent.generate_summary(transcript, language)
        return {"summary": summary}

    except Exception as e:
        logger.error("Summary generation error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")

@app.post("/api/admin/analytics/chat/recommend")
@monitor_performance
async def generate_admin_recommendations(request: dict):
    """Generate admin recommendations"""
    try:
        chat_data = request.get("chat_data", [])
        context = request.get("context", {})

        recommendations = await app.state.analytics_agent.generate_recommendations(chat_data, context)
        return {"recommendations": recommendations}

    except Exception as e:
        logger.error("Recommendation generation error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")

@app.post("/api/prospect/analyze")
@monitor_performance
async def analyze_prospect(request: dict):
    """Analyze prospect conversation and generate recommendations"""
    try:
        chat_logs = request.get("chat_logs", [])
        prospect_data = request.get("prospect_data", {})

        if not chat_logs:
            raise HTTPException(status_code=400, detail="Chat logs are required")

        analysis = app.state.prospect_analyzer.analyze_conversation(chat_logs, prospect_data)
        return analysis

    except Exception as e:
        logger.error("Prospect analysis error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Prospect analysis failed: {str(e)}")

@app.post("/api/events/create")
@monitor_performance
async def create_event(request: dict):
    """Create event using EventCreatorAgent"""
    try:
        event_data = request.get("event_data", {})
        user_input = request.get("user_input", "")

        if not event_data and not user_input:
            raise HTTPException(status_code=400, detail="Event data or user input required")

        created_event = await app.state.event_creator_agent.create_event(event_data, user_input)
        return {"event": created_event}

    except Exception as e:
        logger.error("Event creation error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Event creation failed: {str(e)}")

@app.post("/api/moderation/check")
@monitor_performance
async def check_content_moderation(request: dict):
    """Check content for moderation issues"""
    try:
        content = request.get("content", "")
        content_type = request.get("content_type", "text")

        if not content:
            raise HTTPException(status_code=400, detail="Content is required")

        moderation_result = await app.state.moderation_agent.check_content(content, content_type)
        return {"moderation": moderation_result}

    except Exception as e:
        logger.error("Moderation check error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Moderation check failed: {str(e)}")

@app.post("/api/search/events")
@monitor_performance
async def search_events(request: dict):
    """Search events using RAG and conversational AI"""
    try:
        query = request.get("query", "")
        filters = request.get("filters", {})

        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        search_results = await app.state.conversational_agent.search_events(query, filters)
        return {"results": search_results}

    except Exception as e:
        logger.error("Event search error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Event search failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

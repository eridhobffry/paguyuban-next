"""
Paguyuban Messe AI Service - Data-Driven Agent Architecture
Simplified FastAPI server for Phase 2.25 data-driven agents
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
import json
from typing import Dict, Any, List
from datetime import datetime

# Simplified configuration
class SimpleSettings:
    service_name = "paguyuban-ai"
    version = "2.25.0"
    debug = True

settings = SimpleSettings()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data-Driven Agent Architecture
class DataDrivenAgent:
    """Simplified data-driven agent for Phase 2.25"""

    def __init__(self):
        self.intent_patterns = {
            "prospect_analysis": ["interested", "contact", "partnership", "sponsor", "budget"],
            "event_details": ["when", "where", "schedule", "artists", "speakers"],
            "pricing_info": ["price", "cost", "fee", "ticket", "sponsorship"],
            "personalized_response": ["help", "assist", "support", "question"]
        }

    def analyze_intent(self, query: str, language: str = "en") -> str:
        """Simple NLP intent analysis"""
        query_lower = query.lower()

        for intent, keywords in self.intent_patterns.items():
            if any(keyword in query_lower for keyword in keywords):
                return intent

        return "general_inquiry"

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
        elif intent == "pricing_info":
            data_requirements["data_sources"] = [
                {"type": "sponsors", "include_tiers": True},
                {"type": "event_pricing", "current": True}
            ]

        return data_requirements

    def generate_response(self, query: str, intent: str, context_data: Dict[str, Any]) -> str:
        """Generate response based on intent and data"""
        if intent == "prospect_analysis":
            return self._generate_prospect_analysis(query, context_data)
        elif intent == "event_details":
            return self._generate_event_details(query, context_data)
        elif intent == "pricing_info":
            return self._generate_pricing_info(query, context_data)
        else:
            return self._generate_general_response(query, context_data)

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

    def _generate_event_details(self, query: str, context_data: Dict[str, Any]) -> str:
        return """Here's the information about our upcoming Paguyuban Messe event:

**Event Details:**
• **Date:** October 24-26, 2025
• **Location:** Jakarta Convention Center, Indonesia
• **Theme:** "Digital Innovation & Cultural Heritage"

**Featured Artists:**
• Local Indonesian artists and performers
• International cultural ambassadors
• Traditional music and dance performances

**Key Speakers:**
• Indonesian government representatives
• International business leaders
• Cultural preservation experts

**Schedule Highlights:**
• Day 1: Opening ceremony and cultural performances
• Day 2: Business networking and workshops
• Day 3: Closing gala and partnership announcements

Would you like more specific information about any aspect of the event?"""

    def _generate_pricing_info(self, query: str, context_data: Dict[str, Any]) -> str:
        return """Here are our current sponsorship and ticket pricing options:

**Sponsorship Packages:**
• **Platinum:** €50,000
  - Prime logo placement on all materials
  - 10-minute keynote presentation slot
  - VIP networking dinner access
  - Private meeting space

• **Gold:** €25,000
  - Logo on main stage and website
  - 5-minute speaking opportunity
  - Premium booth location
  - Networking lunch access

• **Silver:** €10,000
  - Logo on website and program
  - Standard booth space
  - Event attendance

**Individual Tickets:**
• Early Bird: €150 (until June 2025)
• Regular: €200
• VIP Experience: €350 (includes premium seating and networking)

All packages include comprehensive marketing benefits and networking opportunities. Would you like to discuss which option best fits your needs?"""

    def _generate_general_response(self, query: str, context_data: Dict[str, Any]) -> str:
        return """Thank you for your interest in Paguyuban Messe! I'm here to help you with information about our event, partnership opportunities, and cultural celebration.

How can I assist you today? I can provide details about:
• Event schedule and featured performers
• Sponsorship and partnership options
• Cultural exhibits and workshops
• Registration and ticketing information

Please let me know what specific information you're looking for!"""

# Global agent instance
data_agent = DataDrivenAgent()

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
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.service_name,
        "version": settings.version,
        "architecture": "Data-Driven Agent v2.25",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/chat/generate")
async def generate_chat_response(request: Dict[str, Any]):
    """Generate data-driven chat response"""
    try:
        query = request.get("query", "")
        language = request.get("language", "en")
        session_id = request.get("session_id")
        context_data = request.get("context_data", {})

        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        # Phase 2.25 Data-Driven Agent Architecture
        intent = data_agent.analyze_intent(query, language)
        data_requirements = data_agent.decide_data_needs(intent, query, session_id)
        response = data_agent.generate_response(query, intent, context_data)

        return {
            "result": response,
            "metadata": {
                "intent": intent,
                "data_requirements": data_requirements,
                "architecture": "Phase 2.25 Data-Driven Agent",
                "timestamp": datetime.now().isoformat()
            }
        }

    except Exception as e:
        logger.error("Chat generation error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Chat generation failed: {str(e)}")

@app.post("/api/event/chat")
async def event_chat_response(request: Dict[str, Any]):
    """Generate event-specific response using data-driven agent"""
    try:
        query = request.get("query", "")
        language = request.get("language", "en")
        session_id = request.get("session_id")

        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        # Analyze intent and generate response
        intent = data_agent.analyze_intent(query, language)
        data_requirements = data_agent.decide_data_needs(intent, query, session_id)
        response = data_agent.generate_response(query, intent, {})

        return {
            "result": response,
            "metadata": {
                "intent": intent,
                "data_sources_needed": data_requirements.get("data_sources", []),
                "architecture": "Phase 2.25 Data-Driven Agent"
            }
        }

    except Exception as e:
        logger.error("Event chat error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Event chat failed: {str(e)}")

@app.post("/api/analytics/chat/summary")
async def generate_chat_summary(request: Dict[str, Any]):
    """Generate simplified chat summary"""
    try:
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

        return {
            "summary": summary,
            "metadata": {
                "architecture": "Phase 2.25 Data-Driven Agent",
                "language": language,
                "timestamp": datetime.now().isoformat()
            }
        }

    except Exception as e:
        logger.error("Summary generation error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")

# End of Phase 2.25 Data-Driven Agent Architecture
# Additional endpoints can be added here as we expand the architecture

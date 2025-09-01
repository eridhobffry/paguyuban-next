"""
AI Agents for Paguyuban Messe
Specialized agents for different AI tasks
"""

import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
import structlog

from .ollama_client import OllamaClient
from ..embeddings import EmbeddingService
from ..guardrails import GuardrailService
from ..rag import RAGService
from ..config import settings, INDONESIAN_KEYWORDS, GERMAN_KEYWORDS, MAX_CHAT_HISTORY


logger = structlog.get_logger()


class BaseAgent:
    """Base class for all AI agents"""

    def __init__(self, ollama_client: OllamaClient):
        self.ollama_client = ollama_client

    def _detect_language(self, text: str) -> str:
        """Detect the language of the input text"""
        lower_text = text.lower()

        indonesian_count = sum(1 for keyword in INDONESIAN_KEYWORDS if keyword in lower_text)
        german_count = sum(1 for keyword in GERMAN_KEYWORDS if keyword in lower_text)

        if indonesian_count > german_count:
            return "id"
        elif german_count > indonesian_count:
            return "de"
        else:
            return "en"

    def _get_language_prompt(self, language: str) -> str:
        """Get language-specific instructions"""
        prompts = {
            "id": "Please respond in Indonesian (Bahasa Indonesia) as the user is asking in Indonesian.",
            "de": "Please respond in German as the user is asking in German.",
            "en": "Please respond in English."
        }
        return prompts.get(language, prompts["en"])


class ConversationalSearchAgent(BaseAgent):
    """Agent for conversational search and event queries"""

    def __init__(self, ollama_client: OllamaClient, rag_service: RAGService, guardrail_service: GuardrailService):
        super().__init__(ollama_client)
        self.rag_service = rag_service
        self.guardrail_service = guardrail_service
        self.conversation_history = []

    async def generate_response(self, query: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a conversational response to a user query about events

        Args:
            query: User query
            context: Additional context information

        Returns:
            AI-generated response
        """
        try:
            # Check content safety first
            if settings.enable_guardrails:
                safety_check = await self.guardrail_service.check_content(query, "query")
                if not safety_check["safe"]:
                    return "I'm sorry, but I can't assist with that query. Please ask about Paguyuban Messe 2026 events and services."

            # Detect language
            language = self._detect_language(query)

            # Get relevant context from RAG
            relevant_context = ""
            if settings.enable_rag:
                relevant_context = await self.rag_service.get_relevant_context(query, max_contexts=3)

            # Build conversation prompt
            system_prompt = f"""You are Ucup, a friendly and knowledgeable AI assistant for Paguyuban Messe 2026.

You help users with information about the event, including:
- Event details and schedule
- Sponsorship opportunities and pricing
- Artist performances and program
- Business networking and matchmaking
- Registration and ticketing

{self._get_language_prompt(language)}

Guidelines:
- Be helpful, friendly, and informative
- Focus only on Paguyuban Messe 2026
- Include specific dates, times, and prices when relevant
- If you don't know something, say so honestly
- Keep responses concise but comprehensive
- Always mention you're happy to help with more questions

Current date: {datetime.now().strftime('%Y-%m-%d')}
Event dates: August 7-8, 2026

Relevant context:
{relevant_context}
"""

            # Add to conversation history
            self.conversation_history.append({"role": "user", "content": query})

            # Keep history manageable
            if len(self.conversation_history) > MAX_CHAT_HISTORY:
                self.conversation_history = self.conversation_history[-MAX_CHAT_HISTORY:]

            # Build messages for chat
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(self.conversation_history)

            # Generate response
            response = await self.ollama_client.chat(
                messages=messages,
                temperature=0.7,
                max_tokens=800
            )

            # Add assistant response to history
            self.conversation_history.append({"role": "assistant", "content": response})

            return response

        except Exception as e:
            logger.error(f"Error in conversational search: {str(e)}")
            return "I apologize, but I'm having trouble processing your query right now. Please try again or contact us at nusantaraexpoofficial@gmail.com."

    async def search_events(self, query: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Search for events using RAG

        Args:
            query: Search query
            filters: Optional search filters

        Returns:
            List of relevant events/information
        """
        try:
            if settings.enable_rag:
                return await self.rag_service.search(query, limit=5, filters=filters)
            else:
                return []
        except Exception as e:
            logger.error(f"Error in event search: {str(e)}")
            return []


class EventCreatorAgent(BaseAgent):
    """Agent for creating and suggesting events"""

    def __init__(self, ollama_client: OllamaClient, embedding_service: EmbeddingService, guardrail_service: GuardrailService):
        super().__init__(ollama_client)
        self.embedding_service = embedding_service
        self.guardrail_service = guardrail_service

    async def create_event(self, event_data: Optional[Dict[str, Any]] = None, user_input: str = "") -> Dict[str, Any]:
        """
        Create or suggest event details

        Args:
            event_data: Structured event data
            user_input: Natural language description

        Returns:
            Structured event information
        """
        try:
            # Check content safety
            content_to_check = user_input or str(event_data)
            if settings.enable_guardrails:
                safety_check = await self.guardrail_service.check_content(content_to_check, "event")
                if not safety_check["safe"]:
                    return {"error": "Event content doesn't meet safety guidelines"}

            # Detect language
            language = self._detect_language(user_input or str(event_data))

            system_prompt = f"""You are an expert event planner for Paguyuban Messe 2026.

Your task is to create well-structured event proposals that fit the Indonesian-German business and cultural expo theme.

{self._get_language_prompt(language)}

Guidelines:
- Create events that align with the August 7-8, 2026 timeframe
- Focus on business networking, cultural exchange, or innovation
- Include realistic budgets, timelines, and target audiences
- Consider the venue: Arena Berlin with 6,500m² exhibition space
- Keep events feasible within the 2-day event structure

Please provide event details in this JSON format:
{{
    "title": "Event title (max 200 chars)",
    "description": "Detailed description (max 2000 chars)",
    "category": "business|culture|innovation|networking",
    "duration": "Duration in hours",
    "target_audience": "Target audience description",
    "expected_attendees": "Expected number",
    "requirements": ["List", "of", "requirements"],
    "budget_estimate": "Estimated cost in EUR",
    "objectives": ["List", "of", "learning", "objectives"]
}}
"""

            user_prompt = ""
            if event_data:
                user_prompt = f"Create an event based on this data: {event_data}"
            elif user_input:
                user_prompt = f"Create an event based on this description: {user_input}"
            else:
                user_prompt = "Suggest an interesting event for Paguyuban Messe 2026"

            # Generate event proposal
            response = await self.ollama_client.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=0.8,
                max_tokens=1500
            )

            # Try to parse JSON response
            try:
                import json
                # Extract JSON from response (in case there's extra text)
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    event_info = json.loads(json_str)
                    return event_info
                else:
                    return {"description": response, "raw_response": True}
            except json.JSONDecodeError:
                return {"description": response, "raw_response": True}

        except Exception as e:
            logger.error(f"Error in event creation: {str(e)}")
            return {"error": "Failed to create event proposal"}


class ModerationAgent(BaseAgent):
    """Agent for content moderation and safety checking"""

    def __init__(self, guardrail_service: GuardrailService):
        self.guardrail_service = guardrail_service

    async def check_content(self, content: str, content_type: str = "text") -> Dict[str, Any]:
        """
        Check content for safety and appropriateness

        Args:
            content: Content to check
            content_type: Type of content

        Returns:
            Moderation results
        """
        try:
            if not settings.enable_guardrails:
                return {"safe": True, "message": "Moderation disabled"}

            return await self.guardrail_service.check_content(content, content_type)

        except Exception as e:
            logger.error(f"Error in content moderation: {str(e)}")
            return {"safe": False, "error": str(e)}


class AnalyticsAgent(BaseAgent):
    """Agent for chat analytics, summaries, and recommendations"""

    def __init__(self, ollama_client: OllamaClient, embedding_service: EmbeddingService, rag_service: RAGService):
        super().__init__(ollama_client)
        self.embedding_service = embedding_service
        self.rag_service = rag_service

    async def generate_summary(self, transcript: str, language: str = "en") -> str:
        """
        Generate a summary of a chat conversation

        Args:
            transcript: Chat transcript
            language: Language of the transcript

        Returns:
            Summary with topics and sentiment
        """
        try:
            system_prompt = f"""You are an analytics expert for Paguyuban Messe 2026.

Analyze this chat transcript and provide a concise summary including:
1. Main topics discussed
2. User sentiment (positive, neutral, negative)
3. Key questions or concerns
4. Any action items or next steps mentioned

{self._get_language_prompt(language)}

Keep the summary under 400 characters and focus on actionable insights.
"""

            response = await self.ollama_client.generate(
                prompt=f"Summarize this chat transcript:\n\n{transcript}",
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=400
            )

            return response

        except Exception as e:
            logger.error(f"Error in summary generation: {str(e)}")
            return "Unable to generate summary at this time."

    async def generate_recommendations(self, chat_data: List[Dict[str, Any]], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate business recommendations based on chat analytics

        Args:
            chat_data: Chat conversation data
            context: Additional context

        Returns:
            Recommendations and insights
        """
        try:
            # Prepare chat data for analysis
            formatted_chats = []
            for chat in chat_data:
                formatted_chats.append(f"User: {chat.get('message', '')}")
                formatted_chats.append(f"Assistant: {chat.get('response', '')}")

            chat_text = "\n".join(formatted_chats)

            system_prompt = """You are a business intelligence analyst for Paguyuban Messe 2026.

Analyze these chat conversations and provide strategic recommendations for:
1. Content improvements
2. User engagement strategies
3. Business development opportunities
4. Event promotion insights

Focus on actionable insights that can improve the event experience and business outcomes.

Structure your response as:
- Executive Summary
- Key Insights
- Strategic Recommendations
- Action Items
"""

            response = await self.ollama_client.generate(
                prompt=f"Analyze these chat conversations and provide business recommendations:\n\n{chat_text[:2000]}...",  # Limit input size
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=1200
            )

            return {
                "recommendations": response,
                "analysis_timestamp": datetime.now().isoformat(),
                "chat_count": len(chat_data)
            }

        except Exception as e:
            logger.error(f"Error in recommendation generation: {str(e)}")
            return {"error": "Unable to generate recommendations at this time."}


class EventChatAgent(BaseAgent):
    """Specialized agent for answering event-related questions"""

    def __init__(self, ollama_client: OllamaClient):
        super().__init__(ollama_client)
        self.knowledge_base = settings.PAGUYUBAN_KNOWLEDGE
        self.indonesian_keywords = settings.INDONESIAN_KEYWORDS
        self.german_keywords = settings.GERMAN_KEYWORDS

    def detect_language(self, query: str) -> str:
        """Detect the language of the query using keyword matching"""
        query_lower = query.lower()

        # Count keyword matches for each language
        indonesian_count = sum(1 for keyword in self.indonesian_keywords if keyword in query_lower)
        german_count = sum(1 for keyword in self.german_keywords if keyword in query_lower)

        if indonesian_count > german_count:
            return "id"
        elif german_count > indonesian_count:
            return "de"
        else:
            return "en"

    def get_event_info(self, query: str, language: str = "en") -> str:
        """Get relevant event information based on query keywords"""
        query_lower = query.lower()

        # Date and timing questions
        if any(word in query_lower for word in ["when", "date", "time", "kapan", "waktu", "wann"]):
            dates = self.knowledge_base["event"]["dates"]
            return f"Paguyuban Messe 2026 will be held on {dates}."

        # Location questions
        if any(word in query_lower for word in ["where", "location", "venue", "place", "dimana", "lokasi", "wo"]):
            location = self.knowledge_base["event"]["location"]
            venue = self.knowledge_base["event"]["venue"]
            return f"The event will be held at {location} in {venue['main_hall']}."

        # Artist questions
        if any(word in query_lower for word in ["artist", "musician", "performer", "artis", "penyanyi", "sänger"]):
            artists = [f"{artist['name']} ({artist['genre']})" for artist in self.knowledge_base["artists"]]
            return f"Featured artists include: {', '.join(artists)}."

        # Pricing/sponsorship questions
        if any(word in query_lower for word in ["price", "cost", "fee", "harga", "biaya", "preis", "sponsorship", "sponsor"]):
            tiers = self.knowledge_base["sponsorship_tiers"]
            tier_info = [f"{tier['name']}: {tier['price']} ({', '.join(tier['benefits'])})" for tier in tiers]
            return f"Sponsorship tiers: {'; '.join(tier_info)}."

        # Attendance questions
        if any(word in query_lower for word in ["attendance", "people", "participants", "jumlah", "orang", "teilnehmer"]):
            attendance = self.knowledge_base["event"]["attendance"]
            return f"Expected attendance: {attendance['total']} participants, including {attendance['business']} business professionals."

        # Default response for unrecognized queries
        return self.get_general_info(language)

    def get_general_info(self, language: str = "en") -> str:
        """Get general event information"""
        event = self.knowledge_base["event"]
        return f"Paguyuban Messe 2026 is a business and entertainment event featuring {len(self.knowledge_base['artists'])} Indonesian artists. The event will be held on {event['dates']} at {event['location']} in {event['venue']['main_hall']}."

    def answer_question(self, query: str) -> str:
        """Main method to answer event-related questions"""
        # Detect language
        language = self.detect_language(query)

        # Get relevant information
        response = self.get_event_info(query, language)

        return response


class ProspectAnalyzer(BaseAgent):
    """Specialized agent for analyzing prospect conversations and generating recommendations"""

    def __init__(self, ollama_client: OllamaClient):
        super().__init__(ollama_client)
        self.sponsorship_tiers = settings.PAGUYUBAN_KNOWLEDGE["sponsorship_tiers"]

    def analyze_conversation(self, chat_logs: List[Dict[str, Any]], prospect_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyze prospect conversation and generate recommendations

        Args:
            chat_logs: List of chat messages with role and content
            prospect_data: Additional prospect information (name, company, etc.)

        Returns:
            Dictionary with analysis results, recommendations, and follow-ups
        """
        try:
            # Extract conversation text
            conversation_text = self._extract_conversation_text(chat_logs)

            # Analyze sentiment and intent
            sentiment_analysis = self._analyze_sentiment(conversation_text)

            # Extract prospect information
            extracted_info = self._extract_prospect_info(conversation_text, prospect_data)

            # Generate recommendations based on analysis
            recommendations = self._generate_recommendations(sentiment_analysis, extracted_info)

            # Create follow-up templates
            follow_ups = self._create_follow_up_templates(sentiment_analysis, extracted_info)

            # Determine next best action
            next_action = self._determine_next_action(sentiment_analysis, extracted_info)

            return {
                "recommendations": recommendations,
                "next_best_action": next_action,
                "prospect_summary": self._create_prospect_summary(extracted_info),
                "sentiment": sentiment_analysis["overall"],
                "follow_ups": follow_ups,
                "analysis_timestamp": datetime.now().isoformat(),
                "chat_count": len(chat_logs)
            }

        except Exception as e:
            logger.error(f"Error in prospect analysis: {str(e)}")
            return {
                "error": "Unable to analyze conversation at this time.",
                "recommendations": [],
                "next_best_action": "Manual review recommended",
                "prospect_summary": "Analysis failed",
                "sentiment": "unknown",
                "follow_ups": {},
                "analysis_timestamp": datetime.now().isoformat(),
                "chat_count": len(chat_logs)
            }

    def _extract_conversation_text(self, chat_logs: List[Dict[str, Any]]) -> str:
        """Extract conversation text from chat logs"""
        conversation_parts = []
        for log in chat_logs:
            role = log.get("role", "unknown")
            message = log.get("message", "")
            conversation_parts.append(f"{role}: {message}")

        return "\n".join(conversation_parts)

    def _analyze_sentiment(self, conversation_text: str) -> Dict[str, Any]:
        """Analyze sentiment and intent from conversation"""
        # Simple keyword-based sentiment analysis
        positive_keywords = ["interested", "good", "great", "excellent", "perfect", "yes", "definitely", "absolutely", "love", "like"]
        negative_keywords = ["expensive", "too much", "not sure", "maybe later", "no", "not interested", "concerns", "worried"]
        budget_keywords = ["budget", "cost", "price", "affordable", "investment", "roi", "return"]

        text_lower = conversation_text.lower()

        positive_count = sum(1 for keyword in positive_keywords if keyword in text_lower)
        negative_count = sum(1 for keyword in negative_keywords if keyword in text_lower)
        budget_count = sum(1 for keyword in budget_keywords if keyword in text_lower)

        # Determine overall sentiment
        if positive_count > negative_count:
            overall = "positive"
        elif negative_count > positive_count:
            overall = "negative"
        else:
            overall = "neutral"

        return {
            "overall": overall,
            "positive_indicators": positive_count,
            "negative_indicators": negative_count,
            "budget_discussion": budget_count > 0,
            "engagement_level": "high" if len(conversation_text.split()) > 50 else "low"
        }

    def _extract_prospect_info(self, conversation_text: str, prospect_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract prospect information from conversation and provided data"""
        extracted = {
            "name": prospect_data.get("name") if prospect_data else None,
            "company": prospect_data.get("company") if prospect_data else None,
            "email": prospect_data.get("email") if prospect_data else None,
            "phone": prospect_data.get("phone") if prospect_data else None,
            "interest": prospect_data.get("interest") if prospect_data else None,
            "budget": prospect_data.get("budget") if prospect_data else None,
            "inferred_interest": self._infer_interest(conversation_text),
            "inferred_budget": self._infer_budget(conversation_text),
            "pain_points": self._extract_pain_points(conversation_text)
        }

        return extracted

    def _infer_interest(self, conversation_text: str) -> str:
        """Infer prospect's interest from conversation"""
        text_lower = conversation_text.lower()

        if any(word in text_lower for word in ["sponsor", "sponsorship", "partner"]):
            return "Sponsorship partnership"
        elif any(word in text_lower for word in ["artist", "performance", "music"]):
            return "Artist performance"
        elif any(word in text_lower for word in ["networking", "business", "connect"]):
            return "Business networking"
        elif any(word in text_lower for word in ["event", "attend", "visit"]):
            return "Event attendance"
        else:
            return "General inquiry"

    def _infer_budget(self, conversation_text: str) -> Optional[str]:
        """Infer budget range from conversation"""
        text_lower = conversation_text.lower()

        if any(word in text_lower for word in ["€120,000", "120k", "platinum", "title"]):
            return "€120,000+"
        elif any(word in text_lower for word in ["€60,000", "60k", "gold"]):
            return "€60,000"
        elif any(word in text_lower for word in ["€40,000", "40k", "silver"]):
            return "€40,000"
        elif any(word in text_lower for word in ["€25,000", "25k", "bronze"]):
            return "€25,000"
        elif any(word in text_lower for word in ["€15,000", "15k"]):
            return "€15,000"
        elif "budget" in text_lower:
            return "Undisclosed (discussing budget)"
        else:
            return None

    def _extract_pain_points(self, conversation_text: str) -> List[str]:
        """Extract potential pain points or concerns"""
        pain_points = []
        text_lower = conversation_text.lower()

        if any(word in text_lower for word in ["expensive", "too much", "cost", "price", "budget"]):
            pain_points.append("Cost concerns")
        if any(word in text_lower for word in ["time", "busy", "schedule"]):
            pain_points.append("Time constraints")
        if any(word in text_lower for word in ["competition", "competitor", "other events"]):
            pain_points.append("Competition concerns")
        if any(word in text_lower for word in ["roi", "return", "value", "benefit"]):
            pain_points.append("ROI questions")

        return pain_points

    def _generate_recommendations(self, sentiment: Dict[str, Any], prospect_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate actionable recommendations based on analysis"""
        recommendations = []

        # Base recommendation based on sentiment
        if sentiment["overall"] == "positive":
            recommendations.append({
                "title": "Schedule sponsorship call",
                "description": f"High interest detected. Propose a 20-minute call to discuss {prospect_info['inferred_interest']} opportunities and ROI.",
                "priority": "high"
            })

            if prospect_info["company"]:
                recommendations.append({
                    "title": "Send tailored sponsorship deck",
                    "description": f"Share customized sponsorship package based on {prospect_info['company']}'s industry and interests.",
                    "priority": "high"
                })

        elif sentiment["overall"] == "negative":
            recommendations.append({
                "title": "Address concerns directly",
                "description": f"Acknowledge {', '.join(prospect_info['pain_points'])} and provide specific solutions or alternatives.",
                "priority": "high"
            })

            recommendations.append({
                "title": "Offer minimal commitment option",
                "description": "Present Bronze sponsorship tier (€15,000) or explore partnership alternatives.",
                "priority": "medium"
            })

        else:  # neutral
            recommendations.append({
                "title": "Provide comprehensive information",
                "description": "Send complete event overview, sponsorship tiers, and case studies for informed decision.",
                "priority": "medium"
            })

        # Add budget-specific recommendations
        if prospect_info["inferred_budget"]:
            budget = prospect_info["inferred_budget"]
            if "€120,000" in budget or "€60,000" in budget:
                recommendations.append({
                    "title": "Position premium benefits",
                    "description": "Highlight exclusive benefits like keynote speaking opportunities and VIP networking.",
                    "priority": "medium"
                })

        # Add interest-specific recommendations
        interest = prospect_info["inferred_interest"]
        if "Sponsorship" in interest:
            recommendations.append({
                "title": "Discuss long-term partnership",
                "description": "Explore multi-year commitment options and customized branding opportunities.",
                "priority": "low"
            })

        return recommendations

    def _create_follow_up_templates(self, sentiment: Dict[str, Any], prospect_info: Dict[str, Any]) -> Dict[str, Any]:
        """Create personalized follow-up templates"""
        name = prospect_info["name"] or "there"
        company = prospect_info["company"] or "your company"

        base_templates = {
            "email_positive": f"""Subject: Next steps for Paguyuban Messe partnership

Hi {name},

Thank you for your interest in Paguyuban Messe 2026! It was great discussing {prospect_info['inferred_interest']} opportunities with you.

Based on our conversation, I'd recommend we schedule a quick 20-minute call to explore how {company} could benefit from our sponsorship tiers. Would Tuesday 10:00 or Wednesday 14:00 work for you?

I've attached our sponsorship deck for your reference.

Best regards,
Paguyuban Messe Team""",

            "email_neutral": f"""Subject: Paguyuban Messe information & next steps

Hi {name},

Thank you for your interest in Paguyuban Messe 2026. I've attached our comprehensive event overview and sponsorship options for your consideration.

Based on {company}'s focus on {prospect_info['inferred_interest']}, I believe there could be good synergy with our event audience. Would you be open to a brief call to discuss potential partnership opportunities?

Best regards,
Paguyuban Messe Team""",

            "email_negative": f"""Subject: Addressing your concerns about Paguyuban Messe

Hi {name},

Thank you for sharing your thoughts about Paguyuban Messe. I understand your concerns about {', '.join(prospect_info['pain_points'])}.

To help address these points, I've outlined some flexible partnership options that might work better for {company}. Would you be open to a 15-minute call to discuss these alternatives?

No pressure - just want to ensure you have all the information needed to make the right decision.

Best regards,
Paguyuban Messe Team"""
        }

        # Add phone-specific templates if phone available
        if prospect_info["phone"]:
            base_templates.update({
                "whatsapp_positive": f"Hi {name}, thanks for discussing Paguyuban Messe partnership. Can we schedule a 20-min call? Tue 10:00 or Wed 14:00? I'll send a deck beforehand.",
                "whatsapp_neutral": f"Hi {name}, sharing a short overview of Paguyuban Messe sponsorship options. Want a quick call later this week?",
                "whatsapp_negative": f"Hi {name}, I understand your concerns. Can I share some flexible partnership options that might work better?"
            })
        else:
            base_templates.update({
                "whatsapp_positive": "",
                "whatsapp_neutral": "",
                "whatsapp_negative": ""
            })

        return base_templates

    def _determine_next_action(self, sentiment: Dict[str, Any], prospect_info: Dict[str, Any]) -> str:
        """Determine the next best action"""
        if sentiment["overall"] == "positive":
            if prospect_info["email"]:
                return "Send personalized sponsorship proposal with call scheduling"
            else:
                return "Request contact information and send initial proposal"
        elif sentiment["overall"] == "negative":
            return "Send detailed response addressing specific concerns"
        else:
            return "Send comprehensive event information and follow up in 3 days"

    def _create_prospect_summary(self, prospect_info: Dict[str, Any]) -> str:
        """Create a concise prospect summary"""
        parts = []

        if prospect_info["name"]:
            parts.append(f"Name: {prospect_info['name']}")

        if prospect_info["company"]:
            parts.append(f"Company: {prospect_info['company']}")

        parts.append(f"Interest: {prospect_info['inferred_interest']}")

        if prospect_info["inferred_budget"]:
            parts.append(f"Budget: {prospect_info['inferred_budget']}")

        if prospect_info["pain_points"]:
            parts.append(f"Concerns: {', '.join(prospect_info['pain_points'])}")

        return " | ".join(parts) if parts else "General inquiry"

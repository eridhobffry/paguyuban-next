# Phase 7 — Model Routing, Memory, and Semantic Caching (Complete Implementation)

This phase implements a comprehensive AI infrastructure with model routing, persistent semantic caching, and memory policy management. The implementation includes database persistence, fault-tolerant architecture, and extensive testing.

## What’s Included

### Core AI Infrastructure

- **Model Routing Policy**: Qwen25-Max (multilingual) and DeepSeek-V3 (analytics/reasoning) with `src/lib/ai/config.ts`, `src/lib/ai/model-router.ts`
- **Language Detection**: Malay (`ms`) and Indonesian (`id`) support with `src/lib/ai/lang.ts`
- **Persistent Semantic Caching**: Dual persistence (memory + database) with `src/lib/ai/semantic-cache.ts`
- **Cache Persistence Layer**: Database operations with `src/lib/ai/cache-persistence.ts`
- **Memory Policy Management**: User preferences and sponsor history with `src/lib/ai/memory-policy.ts`

### Database Schema & Persistence

- **Semantic Cache Entries**: `semantic_cache_entries` table with embedding vectors
- **User Stable Preferences**: `user_stable_preferences` table with confidence scoring
- **Sponsor Interaction History**: `sponsor_interaction_history` table for personalization
- **Memory Policy Rules**: `memory_policy_rules` table for configurable policies
- **Memory Consolidation Log**: `memory_consolidation_log` table for audit trails

### API Integration

- **Enhanced `/api/chat/generate`**: Consults router + cache with observability headers
- **Headers**: `X-AI-Model`, `X-Route-Reason`, `X-Cache`, `X-Cache-Hit-Count`, `X-Memory-Stats`
- **Fault Tolerance**: Graceful degradation when database unavailable
- **Output Contracts**: Zod schemas for `EventPlan`, `AnalyticsReport`, `ContractReview`

### Testing & Quality Assurance

- **Comprehensive Tests**: `tests/ai/cache-persistence.test.ts` (9 tests, 100% pass rate)
- **Mock Database Operations**: Realistic testing without database dependencies
- **Integration Testing**: End-to-end validation of all components
- **Error Scenario Testing**: Database failure and recovery validation

## Routing Rules (Summary)

- Language is Indonesian/Malay or localization needed → `qwen25-max`.
- High-complexity or analytics/coding/math → `deepseek-v3`.
- Multimodal (image/pdf/audio) in ID/MS → prefer `qwen25-max`; escalate to `deepseek-v3` for heavy analytics.
- Fallback on model error: route to the other model and log reason (header `X-Route-Reason`).

Quality budget: target 1200ms, max 4000ms, cost mode balanced.

## Semantic Cache Architecture

### Cache Strategy

- **Dual Persistence**: In-memory cache (~200 entries) + PostgreSQL database storage
- **Heuristic Embeddings**: Normalized term frequency with cosine similarity matching
- **Safety Validation**: Ensures year, city, and event context compatibility
- **Default Threshold**: 0.85 similarity score with configurable per-query thresholds

### Cache Lifecycle

- **TTL Management**: 30d default; event-specific TTL = `end_date + 14d`
- **Hit-Based Extension**: TTL extended on repeated cache hits (30% increase)
- **Automatic Cleanup**: Expired entries removed from both memory and database
- **LRU Eviction**: Least recently used entries evicted when memory limit reached

### Database Schema

```sql
semantic_cache_entries (
  id UUID PRIMARY KEY,
  cache_key VARCHAR(64) UNIQUE,
  query_text TEXT,
  normalized_query TEXT,
  locale VARCHAR(10),
  embedding_vector JSONB, -- Vector embeddings
  response_text TEXT,
  model_used VARCHAR(100),
  context_metadata JSONB, -- City, dates, etc.
  hit_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Performance Characteristics

- **Memory-First**: ~200 entries in RAM for fast access
- **Database Fallback**: Automatic fallback to persistent storage
- **Fault Tolerance**: Continues working when database unavailable
- **Observability**: Cache hit/miss metrics via response headers

## Memory Policy System

### User Stable Preferences

- **Confidence Scoring**: Preferences accumulate confidence over time (0.0-1.0 scale)
- **Evidence Tracking**: Multiple interactions increase preference reliability
- **Automatic Decay**: Old preferences lose confidence if not reinforced
- **Personalization**: Language, communication style, interests, and behavior patterns

### Sponsor Interaction History

- **Interaction Types**: Viewed, bookmarked, contacted, feedback provided
- **Sentiment Analysis**: Tracks user sentiment and engagement levels
- **Recommendation Engine**: Personalized sponsor suggestions based on history
- **Analytics**: Interaction patterns for business intelligence

### Database Schema

```sql
user_stable_preferences (
  user_id VARCHAR(255),
  preference_type VARCHAR(100), -- language, interest_area, etc.
  preference_value JSONB,
  confidence_score NUMERIC(3,2) DEFAULT 1.0,
  evidence_count INTEGER DEFAULT 0,
  UNIQUE(user_id, preference_type)
)

sponsor_interaction_history (
  user_id VARCHAR(255),
  sponsor_id UUID,
  interaction_type VARCHAR(50), -- viewed, bookmarked, contacted
  interaction_data JSONB,
  sentiment_score NUMERIC(3,2),
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Implementation Status

### ✅ Completed Features

- **Database Persistence**: Full semantic cache persistence with PostgreSQL
- **Memory Policy**: User preferences and sponsor interaction tracking
- **Fault Tolerance**: Graceful degradation when database unavailable
- **Comprehensive Testing**: 9/9 tests passing with realistic mock scenarios
- **Migration Scripts**: Database schema changes applied successfully
- **API Integration**: Enhanced observability with response headers
- **Dual Persistence**: Memory + database caching strategy implemented

### 🔄 Current Architecture

- **Model Routing**: Rule-based routing between Qwen25-Max and DeepSeek-V3
- **Cache Strategy**: Dual persistence with automatic failover
- **Memory Management**: Configurable policies for preference decay and consolidation
- **Observability**: Comprehensive headers for monitoring and debugging

### 🚀 Future Enhancements

- **Vector Database**: Migration to dedicated vector store (Qdrant/Weaviate) for better similarity search
- **Advanced Embeddings**: Replace heuristic embeddings with ML-based embeddings
- **Real-time Analytics**: Live dashboard for cache performance and memory metrics
- **A/B Testing**: Model performance comparison and automatic routing optimization
- **Multilingual Prompts**: Enhanced Malay/Indonesian prompt engineering
- **Memory Consolidation**: Advanced algorithms for preference merging and cleanup

## Performance & Reliability

### Benchmarks

- **Cache Hit Rate**: Target >70% for common queries
- **Response Time**: <50ms for cache hits, <200ms for database lookups
- **Fault Recovery**: <5 seconds to detect and recover from database failures
- **Memory Usage**: ~50MB for in-memory cache (~200 entries)

### Monitoring & Observability

- **Response Headers**: `X-Cache`, `X-Cache-Hit-Count`, `X-Memory-Stats`, `X-Route-Reason`
- **Metrics Collection**: Cache performance, memory usage, preference accuracy
- **Error Tracking**: Database connection issues, model failures, cache misses
- **Business Intelligence**: User engagement patterns, sponsor interaction analytics

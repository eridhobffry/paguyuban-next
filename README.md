# 📚 Paguyuban Messe 2026 - Unified Documentation Hub

## 🎯 Welcome to the Paguyuban Messe 2026 Project

This is the official website and sponsorship platform for the Paguyuban Messe 2026 event. The project has successfully transitioned from initial development to a production-ready state with comprehensive admin functionality and testing infrastructure.

## 📊 Current Project Status

### Sprint 2: 95% Complete ✅

- **Status**: Ready for final QA → Production deployment
- **Next**: Execute manual tests → Start Sprint 3
- **Website**: Production-ready for sponsor outreach
- **CMS**: Functional for Financial, Speakers, Artists, Documents
- **Testing**: 67+ automated test cases with comprehensive coverage

## 📋 Documentation Navigation

### 🎯 Primary Hub: `docs/` Folder

**Agent-Friendly Structure** - All documentation organized in focused folders

```
📂 docs/
├── 📄 README.md                           # Main navigation hub
├── 📂 sprints/                           # Sprint planning & status
│   ├── 📄 current-sprint-2-status.md     # Live Sprint 2 progress
│   └── 📄 sprint-3-planning.md           # Sprint 3 roadmap
├── 📂 components/                        # Technical planning
│   └── 📄 refactoring-roadmap.md        # Component refactor plan
├── 📂 testing/                          # Quality assurance
│   └── 📄 manual-qa-guide.md           # Manual test cases
├── 📂 archive/                          # Historical record
│   └── 📄 project-archive.md           # Complete project history
└── 📄 GEMINI_USAGE.md                   # AI integration details
```

### 🤖 Agent Quick Access

| What you need   | Go to                                     | Purpose                      |
| --------------- | ----------------------------------------- | ---------------------------- |
| Current Status  | `docs/sprints/current-sprint-2-status.md` | Live progress (95% complete) |
| Next Sprint     | `docs/sprints/sprint-3-planning.md`       | Sprint 3 objectives          |
| Manual QA       | `docs/testing/manual-qa-guide.md`         | Final Sprint 2 requirements  |
| Component Work  | `docs/components/refactoring-roadmap.md`  | Technical refactoring plan   |
| Project History | `docs/archive/project-archive.md`         | Complete historical record   |
| AI Features     | `docs/GEMINI_USAGE.md`                    | Chatbot integration          |

## 🎯 Key Information at a Glance

### Admin Access (Super Admin)

- **Email**: `eridhobffry@gmail.com`
- **Password**: `Aabbcc1!`
- **Access**: Full system administration and user management

### Website Features

- **Authentication**: JWT-based with role-based access control
- **CMS**: Dynamic content management for all major sections
- **Analytics**: Comprehensive user behavior tracking
- **Testing**: Automated testing with 67+ test cases

### Sprint 3 Priorities

1. **Knowledge Overlay CMS** - Dynamic chatbot knowledge management
   - File: `docs/sprints/sprint-3-planning.md`
2. **Agenda CMS MVP** - Event agenda with speaker assignments
   - File: `docs/sprints/sprint-3-planning.md`
3. **Sponsors CMS** - Complete dynamic sponsor logo management
   - File: `docs/sprints/sprint-3-planning.md`
4. **Component Refactoring** - Break down oversized components
   - File: `docs/components/refactoring-roadmap.md`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL (via Neon)
- Python 3.9+ (for AI service)
- Ollama (for local LLM serving)
- Docker (optional, for Qdrant vector database)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd paguyuban-next

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:push

# Install Python AI service dependencies (optional, for local AI development)
cd ai
pip install -r requirements.txt
cd ..
```

## 🚀 Deployment Architecture

This project uses a **split deployment strategy** for optimal performance and cost efficiency:

### Architecture Overview

- **Frontend (Next.js)**: Deployed to Vercel (handles API routes and UI)
- **AI Service (Python)**: Deployed to Hugging Face Spaces (handles LLM inference and RAG)
- **Database**: PostgreSQL via Neon
- **Vector Store**: Qdrant (for embeddings and RAG)

### Local Development Setup

#### Option 1: Docker Compose (Recommended)

```bash
# Start all services (Next.js, Python AI, Ollama, Qdrant, PostgreSQL)
docker-compose up

# Services will be available at:
# - Next.js: http://localhost:3000
# - Python AI: http://localhost:8001
# - Ollama: http://localhost:11434
# - Qdrant: http://localhost:6333
# - PostgreSQL: localhost:5432
```

#### Option 2: Manual Setup

```bash
# Terminal 1: Start PostgreSQL (if not using Docker)
# Terminal 2: Start Ollama
ollama serve

# Terminal 3: Start Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Terminal 4: Start Python AI service
cd ai
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8001

# Terminal 5: Start Next.js
npm run dev
```

### Production Deployment

#### 1. Deploy Next.js to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard:
# - AI_SERVICE_URL=https://your-hf-space.hf.space
# - DATABASE_URL=your-neon-database-url
```

#### 2. Deploy Python AI to Hugging Face Spaces

```bash
# Create a new Hugging Face Space
# - Go to https://huggingface.co/spaces
# - Create new Space with Docker
# - Upload the /ai folder contents
# - The Dockerfile is already configured
```

#### 3. Environment Configuration

**Next.js (.env.local):**

```bash
AI_SERVICE_URL=http://localhost:8001  # Local development
# AI_SERVICE_URL=https://your-space.hf.space  # Production
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
```

**Python AI (ai/.env):**

```bash
OLLAMA_BASE_URL=http://localhost:11434
QDRANT_URL=http://localhost:6333
```

### Service Architecture

```
┌─────────────────┐    HTTP     ┌─────────────────┐
│   Next.js App   │────────────▶│  Python AI API  │
│   (Vercel)      │             │ (HF Spaces)     │
│                 │             │                 │
│ - API Routes    │             │ - Conversational│
│ - UI Components │             │   Search Agent  │
│ - Auth          │             │ - Event Creator │
│ - CMS           │             │ - Moderation    │
└─────────────────┘             └─────────────────┘
         │                              │
         │                              │
         ▼                              ▼
┌─────────────────┐    ┌─────────────────┐
│  PostgreSQL     │    │    Ollama       │
│   (Neon)        │    │   (Local/Cloud) │
└─────────────────┘    └─────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐    ┌─────────────────┐
│   Drizzle ORM   │    │   Qdrant        │
│                 │    │  Vector Store   │
└─────────────────┘    └─────────────────┘
```

### AI Features

- **Conversational Search**: Natural language event queries with RAG
- **Event Creation**: AI-assisted event planning with multilingual support
- **Content Moderation**: Toxicity filtering and safety checks
- **Analytics**: Chat summaries and admin recommendations

### Cost Optimization

- **Local AI**: ~80% cheaper than cloud LLM APIs
- **Split Deployment**: Independent scaling of frontend and AI
- **Caching**: Intelligent response caching for frequent queries

### AI Service Setup (Python Backend)

The project now includes a Python-based AI service that replaces Gemini API calls with local open-source models for enhanced privacy and cost savings.

#### 1. Install Ollama (Local LLM Server)

```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the Qwen2.5-7B-Instruct model
ollama pull qwen2.5:7b-instruct

# Verify installation
ollama list
```

#### 2. Set Up Python Environment

```bash
# Navigate to AI service directory
cd ai

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Configure AI Service

```bash
# Copy environment template
cp env.example .env

# Edit .env with your settings (optional - defaults should work)
nano .env
```

#### 4. Set Up Vector Database (Qdrant)

```bash
# Using Docker (recommended)
docker run -p 6333:6333 -v qdrant_data:/qdrant/storage qdrant/qdrant

# Or install Qdrant locally
# See: https://qdrant.tech/documentation/quick-start/
```

#### 5. Start AI Service

```bash
# From ai/ directory with virtual environment activated
python app.py

# Service will be available at: http://localhost:8001
# Health check: http://localhost:8001/health
```

#### 6. Update Next.js Configuration

```bash
# In your Next.js .env.local file, add:
AI_SERVICE_URL=http://localhost:8001
```

## 🚀 Deployment Architecture

### Vercel Deployment (Next.js Frontend)

```bash
# Deploy Next.js to Vercel
npm run build
# Deploy via Vercel CLI or GitHub integration
```

### Python AI Service Deployment

**⚠️ Important**: The Python AI service **cannot** run on Vercel. Deploy separately:

#### Option 1: Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy Python service
cd ai
railway init
railway up
```

#### Option 2: DigitalOcean App Platform

- Connect GitHub repository
- Select `/ai` as source directory
- Configure Python runtime
- Set environment variables

#### Option 3: AWS/Heroku/Google Cloud

- Heroku: `git push heroku main`
- AWS: Use Elastic Beanstalk or ECS
- Google Cloud: Use Cloud Run

### Production Environment Variables

```bash
# Next.js (.env.local)
AI_SERVICE_URL=https://your-python-service.com

# Python Service (.env)
OLLAMA_BASE_URL=http://your-ollama-server:11434
QDRANT_URL=http://your-qdrant-server:6333
```

## 🧪 Testing & CI/CD

### Python AI Service Testing

```bash
cd ai

# Run tests
python -m pytest

# Run with coverage
python -m pytest --cov=. --cov-report=html

# Type checking
mypy .

# Linting
flake8 .
black .
```

### GitHub Actions CI/CD

The project includes comprehensive CI/CD:

- **Next.js**: Existing Vercel deployment
- **Python AI**: Custom GitHub Actions workflow (`.github/workflows/python-ai-ci.yml`)

**Python CI Features:**

- Automated testing with pytest
- Code coverage reporting
- Security scanning (safety, bandit)
- Type checking (myppy)
- Linting (flake8, black)
- Dependency vulnerability checks

### Development Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:3001)
npm run build           # Production build
npm run start           # Start production server

# Testing & Quality
npm test                # Run all tests (67+ automated tests)
npm run test:unit       # Unit tests only
npm run test:e2e        # End-to-end tests
npm run lint            # Code linting
npm run type-check      # TypeScript validation

# QA & Validation
npm run test:ics        # Validate calendar event format
npm run test:qa         # Automated QA checks
npm run smoke           # API and download smoke tests
```

## 🏗️ Architecture Overview

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript + Python
- **Database**: PostgreSQL + Drizzle ORM
- **AI Service**: Python FastAPI + Ollama + Qdrant
- **Authentication**: JWT + bcrypt
- **Testing**: Vitest + React Testing Library + Playwright
- **Styling**: Tailwind CSS + shadcn/ui

### Key Features

- **Role-Based Access Control**: super_admin, admin, member roles
- **Dynamic CMS**: Content management for all major website sections
- **AI-Powered Chat**: Local LLM (Qwen2.5) with RAG for event queries
- **Multilingual Support**: Indonesian/English/German conversation handling
- **Content Moderation**: Toxicity filtering and safety checks
- **Vector Search**: Semantic search across event data and knowledge base
- **Analytics**: Comprehensive user behavior tracking and reporting
- **Automated Testing**: 67+ tests covering security, functionality, and UX
- **Mobile Responsive**: Cross-platform compatibility

### File Structure

```
src/
├── app/                 # Next.js App Router
│   ├── admin/          # Admin dashboard pages
│   ├── api/            # API routes with Zod validation
│   └── (public)/       # Public website pages
├── components/         # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── sections/       # Homepage sections
│   └── ui/             # Base UI components
├── lib/                # Business logic & utilities
├── types/              # TypeScript definitions
├── hooks/              # Custom React hooks
└── db/                 # Database schemas & migrations

ai/                     # Python AI Service
├── app.py             # FastAPI application
├── config.py          # Configuration management
├── ollama_client.py   # Ollama LLM client
├── embeddings.py      # Sentence transformers
├── guardrails.py      # Content moderation
├── rag.py            # Vector search & RAG
├── agents.py         # AI agents (chat, analytics, etc.)
├── requirements.txt   # Python dependencies
└── env.example       # Environment template

tests/                  # Comprehensive test suite
├── lib/               # Unit tests for utilities
├── api/               # API endpoint tests
├── components/        # Component tests
└── e2e/               # End-to-end tests

docs/                  # Technical documentation
public/                # Static assets
```

## 🎯 Sprint 2 Completion (In Progress)

To complete Sprint 2 and prepare for Sprint 3:

1. **Execute Manual QA Tests** - Run test cases from `MANUAL_TESTING_GUIDE.md`
2. **Fix Minor Issues** - Address any critical bugs found during testing
3. **Merge to Main** - Deploy enhanced functionality to production
4. **Sprint 3 Planning** - Begin CMS Extensions & Component Refactoring

## 📞 Support & Resources

### Documentation Navigation

- **Main Hub**: `docs/README.md` - Agent-friendly navigation center
- **Current Work**: `docs/sprints/current-sprint-2-status.md` - Sprint 2 completion status
- **Next Steps**: `docs/sprints/sprint-3-planning.md` - Sprint 3 planning
- **QA Guide**: `docs/testing/manual-qa-guide.md` - Manual testing instructions
- **Project History**: `docs/archive/project-archive.md` - Complete historical record

### Key Contacts

- **Project Admin**: eridhobffry@gmail.com
- **Technical Lead**: Development team

### Development Workflow

1. **Planning**: Review `NEXT_SPRINT_PLAN.md` for upcoming objectives
2. **Development**: Follow component refactoring plan in `NEXT_SPRINT_COMPONENT_REFACTOR_PLAN.md`
3. **Testing**: Run comprehensive test suite (67+ automated tests)
4. **QA**: Execute manual tests from `MANUAL_TESTING_GUIDE.md`
5. **Deployment**: Merge to main and deploy to production

---

**🎉 The project is production-ready and well-documented!**

See `docs/README.md` for the complete agent-friendly documentation hub with current status, sprint plans, and historical archive.

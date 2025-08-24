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

# Start development server
npm run dev
```

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
- **Language**: TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: JWT + bcrypt
- **Testing**: Vitest + React Testing Library + Playwright
- **Styling**: Tailwind CSS + shadcn/ui

### Key Features

- **Role-Based Access Control**: super_admin, admin, member roles
- **Dynamic CMS**: Content management for all major website sections
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

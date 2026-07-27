# Reference / SoloCRM

A private knowledge and reference system alongside an engineering consultancy CRM. Built with Next.js 14, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

## Features

- **Private Knowledge**: Frictionless capture, recent notes, full-text search, note view, and editing
- **Dashboard**: Overview of open opportunities, pipeline value, overdue tasks, and recent activity
- **Pipeline Management**: Kanban-style board to track opportunities through 8 stages
- **Companies**: Manage client companies with industry, regulatory, and contact information
- **Contacts**: Track professional contacts with relationship types and influence levels
- **Opportunities**: Comprehensive opportunity management with financial tracking, regulatory drivers, and services offered
- **Tasks**: Task management with priority levels, due dates, and smart grouping
- **Activities**: Complete activity log (calls, emails, meetings, proposals, etc.)
- **Responsive Design**: Works on desktop and tablet with a clean, professional interface

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (local or cloud)

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd solo-crm
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and set your PostgreSQL connection string:
```
DATABASE_URL="postgresql://user:password@localhost:5432/solo_crm"
SESSION_SECRET="generate-with-openssl-rand-hex-32"
```

4. Apply database migrations:
```bash
npx prisma migrate deploy
```

`npm run db:seed` deletes existing application data before creating sample data. Never run it against a database you need to preserve.

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication

Users sign in with their email and PBKDF2-hashed password. Sessions use an HTTP-only, HMAC-signed cookie with a server-verified expiry. Create the first local admin through the seed script only on a disposable database, or use an existing production account.

The application includes sample data for a freelance engineering consultant with:
- 5 client companies (Altitude Systems, MedSafe Technologies, Neptune Defence Systems, Vitaflow Medical, GridEdge Renewables)
- 6 contacts across these companies
- 5 opportunities in various pipeline stages
- 6 tasks with different priorities and due dates
- 5 activity records showing interactions

## Project Structure

```
solo-crm/
├── app/                      # Next.js app router
│   ├── api/                  # API routes
│   ├── dashboard/            # Dashboard page
│   ├── pipeline/             # Pipeline/kanban board
│   ├── companies/            # Companies management
│   ├── contacts/             # Contacts management
│   ├── opportunities/        # Opportunities management
│   ├── tasks/                # Tasks management
│   ├── activities/           # Activities log
│   ├── layout.tsx            # Root layout with sidebar
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── layout/               # Sidebar & top bar
│   ├── dashboard/            # Dashboard widgets
│   ├── pipeline/             # Pipeline components
│   ├── companies/            # Company components
│   ├── contacts/             # Contact components
│   ├── opportunities/        # Opportunity components
│   ├── shared/               # Reusable components
│   └── tasks/                # Task components
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── constants.ts          # Enums and label mappings
│   └── utils.ts              # Utility functions
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed data script
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio (visual DB editor)
- `npm run db:migrate` - Create and run migrations

## Key Features Implemented

### Dashboard
- Real-time stats: open opportunities, weighted pipeline value, overdue tasks, follow-ups due
- Pipeline breakdown by stage
- Recent activity feed with activity types and timestamps
- Upcoming tasks grouped by urgency

### Pipeline (Kanban)
- 8 opportunity stages: New Lead → Negotiation → Won/Lost
- Cards show title, company, value, and probability
- Visual stage organization

### Companies
- Search and filter functionality
- Industry and company type categorization
- Regulatory environment tracking
- Contact and opportunity counts

### Contacts
- Comprehensive contact information
- Relationship types: Cold, Warm, Referral, Past Client, Current Client, Partner
- Influence levels: Decision Maker, Influencer, Technical Evaluator, Procurement, Unknown
- Last contact and next follow-up tracking with overdue highlighting

### Opportunities
- Full opportunity lifecycle tracking
- Multiple services: Reliability Engineering, RAMS, ILS, FMEA, FMECA, FHA, Safety Analysis, etc.
- Regulatory framework support: EASA, FAA, FDA, EU MDR, IEC standards, DEF STAN, etc.
- Weighted pipeline calculations (value × probability)
- Activity timeline for each opportunity

### Tasks
- Intelligent task grouping: Overdue, Due Today, This Week, Later, Completed
- Priority levels: Low, Medium, High, Urgent
- Quick mark-complete functionality
- Due date tracking with relative date formatting

### Activities
- Activity type tracking: Email, Call, Meeting, LinkedIn, Proposals, Notes, etc.
- Activity timeline with visual indicators
- Links to contacts and opportunities

## Database Schema

The Prisma schema includes:

- **User**: Single user per instance (MVP hardcoded user_1)
- **Company**: Client companies with industry and regulatory info
- **Contact**: Professional contacts with relationship and influence tracking
- **Opportunity**: Sales opportunities with full details, services, and regulatory drivers
- **Activity**: Interaction logging (calls, emails, meetings, etc.)
- **Task**: Action items with priority and status
- **Note**: General notes attached to entities
- **Tag**: User-defined tags for companies, contacts, and opportunities

## Design System

- **Color Palette**: Slate gray base with indigo accents
- **Sidebar**: Slate-800 (dark) with white text navigation
- **Main Content**: White background with subtle shadows
- **Badges**: Color-coded by type (stage, relationship, priority, etc.)
- **Typography**: Clean sans-serif with semantic hierarchy

## API Routes

Routes require a signed session unless explicitly documented as a token- or secret-protected integration:

- `GET/POST /api/knowledge` - Private recent notes, search, and capture
- `GET/PUT /api/knowledge/[id]` - Private note view and editing
- `GET/POST /api/companies` - List and create companies
- `GET/PUT/DELETE /api/companies/[id]` - Company detail operations
- `GET/POST /api/contacts` - List and create contacts
- `GET/PUT/DELETE /api/contacts/[id]` - Contact detail operations
- `GET/POST /api/opportunities` - List and create opportunities
- `GET/PUT/DELETE /api/opportunities/[id]` - Opportunity detail operations
- `GET/POST /api/tasks` - List and create tasks
- `GET/PUT/DELETE /api/tasks/[id]` - Task detail operations
- `GET/POST /api/activities` - List and create activities
- `GET/PUT/DELETE /api/activities/[id]` - Activity detail operations
- `GET /api/dashboard` - Dashboard stats and aggregations

## Notes

- All data is stored in PostgreSQL via Prisma ORM
- Knowledge records are always scoped to the signed-in active user
- The application has responsive navigation for desktop and mobile use
- No external authentication provider is configured
- Database timestamps use UTC (createdAt, updatedAt fields)

## Future Enhancements

- User authentication and multi-user support
- Real-time notifications
- Advanced reporting and analytics
- Custom fields and workflows
- API documentation and third-party integrations
- Mobile app support
- Email notification triggers
- Automated activity logging from email/calendar

## Development Tips

1. Use `npm run db:studio` to inspect and modify database records visually
2. Check the Prisma schema in `prisma/schema.prisma` for data relationships
3. All components use TypeScript for type safety
4. CSS is purely Tailwind - no custom CSS files needed
5. API routes follow REST conventions and return JSON

## License

This project is provided as-is for personal use.

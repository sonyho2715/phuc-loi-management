# Phúc Lợi Management System

AI-powered business management system for Công ty TNHH Phúc Lợi, a cement distribution company in Hai Phong, Vietnam.

## Project Overview

- **Industry**: Bulk cement (xi măng rời) distribution to concrete mixing stations
- **Location**: Hai Phong, Northern Vietnam
- **Purpose**: "Real books" tracking system for transactions without invoices

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL on Railway
- **ORM**: Prisma
- **Auth**: NextAuth.js v5 (beta)
- **AI**: Claude API (Anthropic)
- **Charts**: Recharts

## Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="generate with: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."
```

## Default Login

After seeding, use:
- Email: admin@phucloi.vn
- Password: admin123

## Key Features

1. **Dashboard Analytics**
   - Revenue metrics
   - Debt overview
   - Stock summary
   - Charts (revenue trend, top debtors)

2. **Customer Management**
   - CRUD operations
   - Customer types (mixing station, reseller, project)
   - Credit limits and payment terms
   - Purchase history and debt tracking

3. **Supplier Management**
   - Supplier CRUD
   - Cement brands tracking
   - Purchase history

4. **Inventory Management**
   - Purchase tracking (nhập hàng)
   - Sales tracking (xuất hàng)
   - Stock calculation by cement type

5. **Debt Management**
   - Receivables (công nợ phải thu)
   - Payables (công nợ phải trả)
   - Aging analysis
   - Payment recording

6. **AI Assistant**
   - Vietnamese natural language queries
   - Business intelligence queries
   - Context-aware responses

## User Roles

- `OWNER`: Full access, can see special expenses
- `ACCOUNTANT`: Data entry, limited queries
- `SALES`: Customer and order management
- `VIEWER`: Read-only dashboard access

## Project Structure

```
app/
├── (auth)/          # Login pages
├── (dashboard)/     # Main app pages
│   ├── customers/   # Customer CRUD
│   ├── suppliers/   # Supplier CRUD
│   ├── inventory/   # Purchases/Sales
│   ├── debts/       # Receivables/Payables
│   ├── ai-assistant/# AI chat interface
│   └── reports/     # Report generation
├── api/             # API routes
│   └── ai/          # Claude API integration
components/
├── ui/              # shadcn/ui components
├── forms/           # Form components
├── charts/          # Recharts components
├── dashboard/       # Dashboard widgets
├── ai/              # AI chat components
└── layout/          # Layout components
lib/
├── db.ts            # Prisma client
├── auth.ts          # NextAuth config
├── formatters.ts    # Vietnamese formatters
├── i18n/            # Translations
├── ai/              # AI prompts and processing
└── validations/     # Zod schemas
```

## Vietnamese Language

All UI text is in Vietnamese. Key terms:
- Công nợ = Debt
- Phải thu = Receivables
- Phải trả = Payables
- Nhập hàng = Purchases
- Xuất hàng = Sales
- Trạm trộn bê tông = Concrete mixing station
- Xi măng rời = Bulk cement

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio
```

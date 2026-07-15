# VuleraOS Setup Guide

## Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **PostgreSQL** 15+ (or Docker for local development)
- **npm** or **yarn**

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/NickGwanzura/vuleraos.git
cd vuleraos
npm install
```

### 2. Database Setup

**Option A: Docker (recommended for local dev)**
```bash
docker run -d \
  --name vuleraos-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vuleraos \
  -p 5432:5432 \
  postgres:16
```

**Option B: Existing PostgreSQL**
Ensure you have PostgreSQL running and create a database:
```bash
createdb vuleraos
```

### 3. Configure Environment

Copy the `.env` file and adjust if needed:
```bash
# .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vuleraos?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

### 4. Push Schema & Seed Data

```bash
npx prisma db push
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit **http://localhost:3000**

### 6. Login with Demo Account

| Role | Email | Password |
|---|---|---|
| Owner | admin@mbaretraders.co.zw | password123 |
| Cashier | cashier@mbaretraders.co.zw | password123 |
| Accountant | accountant@mbaretraders.co.zw | password123 |

## Deployment

### Railway / Render

1. Connect your GitHub repository
2. Set the build command: `npm run build`
3. Set the start command: `npm start`
4. Add environment variables (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET)
5. Provision a PostgreSQL database add-on

### Self-Hosted (Docker)

```bash
docker build -t vuleraos .
docker run -p 3000:3000 -e DATABASE_URL="..." -e NEXTAUTH_SECRET="..." vuleraos
```

## Project Structure

```
vuleraos/
├── src/
│   ├── app/           # Next.js App Router pages and API routes
│   ├── components/    # Reusable UI components
│   └── lib/           # Business logic (auth, prisma, tax, currency, etc.)
├── prisma/            # Database schema and migrations
├── docs/              # Documentation
└── electron/          # Desktop app (future)
```

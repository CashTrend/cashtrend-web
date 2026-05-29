# AGENTS.md — CashTrend Web Application Context

> This document provides comprehensive context about the CashTrend web application for AI agents, copilots, and automated tools that need to understand, navigate, or contribute to this codebase.

---

## 1. Project Overview

**CashTrend** is a personal finance portfolio tracker that allows users to manage stocks, ETFs, and cash flow in one place. This repository (`cashtrend-web`) is the **frontend** application — a Next.js web client that communicates with a separate Django REST Framework backend via API proxy.

### Core Features

- **Authentication** — Firebase Auth (client-side) + Django JWT tokens (backend session)
- **Portfolio Management** — Track BUY/SELL transactions for stocks/ETFs and INCOME/EXPENSE for cash flow
- **Portfolio Summary** — View holdings, P&L (profit/loss), liquidity, and total invested value
- **Ticker Search & Detail** — Search for financial instruments, view financial ratios, price history, income statements, balance sheets, and cash flow statements
- **Charts** — Interactive price history charts with configurable granularity (1D, 1W, 1M, 1Y, ALL)
- **Dark/Light Theme** — System-aware theme toggle via `next-themes`
- **Internationalization (i18n)** — English and Spanish translations

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| Language | TypeScript | 5.9+ |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | 4.3+ |
| Forms | React Hook Form + Zod validation | 7.76+ / 4.4+ |
| Charts | Recharts | 3.8+ |
| Auth (Client) | Firebase Auth | 12.13+ |
| Auth (Backend) | JWT (access + refresh tokens) | — |
| Decimal Math | decimal.js | 10.6+ |
| Icons | Lucide React | 1.16+ |
| Theming | next-themes | 0.4+ |
| Package Manager | pnpm | 9.15.4 |
| Node.js | ≥ 20.0.0 | — |
| Linting | ESLint + Prettier | 9.x / 3.x |
| Git Hooks | Husky + lint-staged | 9.x / 16.x |
| Deployment | Vercel | — |

---

## 3. Project Structure

```
cashtrend-web/
├── app/                        # Next.js App Router pages & layouts
│   ├── (auth)/                 # Auth route group (login, register)
│   │   ├── layout.tsx          # Auth-specific layout (no sidebar)
│   │   ├── login/              # Login page
│   │   └── register/           # Register page
│   ├── (dashboard)/            # Protected dashboard route group
│   │   ├── layout.tsx          # Dashboard layout (sidebar + header)
│   │   ├── loading.tsx         # Dashboard loading state
│   │   ├── page.tsx            # Main dashboard page (portfolio summary)
│   │   ├── portfolio/          # Portfolio/transactions pages
│   │   └── tickers/            # Ticker detail pages
│   ├── api/                    # Next.js Route Handlers
│   │   └── auth/               # Auth API routes (cookie mgmt, refresh)
│   ├── globals.css             # Global Tailwind CSS styles
│   └── layout.tsx              # Root layout (ThemeProvider)
├── components/                 # Reusable React components
│   ├── dashboard/              # Dashboard-specific components
│   ├── layout/                 # App shell (Header, Sidebar, ThemeToggle)
│   ├── portfolio/              # Portfolio components (TransactionForm, etc.)
│   ├── tickers/                # Ticker components (Charts, Financials, etc.)
│   └── ui/                     # Base UI primitives (Button, Card, Input, etc.)
├── context/                    # React Context providers
│   ├── auth-context.tsx        # Auth state & actions (user, logout)
│   └── locale-context.tsx      # i18n locale management
├── lib/                        # Shared utilities & configuration
│   ├── auth/                   # Firebase configuration & helpers
│   │   ├── firebase.ts         # Firebase app initialization
│   │   ├── firebase-helpers.ts # Firebase auth helper functions
│   │   └── session.ts          # Session/cookie management
│   ├── i18n/                   # Internationalization
│   │   ├── en.json             # English translations
│   │   ├── es.json             # Spanish translations
│   │   └── types.ts            # i18n type definitions
│   ├── types/                  # TypeScript type definitions
│   │   ├── AuthTypes.ts        # Auth domain types
│   │   ├── PortfolioTypes.ts   # Portfolio/transaction domain types
│   │   ├── TickerTypes.ts      # Ticker/market data domain types
│   │   └── index.ts            # Re-export barrel file
│   └── utils.ts                # General utility functions (cn, etc.)
├── services/                   # API service layer
│   ├── http.ts                 # Core HTTP client (auth, retry, proxy)
│   ├── auth.service.ts         # Auth endpoints (login, register, refresh)
│   ├── portfolio.service.ts    # Portfolio endpoints (CRUD transactions, summary)
│   └── tickers.service.ts      # Ticker endpoints (search, detail, history, financials)
├── next.config.ts              # Next.js config (API proxy rewrites)
├── vercel.json                 # Vercel deployment config
├── tsconfig.json               # TypeScript configuration
├── eslint.config.mjs           # ESLint config
├── prettier.config.js          # Prettier config
├── postcss.config.mjs          # PostCSS config (Tailwind)
├── package.json                # Dependencies & scripts
├── pnpm-workspace.yaml         # pnpm workspace config
└── pnpm-lock.yaml              # Lockfile
```

---

## 4. Architecture & Data Flow

### 4.1 Authentication Flow

```
User → Firebase Auth (email/password) → Firebase UID
     → Backend POST /api/users/login { user_auth_id } → JWT { access, refresh }
     → Access token stored in memory (module-level variable)
     → Refresh token stored in httpOnly cookie (via Route Handler)
```

- **Firebase** handles identity verification (client-side)
- **Django backend** issues JWT tokens after verifying the Firebase UID
- **Access token** is kept in-memory only (never in localStorage/sessionStorage)
- **Refresh token** is in an httpOnly cookie managed by Next.js Route Handlers
- On 401 responses, the HTTP client automatically attempts a silent token refresh

### 4.2 API Proxy Pattern

```
Browser → /api/proxy/* (same-origin) → Next.js Rewrite → Django backend (http://127.0.0.1:8000)
```

All API calls from the browser go through the Next.js rewrite proxy at `/api/proxy/*`, eliminating CORS issues entirely. The actual backend URL is configured via the `BACKEND_URL` environment variable.

### 4.3 Service Layer

The `services/` directory provides a typed API client:

- **`http.ts`** — Core HTTP wrapper with automatic auth headers, token refresh on 401, and typed methods (`get`, `post`, `put`, `patch`, `del`)
- **`auth.service.ts`** — Login, register, token refresh
- **`portfolio.service.ts`** — Portfolio summary, transaction CRUD
- **`tickers.service.ts`** — Ticker search, detail, history, financials

### 4.4 State Management

- **AuthContext** — Provides `user` object and `logout()` action to all dashboard components
- **LocaleContext** — Provides current locale and translation function `t()`
- No external state management library (React Context + local state only)

---

## 5. Key Domain Concepts

### 5.1 Transactions

| Type | Fields | Notes |
|------|--------|-------|
| BUY | ticker, quantity, price_per_unit, date | `amount` is auto-computed by backend |
| SELL | ticker, quantity, price_per_unit, date | `amount` is auto-computed by backend |
| INCOME | amount, date | No ticker/quantity/price fields |
| EXPENSE | amount, date | No ticker/quantity/price fields |

### 5.2 Portfolio Summary

- **total_liquidity** — Net cash (INCOME − EXPENSE − BUY costs + SELL proceeds)
- **total_invested** — Capital in open positions
- **total_current_value** — Market value of all holdings (based on latest close price)
- **total_pnl_amount / total_pnl_percent** — Unrealized profit/loss

### 5.3 Decimal Handling

> ⚠️ **CRITICAL**: All decimal fields from the backend are returned as **strings** in JSON. Always parse with `new Decimal(value)` from `decimal.js`, **never** with `parseFloat()`.

---

## 6. Backend API Endpoints

All endpoints are relative to the backend root (`BACKEND_URL`):

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/login` | No | Login with Firebase UID |
| POST | `/api/users/register` | No | Register new user |
| POST | `/api/users/api/token/refresh/` | No | Refresh JWT tokens |

### Portfolio
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/portfolio/summary` | Yes | Full portfolio summary with holdings |
| GET | `/api/portfolio/transactions` | Yes | List transactions (filterable) |
| GET | `/api/portfolio/transactions/{id}` | Yes | Get single transaction |
| POST | `/api/portfolio/transactions` | Yes | Create transaction |
| PUT | `/api/portfolio/transactions/{id}` | Yes | Replace transaction |
| PATCH | `/api/portfolio/transactions/{id}` | Yes | Partial update transaction |
| DELETE | `/api/portfolio/transactions/{id}` | Yes | Delete transaction |

### Tickers
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickers/search?query=` | Yes | Search tickers by name/symbol |
| GET | `/api/tickers/{symbol}/detail` | Yes | Full ticker info + ratios |
| GET | `/api/tickers/{symbol}/history` | Yes | Paginated OHLC price history |
| GET | `/api/tickers/{symbol}/income` | Yes | Annual income statements |
| GET | `/api/tickers/{symbol}/balance` | Yes | Annual balance sheets |
| GET | `/api/tickers/{symbol}/cashflow` | Yes | Annual cash flow statements |

> **Note**: Ticker endpoints use `trailing_slash=False` (Django SimpleRouter) — do NOT append trailing slashes.

---

## 7. Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint and auto-fix
pnpm lint
```

---

## 8. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | Django backend base URL | `http://127.0.0.1:8000` |
| Firebase config vars | Firebase project credentials | (set in `lib/auth/firebase.ts`) |

---

## 9. Conventions & Guidelines

### Code Style
- **ESLint + Prettier** enforced via Husky pre-commit hooks
- **TypeScript strict mode** — all code is fully typed
- **Path aliases** — `@/` maps to the project root (e.g., `@/services/http`, `@/lib/types`)
- **Barrel exports** — `index.ts` files re-export from directories (`components/ui/index.ts`, `lib/types/index.ts`)

### Component Patterns
- **Server Components** by default (Next.js App Router)
- **`'use client'`** directive only where needed (forms, context, interactivity)
- **UI primitives** in `components/ui/` — generic, reusable, unstyled base components
- **Feature components** in domain folders (`components/portfolio/`, `components/tickers/`)
- **Tailwind CSS** for all styling — utility classes with `tailwind-merge` for conditional composition

### File Naming
- Components: `PascalCase.tsx` (e.g., `TransactionForm.tsx`)
- Services: `kebab-case.service.ts` (e.g., `portfolio.service.ts`)
- Types: `PascalCase.ts` (e.g., `PortfolioTypes.ts`)
- Utilities: `kebab-case.ts` (e.g., `firebase-helpers.ts`)

### Important Rules
1. **Never store access tokens in localStorage/sessionStorage** — memory only
2. **Never send `amount` in BUY/SELL requests** — backend auto-computes it
3. **Always use `decimal.js`** for financial math — never `parseFloat()`
4. **No trailing slashes** on ticker API endpoints
5. **All data is user-scoped** — no cross-user access at the API level

---

## 10. Deployment

- **Platform**: Vercel (configured via `vercel.json`)
- **Framework**: Next.js (auto-detected)
- **Build**: `next build` (standard Vercel build pipeline)
- **Rewrites**: API proxy handled via `next.config.ts` rewrites in production

---

## 11. Related Repositories

- **Backend**: Django REST Framework application (separate repository) — handles all business logic, data storage, Yahoo Finance integration, and JWT token issuance.

---

*Last updated: May 2026*

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
- **Responsive Design** — Mobile-first layout with collapsible sidebar drawer
- **Accessibility** — WAI-ARIA compliant tabs, dialogs, and focus management

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| Language | TypeScript (strict mode) | 5.9+ |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS (v4, CSS-first config) | 4.3+ |
| Forms | React Hook Form + Zod validation | 7.76+ / 4.4+ |
| Charts | Recharts | 3.8+ |
| Auth (Client) | Firebase Auth | 12.13+ |
| Auth (Backend) | JWT (access + refresh tokens) | — |
| Decimal Math | decimal.js | 10.6+ |
| Icons | Lucide React | 1.16+ |
| Theming | next-themes | 0.4+ |
| CSS Utilities | clsx + tailwind-merge | 2.x / 3.x |
| Package Manager | pnpm | 9.15.4 |
| Node.js | 20 (pinned via .nvmrc) | — |
| Linting | ESLint (flat config v9+) + Prettier | 9.x / 3.x |
| Git Hooks | Husky + lint-staged | 9.x / 16.x |
| Deployment | Vercel | — |

---

## 3. Project Structure

```
cashtrend-web/
├── app/                        # Next.js App Router pages & layouts
│   ├── (auth)/                 # Auth route group (login, register)
│   │   ├── layout.tsx          # Split-panel layout (branding left, form right)
│   │   ├── login/              # Login page
│   │   └── register/           # Register page
│   ├── (dashboard)/            # Protected dashboard route group
│   │   ├── layout.tsx          # Dashboard shell (AuthProvider + LocaleProvider + Sidebar + Header)
│   │   ├── loading.tsx         # Dashboard loading skeleton
│   │   ├── page.tsx            # Main dashboard (portfolio summary cards + holdings table)
│   │   ├── portfolio/          # Portfolio/transactions pages
│   │   │   ├── page.tsx        # Transaction list with filters & delete
│   │   │   ├── new/page.tsx    # Create new transaction form
│   │   │   └── [id]/edit/      # Edit transaction form (dynamic route)
│   │   └── tickers/            # Ticker pages
│   │       ├── page.tsx        # Ticker search (debounced, 300ms)
│   │       └── [symbol]/       # Ticker detail (5 tabbed views)
│   ├── api/                    # Next.js Route Handlers (server-only)
│   │   └── auth/               # Auth API routes
│   │       ├── set-cookie/     # POST — sets refresh + user cookies
│   │       ├── logout/         # POST — clears all auth cookies
│   │       └── refresh/        # POST — refreshes JWT via backend
│   ├── globals.css             # Design tokens + Tailwind v4 theme config
│   └── layout.tsx              # Root layout (ThemeProvider, fonts)
├── components/                 # Reusable React components
│   ├── dashboard/              # Dashboard-specific (SummaryCard, HoldingsTable, etc.)
│   ├── layout/                 # App shell (Header, Sidebar, ThemeToggle)
│   ├── portfolio/              # Portfolio (TransactionForm, TransactionList, Filters)
│   ├── tickers/                # Ticker (PriceChart, RatiosTab, FinancialsTab, HistoryTab)
│   └── ui/                     # Base UI primitives (Button, Card, Input, Label, etc.)
├── context/                    # React Context providers
│   ├── auth-context.tsx        # Auth state, hydration, logout
│   └── locale-context.tsx      # i18n locale management (localStorage-persisted)
├── lib/                        # Shared utilities & configuration
│   ├── auth/                   # Firebase configuration & helpers
│   │   ├── firebase.ts         # Firebase app/auth singleton initialization
│   │   ├── firebase-helpers.ts # signInWithEmail, createUser, signOut wrappers
│   │   └── session.ts          # Cookie read/write/clear helpers (server-side)
│   ├── i18n/                   # Internationalization
│   │   ├── en.json             # English translations
│   │   ├── es.json             # Spanish translations
│   │   └── types.ts            # i18n type definitions (typed translation keys)
│   ├── types/                  # TypeScript type definitions
│   │   ├── AuthTypes.ts        # User, AuthResponse, LoginRequest, RegisterRequest, errors
│   │   ├── PortfolioTypes.ts   # Transaction, Holding, PortfolioSummary, CRUD types
│   │   ├── TickerTypes.ts      # Ticker, TickerDetail, TickerRatios, OHLC, financials
│   │   └── index.ts            # Re-export barrel file
│   └── utils.ts                # cn(), formatCurrency(), formatPercent(), formatDate(), P&L helpers
├── services/                   # API service layer
│   ├── http.ts                 # Core HTTP client (auth, retry, refresh queue, proxy)
│   ├── auth.service.ts         # Auth endpoints (login, register, refresh)
│   ├── portfolio.service.ts    # Portfolio endpoints (CRUD transactions, summary)
│   └── tickers.service.ts      # Ticker endpoints (search, detail, history, financials)
├── proxy.ts                    # Route middleware (auth guard, redirects)
├── next.config.ts              # Next.js config (API proxy rewrites)
├── vercel.json                 # Vercel deployment config
├── tsconfig.json               # TypeScript config (strict, bundler resolution, @/ alias)
├── eslint.config.mjs           # ESLint flat config (next/core-web-vitals + prettier)
├── prettier.config.js          # Prettier (no semi, single quotes, 100 width)
├── postcss.config.mjs          # PostCSS config (Tailwind)
├── .husky/pre-commit           # Runs lint-staged on pre-commit
├── .nvmrc                      # Node 20
├── package.json                # Dependencies & scripts
├── pnpm-workspace.yaml         # pnpm workspace config
└── pnpm-lock.yaml              # Lockfile
```

---

## 4. Architecture & Data Flow

### 4.1 Authentication Flow

```
User → Firebase Auth (email/password) → Firebase UID
     → Backend POST /api/users/login { user_auth_id, username } → JWT { access, refresh, user }
     → Access token stored in memory (module-level variable in http.ts)
     → Refresh token stored in httpOnly cookie (via /api/auth/set-cookie Route Handler)
     → User profile stored in JS-readable cookie (cashtrend_user)
```

- **Firebase** handles identity verification (client-side)
- **Django backend** issues JWT tokens after verifying the Firebase UID
- **Access token** is kept in-memory only (never in localStorage/sessionStorage)
- **Refresh token** is in an httpOnly cookie managed by Next.js Route Handlers
- On 401 responses, the HTTP client automatically attempts a silent token refresh
- Concurrent 401s are queued — only one refresh request is in-flight at a time

### 4.2 Route Protection (proxy.ts)

The `proxy.ts` file (Next.js 16 middleware convention) acts as a request router:

```
Unauthenticated + dashboard route → redirect to /login
Authenticated + /login or /register → redirect to / (dashboard)
/api/*, /_next/*, static files → always allowed through
```

**Protection check**: Presence of `cashtrend_refresh` cookie (actual token validation happens server-side on API calls).

### 4.3 API Proxy Pattern

```
Browser → /api/proxy/* (same-origin) → Next.js Rewrite → Django backend (BACKEND_URL)
```

All API calls from the browser go through the Next.js rewrite proxy at `/api/proxy/*`, eliminating CORS issues entirely. The actual backend URL is configured via the `BACKEND_URL` environment variable.

### 4.4 Internal Route Handlers (app/api/auth/)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/set-cookie` | POST | Stores refresh token (httpOnly) + user profile cookies after login/register |
| `/api/auth/logout` | POST | Clears both auth cookies |
| `/api/auth/refresh` | POST | Reads httpOnly cookie, calls backend refresh, updates cookie, returns new access token |

### 4.5 Service Layer

The `services/` directory provides a typed API client:

- **`http.ts`** — Core HTTP wrapper with automatic auth headers, token refresh on 401 (with request queuing), and typed methods (`get`, `post`, `put`, `patch`, `del`)
- **`auth.service.ts`** — Login, register, token refresh
- **`portfolio.service.ts`** — Portfolio summary, transaction CRUD
- **`tickers.service.ts`** — Ticker search, detail, history, financials

### 4.6 State Management

- **AuthContext** — Provides `user`, `isLoading`, `setUser`, and `logout()` to all dashboard components
- **LocaleContext** — Provides `locale`, `t` (translation object), and `setLocale()` 
- No external state management library (React Context + local component state only)

### 4.7 Auth Context Hydration (on page load)

1. Calls `POST /api/auth/refresh` to obtain a fresh access token from the httpOnly cookie
2. Stores the access token in-memory via `setAccessToken()`
3. Reads user profile from `cashtrend_user` cookie (JS-readable)
4. Sets `isLoading = false` — children can now render

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

### 5.3 Ticker Detail (5 Tabbed Views)

| Tab | Data | Source |
|-----|------|--------|
| Ratios | Beta, PE, EPS, PEG, P/S, P/B, dividends, margins, ROA, ROE, leverage, EV | `/api/tickers/{symbol}/detail` |
| History | Paginated OHLC + price chart | `/api/tickers/{symbol}/history` |
| Income | Revenue, gross/operating/net profit, EBIT, EBITDA | `/api/tickers/{symbol}/income` |
| Balance | Current/non-current assets & liabilities, equity | `/api/tickers/{symbol}/balance` |
| Cash Flow | Operating, investing, financing cash flows | `/api/tickers/{symbol}/cashflow` |

### 5.4 Decimal Handling

> ⚠️ **CRITICAL**: All decimal fields from the backend are returned as **strings** in JSON. Always parse with `new Decimal(value)` from `decimal.js`, **never** with `parseFloat()`.

---

## 6. Backend API Endpoints

All endpoints are relative to the backend root (`BACKEND_URL`):

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/login` | No | Login with Firebase UID |
| POST | `/api/users/register` | No | Register new user (supports multipart for profile_picture) |
| POST | `/api/users/api/token/refresh/` | No | Refresh JWT tokens |

### Portfolio
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/portfolio/summary` | Yes | Full portfolio summary with holdings |
| GET | `/api/portfolio/transactions` | Yes | List transactions (filterable by `type` and `ticker`) |
| GET | `/api/portfolio/transactions/{id}` | Yes | Get single transaction |
| POST | `/api/portfolio/transactions` | Yes | Create transaction |
| PUT | `/api/portfolio/transactions/{id}` | Yes | Replace transaction (full) |
| PATCH | `/api/portfolio/transactions/{id}` | Yes | Partial update transaction |
| DELETE | `/api/portfolio/transactions/{id}` | Yes | Delete transaction (returns 204) |

### Tickers
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickers/search?query=` | Yes | Search tickers (up to 8 results, fallback to Yahoo Finance) |
| GET | `/api/tickers/{symbol}/detail` | Yes | Full ticker info + ratios |
| GET | `/api/tickers/{symbol}/history` | Yes | Paginated OHLC (supports `granularity` and `page_size` params) |
| GET | `/api/tickers/{symbol}/income` | Yes | Annual income statements |
| GET | `/api/tickers/{symbol}/balance` | Yes | Annual balance sheets |
| GET | `/api/tickers/{symbol}/cashflow` | Yes | Annual cash flow statements |

> **Note**: Ticker endpoints use `trailing_slash=False` (Django SimpleRouter) — do NOT append trailing slashes.

---

## 7. Type System

### 7.1 Auth Types (`lib/types/AuthTypes.ts`)

```typescript
interface User {
  user_auth_id: string           // Firebase UID
  username: string
  profile_picture: string | null // Absolute URL or null
}

interface AuthResponse {
  access: string                 // JWT access token
  refresh: string                // JWT refresh token
  user: User
}

interface LoginRequest {
  user_auth_id: string
  username: string
}

interface RegisterRequest {
  user_auth_id: string
  username: string
  profile_picture?: File | null  // Multipart upload
}

interface TokenRefreshResponse {
  access: string
  refresh: string
}

// Error shapes from the backend
interface ApiValidationError { [field: string]: string[] }  // Field-level
interface ApiDetailError { detail: string; code?: string }   // General
type ApiError = ApiValidationError | ApiDetailError
```

### 7.2 Key Portfolio Types

```typescript
type TransactionType = 'BUY' | 'SELL' | 'INCOME' | 'EXPENSE'

interface Transaction {
  id: number
  transaction_type: TransactionType
  ticker: { symbol, name, type, market } | null
  quantity: string | null       // Decimal as string
  price_per_unit: string | null // Decimal as string
  amount: string                // Decimal as string (auto-computed for BUY/SELL)
  date: string
  notes: string
  created_at: string
  updated_at: string
}

interface PortfolioSummary {
  total_liquidity: string
  total_invested: string
  total_current_value: string
  total_pnl_amount: string
  total_pnl_percent: string | null
  holdings: Holding[]
}
```

### 7.3 Key Ticker Types

```typescript
interface TickerDetail {
  symbol, name, type, market, industry, sector, description: string
  created_date, update_date: string
  tickerratios_set: TickerRatios  // Single object, NOT array
}

type HistoryGranularity = '1D' | '1W' | '1M' | '1Y' | 'ALL'

// DRF paginated response (used by history endpoint)
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
```

---

## 8. Utility Functions (`lib/utils.ts`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `cn()` | `(...inputs: ClassValue[]) → string` | Merge Tailwind classes (clsx + tailwind-merge) |
| `formatCurrency()` | `(value, currency?, locale?) → string` | Format decimal as `$1,234.56` |
| `formatPercent()` | `(value, decimals?) → string` | Format as `+12.34%` or `-3.21%` |
| `formatCompactCurrency()` | `(value) → string` | Format large numbers as `$1.23B` |
| `formatNumber()` | `(value, decimals?) → string` | Format with thousands separators |
| `formatDate()` | `(value, options?) → string` | UTC-safe date format: `Jan 15, 2024` |
| `getPnlDirection()` | `(value) → 'gain' \| 'loss' \| 'neutral'` | Determine P&L direction |
| `pnlColorClass()` | `(value) → string` | Return Tailwind color class for P&L |

---

## 9. Cookie Strategy

| Cookie Name | HttpOnly | JS-Readable | SameSite | MaxAge | Purpose |
|-------------|----------|-------------|----------|--------|---------|
| `cashtrend_refresh` | ✅ Yes | No | Strict | 24 hours | JWT refresh token |
| `cashtrend_user` | No | ✅ Yes | Strict | 24 hours | User profile (for hydration) |

Both cookies: `Secure` in production only, `Path: /`.

---

## 10. Internationalization (i18n)

- **Implementation**: Client-side React Context (`LocaleContext`)
- **Supported locales**: `'en'` (English), `'es'` (Spanish)
- **Persistence**: `localStorage` key `'ct_locale'`, defaults to `'en'`
- **Scope**: Wraps `(dashboard)` layout only — auth pages use hardcoded English
- **Translation files**: `lib/i18n/en.json`, `lib/i18n/es.json`
- **Usage**: `const { t, locale, setLocale } = useLocale()` → `t.header.page_dashboard`
- **Type safety**: Translation keys are fully typed via `lib/i18n/types.ts`

---

## 11. Design System & Theming

### 11.1 Design Tokens (`globals.css`)

The app uses CSS custom properties for theming, consumed by Tailwind v4:

**Light Mode (`:root`)**:
- Background: `#f4f4f5` (zinc-100) | Surface: `#ffffff`
- Text: Primary `#18181b`, Secondary `#71717a`, Muted `#a1a1aa`
- Brand: `#2563eb` (blue-600), Hover: `#1d4ed8`
- Sidebar: Dark background (`#18181b`) with light text
- P&L: Gain `#16a34a` (green-600), Loss `#dc2626` (red-600)

**Dark Mode (`.dark`)**:
- Inverted surfaces/text, adjusted brand/P&L colors for contrast

### 11.2 Tailwind Custom Utilities

Available via CSS variable mapping:
- Colors: `text-gain`, `text-loss`, `bg-gain-subtle`, `bg-loss-subtle`, `text-brand`, `bg-surface`, `border-default`
- Semantic: `text-text-primary`, `text-text-secondary`, `text-text-muted`

### 11.3 UI Component Library (`components/ui/`)

| Component | Variants/Features |
|-----------|------------------|
| **Button** | Variants: `primary`, `secondary`, `ghost`, `danger` · Sizes: `sm`, `md`, `lg` · `isLoading` spinner state · `leftIcon` prop |
| **Input** | Error state (red ring + message) · Left icon · `aria-invalid`/`aria-describedby` · Focus ring |
| **Card** | Compound pattern: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| **Label** | Standard form label |
| **FormError** | Field-level error message display |
| **FieldTooltip** | Inline help tooltip |

### 11.4 Layout Structure

**Dashboard Shell**:
```
┌─────────────────────────────────────────────┐
│ Sidebar (240px, fixed) │ Header (page title, locale toggle, theme toggle, avatar) │
│                        │─────────────────────────────────────────────────────────│
│ • Dashboard            │                                                         │
│ • Portfolio            │                  Main Content                            │
│ • Tickers              │                  (scrollable)                            │
│                        │                                                         │
│ [User + Logout]        │                                                         │
└─────────────────────────────────────────────┘
```

**Mobile**: Sidebar hidden → hamburger button → slide-in drawer (240px) with overlay + Escape key dismiss.

---

## 12. Development Commands

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

## 13. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | Django backend base URL | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | — |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | — |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | — |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | — |
| `NEXT_PUBLIC_STORAGE_BUCKET` | Firebase storage bucket (optional) | — |
| `NEXT_PUBLIC_MESSAGING_SENDER_ID` | Firebase messaging sender (optional) | — |
| `NEXT_PUBLIC_MEASUREMENT_ID` | Firebase analytics (optional) | — |

---

## 14. Code Style & Configuration

### Prettier (`prettier.config.js`)
- No semicolons (`semi: false`)
- Single quotes (`singleQuote: true`)
- 100 char line width
- 2-space indent
- Trailing commas (ES5)
- Double quotes in JSX

### ESLint (`eslint.config.mjs`)
- Flat config format (ESLint v9+)
- Extends: `next/core-web-vitals`, `next/typescript`, `prettier`
- Ignores: `.next/`, `out/`, `build/`

### TypeScript (`tsconfig.json`)
- `strict: true`
- Target: ES2017
- Module resolution: `bundler` (Next.js optimized)
- Path alias: `@/*` → `./*`
- `noEmit: true` (Next.js handles transpilation)
- `isolatedModules: true` (required for SWC)

### Git Hooks
- **pre-commit** (Husky): Runs `lint-staged` → ESLint on all staged `*.{js,jsx,ts,tsx}` files

---

## 15. Conventions & Guidelines

### Component Patterns
- **Server Components** by default (Next.js App Router)
- **`'use client'`** directive only where needed (forms, context, interactivity)
- **UI primitives** in `components/ui/` — generic, reusable base components
- **Feature components** in domain folders (`components/portfolio/`, `components/tickers/`)
- **Compound components** for complex UI (Card has sub-components)
- **Tailwind CSS** for all styling — utility classes with `tailwind-merge` for conditional composition

### File Naming
- Components: `PascalCase.tsx` (e.g., `TransactionForm.tsx`)
- Services: `kebab-case.service.ts` (e.g., `portfolio.service.ts`)
- Types: `PascalCase.ts` (e.g., `PortfolioTypes.ts`)
- Utilities: `kebab-case.ts` (e.g., `firebase-helpers.ts`)
- Barrel exports: `index.ts` in each component/type directory

### Important Rules
1. **Never store access tokens in localStorage/sessionStorage** — memory only
2. **Never send `amount` in BUY/SELL requests** — backend auto-computes it
3. **Always use `decimal.js`** for financial math — never `parseFloat()`
4. **No trailing slashes** on ticker API endpoints
5. **All data is user-scoped** — no cross-user access at the API level
6. **Use `cn()` helper** for conditional Tailwind class merging
7. **Use CSS custom properties** for theme colors — never hardcode hex values
8. **Debounce search inputs** (300ms) to avoid excessive API calls
9. **Parallel data fetching** — use `Promise.all` for independent API calls on page load
10. **Handle 204 No Content** — DELETE responses return `undefined`, not JSON

---

## 16. Page Routes & Navigation

| Path | Page | Description |
|------|------|-------------|
| `/login` | Auth | Email + password login form |
| `/register` | Auth | Registration with optional profile picture |
| `/` | Dashboard | Portfolio summary cards + holdings table |
| `/portfolio` | Portfolio | Transaction list with filters (type + ticker) |
| `/portfolio/new` | Portfolio | Create new transaction form |
| `/portfolio/[id]/edit` | Portfolio | Edit existing transaction |
| `/tickers` | Tickers | Live ticker search with debounce |
| `/tickers/[symbol]` | Tickers | Ticker detail with 5 tabbed views |

---

## 17. Deployment

- **Platform**: Vercel (configured via `vercel.json`)
- **Framework**: Next.js (auto-detected)
- **Build**: `next build` (standard Vercel build pipeline)
- **Rewrites**: API proxy handled via `next.config.ts` rewrites in production
- **Node version**: 20 (specified in `.nvmrc`)
- **Cookies**: `Secure` flag enabled only in production (allows HTTP in local dev)

---

## 18. Related Repositories

- **Backend**: Django REST Framework application (separate repository) — handles all business logic, data storage, Yahoo Finance integration, and JWT token issuance.

---

## 19. Common Patterns for AI Agents

### Adding a New Page
1. Create route in `app/(dashboard)/your-feature/page.tsx`
2. Add navigation item in `components/layout/Sidebar.tsx`
3. Add page title mapping in `components/layout/Header.tsx`
4. Add translations in `lib/i18n/en.json` and `lib/i18n/es.json`

### Adding a New API Integration
1. Define types in `lib/types/YourTypes.ts` and re-export from `lib/types/index.ts`
2. Create service in `services/your-feature.service.ts` using `http.get/post/...`
3. All endpoints are authenticated by default (pass `false` as last arg for public)

### Adding a New UI Component
1. Create in `components/ui/ComponentName.tsx`
2. Re-export from `components/ui/index.ts`
3. Use `cn()` for class merging, CSS variables for colors
4. Support light/dark mode via design tokens

### Error Handling Pattern
- API errors throw `HttpError` with `status` and `body` properties
- Backend validation errors: `{ field_name: ["error message"] }`
- Backend general errors: `{ detail: "message", code?: "error_code" }`
- On auth failure (refresh token expired): auto-redirect to `/login`

---

*Last updated: May 2026*

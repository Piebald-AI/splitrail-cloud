# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Splitrail Cloud is a Next.js web application that serves as the cloud platform for [Splitrail](https://github.com/Piebald-AI/splitrail), an analyzer for agentic AI coding tool usage. Users upload anonymized usage statistics from the Splitrail CLI to track their development metrics, view personal analytics, and optionally participate in a public leaderboard.

**Live URL**: https://splitrail.dev

## Tech Stack

- **Framework**: Next.js 15.3.5 with App Router
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js 5.0 (beta) with GitHub OAuth
- **Styling**: Tailwind CSS v4 with Radix UI components
- **State Management**: TanStack Query (React Query)
- **Monitoring**: Sentry for error tracking
- **Analytics**: Vercel Analytics, PostHog
- **Package Manager**: **pnpm** (never use npm or yarn)

## Development Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm build           # Build for production (runs prisma generate first)
pnpm start           # Start production server
pnpm lint            # Run ESLint
pnpm format          # Run Prettier
pnpm type-check      # TypeScript type checking (tsc --noEmit)

# Database
pnpm db:generate     # Generate Prisma client
pnpm db:push         # Push schema to database (use for dev)
pnpm db:migrate      # Run migrations (use for production)
pnpm db:migration:new # Create new migration
pnpm db:seed         # Seed database
pnpm db:studio       # Open Prisma Studio
pnpm db:reset        # Reset database (force)
```

## Path Aliases

TypeScript is configured with the `@/*` path alias mapping to `./src/*`. Always use this alias for imports:

```typescript
import { db } from "@/lib/db";
import { Stats } from "@/types";
```

## Critical Architecture Concepts

### Multi-Application Support

The platform tracks statistics from multiple agentic AI coding tools, not just Claude Code. Supported applications are defined in `src/types/index.ts` and `src/lib/application-config.ts`:

- `claude_code` - Claude Code
- `open_code` - OpenCode
- `cline` - Cline (VSCode extension)
- `roo_code`, `kilo_code`, `qwen_code` - Other AI coding assistants
- `codex_cli`, `gemini_cli`, `kilo_cli` - Alternative CLIs
- `copilot` - GitHub Copilot
- `pi_agent` - Pi Agent

**Important**: When adding features, always ensure they work across all applications, not just Claude Code.

### Stats Aggregation System

`message_stats` is the source of truth: one usage row per message. PostgreSQL derives the `stats_summary` materialized view with daily, weekly, monthly, and all-time totals per user/application. Daily buckets use saved user timezones; weekly/monthly use UTC. Conversation counts belong to the first message's bucket.

Uploads only store source messages. Statement triggers mark database refresh metadata dirty. An authenticated Vercel cron calls `refresh_stats_summary()` every 15 minutes; unchanged data and overlapping invocations skip work. The application never maintains aggregate rows. Readers expose the last successful snapshot timestamp and show a freshness notice. See `docs/stats-summaries.md` for deployment order, local verification, and legacy table cleanup. Do not use `prisma db push` on production: the view, functions, triggers, and metadata are SQL-managed.

### Database Schema Key Points

All statistics fields use `BigInt` for large numbers except `cost` which is `Float`. The schema is split between:

- `prisma/schema.prisma` - Database schema definition
- `src/types/index.ts` - TypeScript types (must be kept in sync)

**Critical**: When modifying message metric columns, update the Prisma schema, TypeScript types, and materialized-view SQL together.

### API Token Authentication

CLI access uses bearer token authentication:

- Tokens are prefixed with `st_` (splitrail token)
- Generated and managed in the Settings page (`/settings`)
- Stored in the `api_tokens` table
- Validated via `Authorization: Bearer <token>` header
- Last used timestamp tracked on each request

### Statistics Field Categories

Stats are categorized for UI display and filtering:

- **File Operations**: filesRead, filesAdded, filesEdited, filesDeleted
- **Line Operations**: linesRead, linesAdded, linesEdited, linesDeleted
- **Token Usage**: inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens, cachedTokens, reasoningTokens
- **Tool Usage**: toolCalls, terminalCommands, fileSearches, fileContentSearches
- **Content Types**: codeLines, docsLines, dataLines, mediaLines, configLines, otherLines
- **Todo Tracking**: todosCreated, todosCompleted, todosInProgress, todoReads, todoWrites
- **Bytes**: bytesRead, bytesAdded, bytesEdited, bytesDeleted
- **Cost**: cost (in USD, converted to user's preferred currency in UI)

Reference `src/types/index.ts` for the canonical list of stat keys.

## Key API Endpoints

### POST /api/upload-stats

**Primary CLI integration endpoint**. Accepts an array of ConversationMessage objects containing statistics data.

- Authentication: Bearer token in Authorization header
- Request body: Array of ConversationMessage (see `src/types/index.ts`)
- Stores source messages in batches; database summaries refresh separately
- Updates `lastUsed` timestamp on API token

### Token Management

- `GET /api/user/token` - List user's API tokens
- `POST /api/user/token` - Generate new token
- `DELETE /api/user/token` - Delete token

### User Data

- `GET /api/user/[userId]` - User profile with stats (supports time range filtering)
- `GET /api/user/[userId]/stats` - Detailed stats breakdown
- `GET/POST /api/user/[userId]/preferences` - User preferences (currency, publicProfile)

### Leaderboard

- `GET /api/leaderboard` - Public leaderboard data
  - Query params: `period`, `application`, `sortBy`
  - Only returns users with `publicProfile: true`

### Projects

- `GET/POST /api/projects` - Project management
- `GET/POST /api/folder-projects` - Associate local folders with projects

## Component Organization

### UI Components (`src/components/ui/`)

Radix UI primitives with Tailwind styling. These are generated/managed by shadcn/ui conventions:

- Follow the existing pattern when adding new components
- Use `cn()` utility from `@/lib/utils` for className merging
- All components use Radix UI + class-variance-authority pattern

### Feature Components

- `src/components/auth/` - Authentication (sign-in button, session provider)
- `src/app/leaderboard/*.tsx` - Leaderboard table columns, dropdowns, pagination
- `src/components/cli-token-display.tsx` - Token display with copy functionality
- `src/components/navbar.tsx` - Main navigation

## Pages Structure

- `/` (src/app/page.tsx) - Landing page
- `/leaderboard` - Public leaderboard
- `/profile` - User's own profile (redirects to `/profile/[userId]`)
- `/settings` - User settings, token management
- `/projects` - Project management
- `/auth/signin` - Authentication

The app uses Next.js App Router with server components by default.

## Date and Time Handling

All dates are stored in UTC in the database. Period calculations are handled by:

- `getPeriodStartForDate(date, period)` - Get period start
- `getPeriodEndForDate(date, period)` - Get period end

These utilities are in `src/lib/dateUtils.ts` and are critical for correct stats aggregation.

## Utility Libraries

- `src/lib/db.ts` - Prisma client singleton
- `src/lib/utils.ts` - General utilities (cn, formatters, etc.)
- `src/lib/currency.ts` - Currency conversion
- `src/lib/routeUtils.ts` - API route helpers
- `src/lib/dateUtils.ts` - Date/period utilities
- `src/lib/application-config.ts` - Application metadata and labels

## Privacy Model

Users are opted OUT of the public leaderboard by default. They must explicitly set `publicProfile: true` in UserPreferences to appear on the leaderboard.

- Private by default
- No conversation history is ever uploaded (only stats)
- Users can delete their account and all data at any time

## Environment Variables

Required for local development (create `.env.local` from `.env.local.template`):

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Sentry variables are optional for development.

## Important Development Notes

- **Always use pnpm**, never npm or yarn
- **Never run the dev server** when working with Claude Code (per existing convention)
- TypeScript strict mode is enabled
- The codebase uses BigInt extensively - be careful with JSON serialization
- All API routes should use proper error handling and return appropriate HTTP status codes
- When updating stats schema, update both Prisma schema and TypeScript types

## Testing Database Changes

When modifying the database schema:

1. Update `prisma/schema.prisma`
2. Update corresponding types in `src/types/index.ts`
3. Run `pnpm db:push` for development (or create a migration with `pnpm db:migration:new`)
4. Run `pnpm db:generate` to update Prisma client
5. Check for type errors with `pnpm type-check`

## Common Patterns

### BigInt Serialization

BigInt values cannot be directly serialized to JSON. Use the transformer pattern:

```typescript
const serialized = {
  ...data,
  bigIntField: data.bigIntField.toString(),
};
```

### Stats Aggregation

When calculating totals, ensure you handle BigInt correctly:

```typescript
const total = stats.reduce((sum, stat) => sum + stat.inputTokens, 0n);
```

### Authentication Checks

Server components can access the session:

```typescript
import { auth } from "@/auth";

const session = await auth();
if (!session?.user) {
  redirect("/auth/signin");
}
```

## Related Projects

- **Splitrail CLI**: https://github.com/Piebald-AI/splitrail - Monitors AI coding tool usage and uploads stats
- **Piebald AI**: https://piebald.ai - Developer-first agentic AI experience

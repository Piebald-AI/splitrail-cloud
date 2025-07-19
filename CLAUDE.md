# Splitrail Leaderboard

## Project Overview
This is a Next.js web application that serves as a leaderboard for [Splitrail](https://github.com/Piebald-AI/splitrail) - an analyzer for agentic AI coding tool usage. The application tracks and displays usage statistics for developers using AI development tools like Claude Code.

**Live URL**: https://splitrail.dev/leaderboard

## Architecture

### Tech Stack
- **Framework**: Next.js 15.3.5 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with Radix UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with GitHub OAuth
- **Monitoring**: Sentry for error tracking
- **Analytics**: Vercel Analytics, PostHog for user analytics
- **Package Manager**: pnpm

### Key Dependencies
- **UI Components**: Radix UI primitives, Lucide React icons, Recharts for data visualization
- **Data Management**: TanStack Query for API state management
- **Validation**: Zod for schema validation
- **Notifications**: Sonner for toast notifications

## Project Structure

### Frontend Pages
- `src/app/page.tsx` - Landing page with project overview and CLI setup instructions
- `src/app/leaderboard/page.tsx` - Main leaderboard displaying user rankings
- `src/app/profile/page.tsx` - User profile with detailed statistics and charts
- `src/app/profile/[date]/page.tsx` - Daily detailed view
- `src/app/projects/page.tsx` - Project management interface
- `src/app/settings/page.tsx` - User preferences and token management
- `src/app/auth/signin/page.tsx` - Authentication pages

### API Endpoints
- `POST /api/upload-stats` - **Primary CLI endpoint** for uploading usage statistics
- `GET/POST/DELETE /api/user/token` - API token management for CLI authentication
- `GET /api/leaderboard` - Fetch leaderboard data
- `GET /api/user/[userId]` - User profile data with time range filtering
- `GET/POST /api/projects` - Project management
- `GET/POST /api/folder-projects` - Associate local folders with projects

### Components
- `src/components/ui/` - Reusable UI components (buttons, cards, tables, etc.)
- `src/components/auth/` - Authentication-related components
- `src/components/leaderboard-*.tsx` - Leaderboard data table and columns

## CLI Integration

The application integrates with the [Splitrail CLI](https://github.com/Piebald-AI/splitrail) which monitors agentic AI development tool usage.

### Authentication Flow
1. Users sign in with GitHub to get access to the web interface
2. Generate API tokens in the web interface (`/settings`)
3. Configure CLI: `splitrail config set-token <token>`
4. Configure server: `splitrail config set-server <leaderboard-url>`
5. Upload data: `splitrail upload`

### Data Collection
The CLI tracks comprehensive development metrics:
- **Token Usage**: Input/output tokens, cache tokens, API costs
- **File Operations**: Files read/added/edited/deleted, lines modified
- **Tool Usage**: Tool calls, terminal commands, file searches
- **Content Analysis**: Lines by file type (code, docs, data, config)
- **Todo Management**: Todo creation, completion, progress tracking

## Database Schema

### Key Models
- **User**: GitHub-authenticated users with preferences
- **UserStats**: Aggregated statistics across multiple time periods (hourly, daily, weekly, monthly, yearly, all-time)
- **MessageStats**: Raw message-level statistics from CLI uploads
- **ApiToken**: CLI authentication tokens (prefixed with "st_")
- **Project**: User projects that can be associated with local folders
- **FolderProject**: Association between local folders and projects

### Period Aggregation
Statistics are automatically aggregated across multiple time periods to enable different leaderboard views and user analytics.

## Development Commands

```bash
# Development
pnpm dev              # Start development server with Turbopack
pnpm build           # Build production bundle (includes Prisma generate)
pnpm start           # Start production server
pnpm lint            # Run ESLint
pnpm format          # Run Prettier
pnpm type-check      # TypeScript type checking

# Database
pnpm db:generate     # Generate Prisma client
pnpm db:push         # Push schema to database
pnpm db:seed         # Seed database with initial data
pnpm db:studio       # Open Prisma Studio
```

## Environment Variables

Required environment variables (see deployment docs for details):
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `NEXTAUTH_URL` - Application URL
- `GITHUB_CLIENT_ID` - GitHub OAuth app ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth app secret
- Sentry configuration for error monitoring

## Key Features

### Leaderboard
- Competitive rankings based on usage metrics
- Multiple sorting options (cost, tokens, lines of code)
- Time-based filtering (daily, weekly, monthly, all-time)

### User Profiles
- Detailed personal analytics with charts
- Historical data tracking across multiple time periods
- Model usage breakdown
- Recent activity tables with daily drill-down

### Project Management
- Associate local development folders with named projects
- Track statistics per project
- Open source project highlighting

### Security
- Token-based CLI authentication with rate limiting
- User data privacy controls
- Secure token generation and validation
- Optional public leaderboard opt-out

## Related Projects
- **Splitrail CLI**: https://github.com/Piebald-AI/splitrail
- **Piebald AI**: https://piebald.ai - Developer-first agentic AI experience

## Support
- GitHub Issues: Project repository
- Email: support@piebald.ai
- Forum: https://piebald.discourse.group

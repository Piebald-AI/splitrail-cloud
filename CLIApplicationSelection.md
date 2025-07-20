# CLI/Application Selection Implementation Plan

## Overview
This document outlines the implementation plan for adding support for multiple CLI/agentic development tools (Claude Code, Google Gemini CLI, OpenAI Codex CLI) to the Splitrail leaderboard. The goal is to allow users to view statistics for individual tools or any combination of tools.

## Current State
- The application currently supports only Claude Code
- UserStats table has a unique constraint on `[userId, period]`
- Leaderboard API filters by period only
- Frontend has period selection but no application filtering

## Target State
- Support for Claude Code, Google Gemini CLI, and OpenAI Codex CLI
- Users can select any combination of applications to view
- Separate statistics tracking per application per user
- Flexible leaderboard views (single app, multiple apps, or all apps)

## Implementation Steps

### 1. Database Schema Changes

#### 1.1 Update UserStats Table (`prisma/schema.prisma`)
```prisma
model UserStats {
  id                    String   @id @default(cuid())
  userId                String
  application           String   @default("Claude") // New field: "Claude", "Gemini", "Codex"
  period                String   // "hourly", "daily", "weekly", "monthly", "yearly", "all-time"
  periodStart           DateTime?
  periodEnd             DateTime?
  // ... existing fields ...
  
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, period, application]) // Updated unique constraint
  @@map("user_stats")
}
```

#### 1.2 Migration Strategy
- Add `application` column with default value `"Claude"` for backward compatibility
- Update unique constraint from `[userId, period]` to `[userId, period, application]`
- Existing data will automatically have `application = "Claude"`

### 2. Type System Updates (`src/types/index.ts`)

#### 2.1 Add Application Types
```typescript
export type ApplicationType = "Claude" | "Gemini" | "Codex";

export interface UserStats {
  // ... existing fields ...
  application?: ApplicationType; // Optional for backward compatibility
}

export interface LeaderboardRequest {
  period?: PeriodType;
  applications?: ApplicationType[]; // New field for filtering
  page?: number;
  pageSize?: number;
}
```

#### 2.2 Update Existing Interfaces
- Add `application` field to relevant interfaces
- Update API request/response types
- Ensure backward compatibility

### 3. API Layer Updates

#### 3.1 Upload Stats API (`src/app/api/upload-stats/route.ts`)

##### Changes Required:
1. **Application Detection Logic**
   ```typescript
   function detectApplication(userAgent?: string, headers?: Headers): ApplicationType {
     // Logic to detect CLI source from request headers or user agent
     // Default to "Claude" for backward compatibility
   }
   ```

2. **Update Period Stats Functions**
   - Modify `updatePeriodStats` to include `application` parameter
   - Update all database queries to include application field
   - Ensure unique constraint handles `[userId, period, application]`

3. **Backward Compatibility**
   - If no application detected, default to "Claude"
   - Handle existing tokens that don't specify application

#### 3.2 Leaderboard API (`src/app/api/leaderboard/route.ts`)

##### Changes Required:
1. **Add Applications Parameter**
   ```typescript
   const applications = searchParams.get("applications")?.split(",") || ["Claude", "Gemini", "Codex"];
   ```

2. **Update Database Queries**
   ```typescript
   const usersWithStats = await db.user.findMany({
     include: {
       userStats: {
         where: {
           AND: [
             { OR: [{ period }, { period: "all-time" }] },
             { application: { in: applications } }
           ]
         },
       },
       preferences: true,
     },
     // ... rest of query
   });
   ```

3. **Aggregation Logic**
   - When multiple applications selected, aggregate stats across applications
   - Maintain separate rankings per application vs. combined rankings
   - Handle edge cases where user has data for some but not all selected applications

### 4. Frontend Updates

#### 4.1 Leaderboard Data Table (`src/app/leaderboard-data-table.tsx`)

##### Add Application Selection Dropdown (after line 201)
```typescript
const [selectedApplications, setSelectedApplications] = React.useState<ApplicationType[]>(["Claude", "Gemini", "Codex"]);

// Add after period dropdown
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="ml-2">
      Applications ({selectedApplications.length}) <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {[
      { value: "Claude", label: "Claude Code" },
      { value: "Gemini", label: "Google Gemini CLI" },
      { value: "Codex", label: "OpenAI Codex CLI" },
    ].map((app) => (
      <DropdownMenuCheckboxItem
        key={app.value}
        checked={selectedApplications.includes(app.value as ApplicationType)}
        onCheckedChange={(checked) => {
          if (checked) {
            setSelectedApplications([...selectedApplications, app.value as ApplicationType]);
          } else {
            setSelectedApplications(selectedApplications.filter(a => a !== app.value));
          }
        }}
      >
        {app.label}
      </DropdownMenuCheckboxItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

##### Update API Calls
```typescript
const fetchLeaderboardData = React.useCallback(async () => {
  const applicationsParam = selectedApplications.join(",");
  const response = await fetch(`/api/leaderboard?period=${period}&applications=${applicationsParam}&sortBy=cost&sortOrder=desc&pageSize=100`);
  // ... rest of function
}, [period, selectedApplications]);
```

#### 4.2 Additional UI Considerations
- Add visual indicators for which applications are selected
- Show application-specific statistics in tooltips or additional columns
- Handle loading states when switching applications
- Consider application-specific color coding or icons

### 5. Database Migration

#### 5.1 Migration Script
```sql
-- Add application column with default value
ALTER TABLE user_stats ADD COLUMN application VARCHAR(20) NOT NULL DEFAULT 'Claude';

-- Drop existing unique constraint
ALTER TABLE user_stats DROP CONSTRAINT IF EXISTS user_stats_userId_period_key;

-- Add new unique constraint including application
ALTER TABLE user_stats ADD CONSTRAINT user_stats_userId_period_application_key 
  UNIQUE (userId, period, application);

-- Add index for performance
CREATE INDEX idx_user_stats_application_period ON user_stats(application, period);
```

#### 5.2 Data Migration
- Existing records will automatically have `application = "Claude"`
- No data loss or corruption expected
- Backward compatibility maintained

### 6. Testing Strategy

#### 6.1 Database Testing
- Test unique constraint with multiple applications
- Verify aggregation queries work correctly
- Test migration on copy of production data

#### 6.2 API Testing
- Test leaderboard API with various application combinations
- Test upload stats API with different application sources
- Verify backward compatibility with existing clients

#### 6.3 Frontend Testing
- Test application selection UI
- Verify data updates when changing selections
- Test edge cases (no applications selected, single application, etc.)

### 7. Deployment Strategy

#### 7.1 Phase 1: Backend Infrastructure
1. Deploy database schema changes
2. Update API endpoints with backward compatibility
3. Deploy type system updates

#### 7.2 Phase 2: Frontend Features
1. Deploy application selection UI
2. Update leaderboard to use new API parameters
3. Test end-to-end functionality

#### 7.3 Phase 3: CLI Integration
1. Update CLI tools to send application identification
2. Monitor data collection for new applications
3. Verify statistics are properly separated by application

### 8. Backward Compatibility

#### 8.1 API Compatibility
- Existing API calls without `applications` parameter will show all applications
- Upload stats API will default to "Claude" if no application specified
- No breaking changes to existing endpoints

#### 8.2 Data Compatibility
- Existing UserStats records will have `application = "Claude"`
- No data migration required for existing statistics
- Future statistics will be properly categorized by application

### 9. Performance Considerations

#### 9.1 Database Performance
- Add indexes on `application` field for faster filtering
- Consider query optimization for multi-application aggregation
- Monitor query performance after deployment

#### 9.2 Frontend Performance
- Implement efficient state management for application selection
- Consider caching strategies for different application combinations
- Optimize re-renders when changing selections

### 10. Future Enhancements

#### 10.1 Analytics
- Application-specific trend analysis
- Cross-application usage comparison
- Market share analytics for different CLI tools

#### 10.2 UI/UX Improvements
- Application-specific themes or branding
- Advanced filtering and comparison views
- Export functionality for multi-application data

## Files to Modify

1. `prisma/schema.prisma` - Add application column and update constraints
2. `src/app/api/upload-stats/route.ts` - Add application detection and storage
3. `src/app/api/leaderboard/route.ts` - Add application filtering
4. `src/types/index.ts` - Add application types and update interfaces
5. `src/app/leaderboard-data-table.tsx` - Add application selection UI

## Success Criteria

- Users can select any combination of CLI applications to view
- Statistics are properly separated and aggregated by application
- Leaderboard rankings work correctly for single and multi-application views
- Backward compatibility is maintained for existing data and API clients
- Performance remains acceptable with new filtering capabilities
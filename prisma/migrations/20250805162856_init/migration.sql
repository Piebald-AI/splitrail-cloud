-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "githubId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_stats" (
    "globalHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "application" TEXT NOT NULL DEFAULT 'claude_code',
    "role" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "projectHash" TEXT NOT NULL,
    "conversationHash" TEXT NOT NULL,
    "localHash" TEXT,
    "inputTokens" BIGINT NOT NULL,
    "outputTokens" BIGINT NOT NULL,
    "cacheCreationTokens" BIGINT NOT NULL,
    "cacheReadTokens" BIGINT NOT NULL,
    "cachedTokens" BIGINT NOT NULL,
    "cost" DOUBLE PRECISION,
    "model" TEXT,
    "toolCalls" BIGINT NOT NULL,
    "fileTypes" JSONB,
    "terminalCommands" BIGINT NOT NULL,
    "fileSearches" BIGINT NOT NULL,
    "fileContentSearches" BIGINT NOT NULL,
    "filesRead" BIGINT NOT NULL,
    "filesAdded" BIGINT NOT NULL,
    "filesEdited" BIGINT NOT NULL,
    "filesDeleted" BIGINT NOT NULL,
    "linesRead" BIGINT NOT NULL,
    "linesEdited" BIGINT NOT NULL,
    "linesAdded" BIGINT NOT NULL,
    "linesDeleted" BIGINT NOT NULL,
    "bytesRead" BIGINT NOT NULL,
    "bytesAdded" BIGINT NOT NULL,
    "bytesEdited" BIGINT NOT NULL,
    "bytesDeleted" BIGINT NOT NULL,
    "codeLines" BIGINT NOT NULL,
    "docsLines" BIGINT NOT NULL,
    "dataLines" BIGINT NOT NULL,
    "mediaLines" BIGINT NOT NULL,
    "configLines" BIGINT NOT NULL,
    "otherLines" BIGINT NOT NULL,
    "todosCreated" BIGINT NOT NULL DEFAULT 0,
    "todosCompleted" BIGINT NOT NULL DEFAULT 0,
    "todosInProgress" BIGINT NOT NULL DEFAULT 0,
    "todoWrites" BIGINT NOT NULL DEFAULT 0,
    "todoReads" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "message_stats_pkey" PRIMARY KEY ("globalHash")
);

-- CreateTable
CREATE TABLE "user_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "application" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "toolCalls" BIGINT NOT NULL DEFAULT 0,
    "assistantMessages" BIGINT NOT NULL DEFAULT 0,
    "userMessages" BIGINT NOT NULL DEFAULT 0,
    "inputTokens" BIGINT NOT NULL DEFAULT 0,
    "outputTokens" BIGINT NOT NULL DEFAULT 0,
    "cacheCreationTokens" BIGINT NOT NULL DEFAULT 0,
    "cacheReadTokens" BIGINT NOT NULL DEFAULT 0,
    "cachedTokens" BIGINT NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "filesRead" BIGINT NOT NULL DEFAULT 0,
    "filesAdded" BIGINT NOT NULL DEFAULT 0,
    "filesEdited" BIGINT NOT NULL DEFAULT 0,
    "filesDeleted" BIGINT NOT NULL DEFAULT 0,
    "linesRead" BIGINT NOT NULL DEFAULT 0,
    "linesAdded" BIGINT NOT NULL DEFAULT 0,
    "linesEdited" BIGINT NOT NULL DEFAULT 0,
    "linesDeleted" BIGINT NOT NULL DEFAULT 0,
    "bytesRead" BIGINT NOT NULL DEFAULT 0,
    "bytesAdded" BIGINT NOT NULL DEFAULT 0,
    "bytesEdited" BIGINT NOT NULL DEFAULT 0,
    "bytesDeleted" BIGINT NOT NULL DEFAULT 0,
    "codeLines" BIGINT NOT NULL DEFAULT 0,
    "docsLines" BIGINT NOT NULL DEFAULT 0,
    "dataLines" BIGINT NOT NULL DEFAULT 0,
    "mediaLines" BIGINT NOT NULL DEFAULT 0,
    "configLines" BIGINT NOT NULL DEFAULT 0,
    "otherLines" BIGINT NOT NULL DEFAULT 0,
    "terminalCommands" BIGINT NOT NULL DEFAULT 0,
    "fileSearches" BIGINT NOT NULL DEFAULT 0,
    "fileContentSearches" BIGINT NOT NULL DEFAULT 0,
    "todosCreated" BIGINT NOT NULL DEFAULT 0,
    "todosCompleted" BIGINT NOT NULL DEFAULT 0,
    "todosInProgress" BIGINT NOT NULL DEFAULT 0,
    "todoWrites" BIGINT NOT NULL DEFAULT 0,
    "todoReads" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "api_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'CLI Token',
    "lastUsed" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "openSource" BOOLEAN NOT NULL DEFAULT false,
    "githubLink" TEXT,
    "websiteLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder_projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folder_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "message_stats_userId_date_idx" ON "message_stats"("userId", "date");

-- CreateIndex
CREATE INDEX "message_stats_date_idx" ON "message_stats"("date");

-- CreateIndex
CREATE INDEX "message_stats_application_date_idx" ON "message_stats"("application", "date");

-- CreateIndex
CREATE INDEX "user_stats_application_period_idx" ON "user_stats"("application", "period");

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_userId_period_application_key" ON "user_stats"("userId", "period", "application");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_token_key" ON "api_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_key" ON "projects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "folder_projects_userId_folder_key" ON "folder_projects"("userId", "folder");

-- AddForeignKey
ALTER TABLE "message_stats" ADD CONSTRAINT "message_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_projects" ADD CONSTRAINT "folder_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_projects" ADD CONSTRAINT "folder_projects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

// prettier-ignore
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

interface SampleUser {
  githubId: string;
  username: string;
  displayName: string | null;
  email: string;
  multiplier: number;
}

// Generate a large number of sample users
const generateSampleUsers = (count: number): SampleUser[] => {
  const adjectives = [
    "Swift", "Clever", "Brilliant", "Dynamic", "Expert", "Master", "Senior", "Lead",
    "Principal", "Ninja", "Wizard", "Guru", "Pro", "Elite", "Advanced", "Skilled",
    "Talented", "Creative", "Innovative", "Agile", "Quantum", "Digital", "Cyber",
    "Smart", "Super", "Ultra", "Mega", "Turbo", "Power", "Lightning", "Thunder"
  ];
  
  const nouns = [
    "Coder", "Developer", "Engineer", "Architect", "Builder", "Creator", "Maker",
    "Hacker", "Programmer", "Designer", "Analyst", "Specialist", "Expert", "Consultant",
    "Craftsman", "Artisan", "Technician", "Professional", "Innovator", "Pioneer",
    "Researcher", "Scientist", "Strategist", "Optimizer", "Debugger", "Tester"
  ];
  
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = String(i + 1).padStart(4, '0');
    
    // Generate a multiplier based on a normal distribution
    // Most users will be around 1.0, with fewer outliers
    const randomGaussian = () => {
      let u = 0, v = 0;
      while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
      while(v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };
    
    // Create a bell curve centered at 1.0 with std dev of 0.3
    let multiplier = 1.0 + (randomGaussian() * 0.3);
    // Clamp between 0.1 and 3.0
    multiplier = Math.max(0.1, Math.min(3.0, multiplier));
    
    // Randomly decide if this user should have a display name (70% chance)
    const hasDisplayName = Math.random() < 0.7;
    
    users.push({
      githubId: `github_${num}`,
      username: `${adj.toLowerCase()}${noun.toLowerCase()}${num}`,
      displayName: hasDisplayName ? `${adj} ${noun} ${num}` : null,
      email: `${adj.toLowerCase()}.${noun.toLowerCase()}.${num}@example.com`,
      multiplier: parseFloat(multiplier.toFixed(2)),
    });
  }
  
  // Add a few specific high-performers and low-performers
  const specialUsers = [
    {
      githubId: "github_elite_001",
      username: "elitecoder001",
      displayName: "Elite Coder #1",
      email: "elite.coder.001@example.com",
      multiplier: 2.8,
    },
    {
      githubId: "github_top_002",
      username: "topdev002",
      displayName: null, // No display name for this user
      email: "top.dev.002@example.com",
      multiplier: 2.5,
    },
    {
      githubId: "github_pro_003",
      username: "procoder003",
      displayName: "Pro Coder #3",
      email: "pro.coder.003@example.com",
      multiplier: 2.2,
    },
    {
      githubId: "github_beginner_001",
      username: "beginnercoder001",
      displayName: null, // No display name for this user
      email: "beginner.coder.001@example.com",
      multiplier: 0.3,
    },
    {
      githubId: "github_learner_002",
      username: "learnerdev002",
      displayName: "Learner Developer #2",
      email: "learner.dev.002@example.com",
      multiplier: 0.4,
    },
  ];
  
  return [...specialUsers, ...users];
};

const sampleUsers = generateSampleUsers(295); // This will create 300 total users (5 special + 295 generated)

function generateNumber(dynamicMin: number, staticMin: number, multiplier: number, variation: number): bigint {
  return BigInt(Math.round(Math.random() * (dynamicMin + staticMin) * multiplier * variation));
}

// Generate stats matching the UserStats schema (without the 'tokens' field which is calculated)
function generateStats(baseMultiplier: number, periodMultiplier: number, application?: string) {
  const m = baseMultiplier * periodMultiplier;
  const v = Math.random() * 0.4 + 0.8; // 0.8 to 1.2 variation
  
  // Realistic token values based on research: 1,000-5,000 tokens per coding interaction
  // Period multipliers will scale these appropriately
  const baseTokensPerMessage = 2000; // Average across user/assistant messages
  const messagesPerDay = 50; // Typical active coding day
  
  const inputTokens = generateNumber(baseTokensPerMessage * messagesPerDay * 0.6, baseTokensPerMessage * messagesPerDay * 0.3, m, v);
  const outputTokens = generateNumber(baseTokensPerMessage * messagesPerDay * 0.4, baseTokensPerMessage * messagesPerDay * 0.2, m, v);
  const cacheCreationTokens = generateNumber(baseTokensPerMessage * messagesPerDay * 0.1, baseTokensPerMessage * messagesPerDay * 0.05, m, v);
  const cacheReadTokens = generateNumber(baseTokensPerMessage * messagesPerDay * 0.15, baseTokensPerMessage * messagesPerDay * 0.08, m, v);
  const cachedTokens = cacheCreationTokens + cacheReadTokens;
  
  // Calculate realistic cost based on token usage and model pricing
  let cost = 0;
  if (application) {
    // Use average pricing for the application's models
    const inputTokensNum = Number(inputTokens);
    const outputTokensNum = Number(outputTokens);
    const cacheCreationTokensNum = Number(cacheCreationTokens);
    const cacheReadTokensNum = Number(cacheReadTokens);
    
    if (application === "claude_code") {
      // Average of Claude models: mostly Sonnet (70%), some Haiku (20%), rare Opus (10%)
      const avgInputCost = (0.7 * 3 + 0.2 * 0.8 + 0.1 * 15) / 1000; // per 1k tokens
      const avgOutputCost = (0.7 * 15 + 0.2 * 4 + 0.1 * 75) / 1000;
      const avgCacheWriteCost = (0.7 * 3.75 + 0.2 * 1 + 0.1 * 18.75) / 1000;
      const avgCacheReadCost = (0.7 * 0.3 + 0.2 * 0.08 + 0.1 * 1.5) / 1000;
      
      cost = (inputTokensNum / 1000) * avgInputCost +
             (outputTokensNum / 1000) * avgOutputCost +
             (cacheCreationTokensNum / 1000) * avgCacheWriteCost +
             (cacheReadTokensNum / 1000) * avgCacheReadCost;
    } else if (application === "gemini_cli") {
      // Average of Gemini models: mostly Flash (60%), some Pro (30%), some 2.0 Flash (10%)
      const avgInputCost = (0.6 * 0.075 + 0.3 * 1.25 + 0.1 * 0.1) / 1000;
      const avgOutputCost = (0.6 * 0.3 + 0.3 * 5 + 0.1 * 0.4) / 1000;
      const avgCachedCost = (0.6 * 0.01875 + 0.3 * 0.3125 + 0.1 * 0.025) / 1000;
      
      cost = (inputTokensNum / 1000) * avgInputCost +
             (outputTokensNum / 1000) * avgOutputCost +
             (Number(cachedTokens) / 1000) * avgCachedCost;
    } else if (application === "codex_cli") {
      // Average of OpenAI models: mostly 4o-mini (70%), some 4o (20%), some o3-mini (10%)
      const avgInputCost = (0.7 * 0.15 + 0.2 * 2.5 + 0.1 * 1.1) / 1000;
      const avgOutputCost = (0.7 * 0.6 + 0.2 * 10 + 0.1 * 4.4) / 1000;
      const avgCachedCost = (0.7 * 0.075 + 0.2 * 1.25 + 0.1 * 0.55) / 1000;
      
      cost = (inputTokensNum / 1000) * avgInputCost +
             (outputTokensNum / 1000) * avgOutputCost +
             (Number(cachedTokens) / 1000) * avgCachedCost;
    }
  } else {
    // Fallback cost calculation
    cost = Number(generateNumber(Math.round(m * 50), Math.round(m * 25), 1, v)) / 100;
  }
  
  return {
    toolCalls: generateNumber(25, 10, m, v),
    assistantMessages: generateNumber(40, 20, m, v),
    userMessages: generateNumber(40, 20, m, v),
    inputTokens,
    outputTokens,
    cacheCreationTokens,
    cacheReadTokens,
    cachedTokens,
    cost: Math.round(cost * 1000) / 1000,
    filesRead: generateNumber(80, 30, m, v),
    filesAdded: generateNumber(15, 5, m, v),
    filesEdited: generateNumber(25, 10, m, v),
    filesDeleted: generateNumber(15, 5, m, v),
    linesRead: generateNumber(8000, 3000, m, v),
    linesAdded: generateNumber(600, 200, m, v),
    linesEdited: generateNumber(800, 300, m, v),
    linesDeleted: generateNumber(600, 200, m, v),
    bytesRead: generateNumber(150000, 50000, m, v),
    bytesAdded: generateNumber(30000, 10000, m, v),
    bytesEdited: generateNumber(30000, 10000, m, v),
    bytesDeleted: generateNumber(25000, 8000, m, v),
    codeLines: generateNumber(600, 200, m, v),
    docsLines: generateNumber(600, 200, m, v),
    dataLines: generateNumber(600, 200, m, v),
    mediaLines: generateNumber(600, 200, m, v),
    configLines: generateNumber(600, 200, m, v),
    otherLines: generateNumber(600, 200, m, v),
    terminalCommands: generateNumber(15, 5, m, v),
    fileSearches: generateNumber(12, 3, m, v),
    fileContentSearches: generateNumber(18, 5, m, v),
    todosCreated: generateNumber(8, 2, m, v),
    todosCompleted: generateNumber(12, 4, m, v),
    todosInProgress: generateNumber(4, 1, m, v),
    todoWrites: generateNumber(10, 3, m, v),
    todoReads: generateNumber(15, 5, m, v),
    // Note: 'tokens' field is not stored in DB, it's calculated on the fly
  };
}

function getPeriodDates() {
  const now = new Date();
  
  // Current hour
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
  const hourEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 59, 59, 999);
  
  // Current day
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  // Current week (Monday start)
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000 + 999);
  
  // Current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  // Current year
  const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  
  return {
    hourly: { start: hourStart, end: hourEnd },
    daily: { start: dayStart, end: dayEnd },
    weekly: { start: weekStart, end: weekEnd },
    monthly: { start: monthStart, end: monthEnd },
    yearly: { start: yearStart, end: yearEnd },
  };
}

async function clearDatabase() {
  console.log("🧹 Clearing existing data...");
  
  await prisma.messageStats.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.apiToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  
  console.log("✅ Database cleared");
}

// Helpers to generate realistic message_stats rows for the stats API
const APPLICATIONS = ["claude_code", "gemini_cli", "codex_cli", "github_copilot"] as const;
const MODELS_BY_APP: Record<(typeof APPLICATIONS)[number], string[]> = {
  claude_code: [
    "claude-3.7-sonnet",
    "claude-3.5-sonnet",
    "claude-3.5-haiku",
    "claude-3-opus",
  ],
  gemini_cli: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"],
  codex_cli: ["gpt-4o-mini", "gpt-4o", "o3-mini"],
  github_copilot: ["gpt-4o", "gpt-4o-mini"],
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function gaussian(mean = 0, std = 1) {
  // Box–Muller
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Scale a base amount by user/app intensity with small randomness; clamp >= 0
function scaled(base: number, intensity: number) {
  const jitter = 0.8 + Math.random() * 0.4; // 0.8..1.2
  return Math.max(0, Math.round(base * intensity * jitter));
}

function makeHash(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(36)}`;
}

function daysAgoUTC(days: number) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0); // mid-day UTC to avoid TZ rollovers
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

async function createMessageStats(users: Array<{ id: string; multiplier: number }>) {
  console.log("💬 Creating detailed message statistics...");

  // Per-application usage distribution (sum to 1.0)
  const appWeights: Record<(typeof APPLICATIONS)[number], number> = {
    claude_code: 0.5,
    gemini_cli: 0.25,
    codex_cli: 0.1,
    github_copilot: 0.15,
  };

  // Simulate up to this many days of history
  const maxHistoryDays = 120;

  // Batch insertion to keep memory reasonable
  const batchSize = 5000;

  let totalInserted = 0;
  // Use explicit CreateMany input element type
  let buffer: Prisma.MessageStatsCreateManyInput[] = [];

  for (const user of users) {
    // For each app, generate conversations spread across days
    for (const app of APPLICATIONS) {
      const appIntensity = user.multiplier * appWeights[app];

      // Determine number of active days for this app for this user
      const activeDays = Math.max(10, Math.min(maxHistoryDays, Math.round(40 * appIntensity + randInt(-4, 8))));
      // Choose unique day offsets where activity happens
      const dayOffsets = new Set<number>();
      while (dayOffsets.size < activeDays) {
        dayOffsets.add(randInt(0, maxHistoryDays));
      }

      for (const dayOffset of dayOffsets) {
        const day = daysAgoUTC(dayOffset);

        // Conversations starting this day (used by API to count daily conversations)
        const conversationsToday = Math.max(0, Math.round(gaussian(1 + 2 * appIntensity, 1)));
        for (let c = 0; c < conversationsToday; c++) {
          const conversationHash = makeHash("conv");
          const projectHash = makeHash("proj");

          // Messages in this conversation
          const messagesInConv = Math.max(3, Math.round(gaussian(8, 4)));
          const model = pickOne(MODELS_BY_APP[app]);

          // Base scales per message - based on realistic AI coding assistant usage
          // Research shows typical coding tasks use 1,000-5,000 tokens per interaction
          const tokenBase = 1500; // average tokens per message
          const toolBase = 3; // typical tool calls per message
          const lineReadBase = 150; // ~15 lines of code read per message (at ~10 tokens/line)
          const lineEditBase = 20; // ~2 lines edited per message

          for (let m = 0; m < messagesInConv; m++) {
            // Distribute timestamps within the day
            const msgDate = new Date(
              Date.UTC(
                day.getUTCFullYear(),
                day.getUTCMonth(),
                day.getUTCDate(),
                randInt(8, 22), // working hours UTC-ish
                randInt(0, 59),
                randInt(0, 59),
                randInt(0, 999)
              )
            );

            const isAssistant = m % 2 === 1; // alternate user/assistant
            const role = isAssistant ? "assistant" : "user";

            const tokenScale = tokenBase * (isAssistant ? 1.4 : 0.6);
            const inputTokens = scaled(tokenScale * 0.7, appIntensity);
            const outputTokens = scaled(tokenScale * 0.5, appIntensity);
            const cacheCreationTokens = scaled(tokenScale * 0.15, appIntensity);
            const cacheReadTokens = scaled(tokenScale * 0.2, appIntensity);
            const cachedTokens = cacheCreationTokens + cacheReadTokens;

            const toolCalls = scaled(toolBase * (isAssistant ? 1.3 : 0.3), appIntensity);
            const linesRead = scaled(lineReadBase * (isAssistant ? 1.1 : 0.9), appIntensity);
            const linesEdited = scaled(lineEditBase * (isAssistant ? 1.0 : 0.3), appIntensity);
            const linesAdded = scaled(lineEditBase * (isAssistant ? 0.8 : 0.2), appIntensity);
            const linesDeleted = scaled(lineEditBase * (isAssistant ? 0.4 : 0.1), appIntensity);

            const filesRead = scaled(3, appIntensity);
            const filesAdded = scaled(1, appIntensity);
            const filesEdited = scaled(2, appIntensity);
            const filesDeleted = scaled(1, appIntensity);

            const bytesRead = scaled(50_000, appIntensity);
            const bytesAdded = scaled(8_000, appIntensity);
            const bytesEdited = scaled(10_000, appIntensity);
            const bytesDeleted = scaled(5_000, appIntensity);

            const codeLines = scaled(120, appIntensity);
            const docsLines = scaled(40, appIntensity);
            const dataLines = scaled(15, appIntensity);
            const mediaLines = scaled(3, appIntensity);
            const configLines = scaled(20, appIntensity);
            const otherLines = scaled(10, appIntensity);

            const terminalCommands = scaled(1.2, appIntensity);
            const fileSearches = scaled(1, appIntensity);
            const fileContentSearches = scaled(2, appIntensity);

            const todosCreated = scaled(0.3, appIntensity);
            const todosCompleted = scaled(0.5, appIntensity);
            const todosInProgress = scaled(0.2, appIntensity);
            const todoWrites = scaled(0.4, appIntensity);
            const todoReads = scaled(0.7, appIntensity);

            // Calculate cost based on actual model pricing from MODEL_PRICES.md
            // Prices are per million tokens, so divide by 1000 to get per 1k tokens
            let inputCostPerK = 0;
            let outputCostPerK = 0;
            let cachedCostPerK = 0;
            
            if (app === "claude_code") {
              // Use different Claude models with realistic distribution
              if (model === "claude-3.7-sonnet" || model === "claude-3.5-sonnet") {
                inputCostPerK = 3 / 1000; // $3 per million
                outputCostPerK = 15 / 1000; // $15 per million
                // For cache, we have creation and read tokens
                const cacheWriteCostPerK = 3.75 / 1000; // $3.75 per million for writes
                const cacheReadCostPerK = 0.3 / 1000; // $0.30 per million for reads
                cachedCostPerK = (cacheCreationTokens / 1000) * cacheWriteCostPerK + (cacheReadTokens / 1000) * cacheReadCostPerK;
              } else if (model === "claude-3.5-haiku") {
                inputCostPerK = 0.8 / 1000;
                outputCostPerK = 4 / 1000;
                const cacheWriteCostPerK = 1 / 1000;
                const cacheReadCostPerK = 0.08 / 1000;
                cachedCostPerK = (cacheCreationTokens / 1000) * cacheWriteCostPerK + (cacheReadTokens / 1000) * cacheReadCostPerK;
              } else if (model === "claude-3-opus") {
                inputCostPerK = 15 / 1000;
                outputCostPerK = 75 / 1000;
                const cacheWriteCostPerK = 18.75 / 1000;
                const cacheReadCostPerK = 1.5 / 1000;
                cachedCostPerK = (cacheCreationTokens / 1000) * cacheWriteCostPerK + (cacheReadTokens / 1000) * cacheReadCostPerK;
              }
            } else if (app === "gemini_cli") {
              // Gemini models
              if (model === "gemini-1.5-pro") {
                // Assuming <=128k tokens for typical usage
                inputCostPerK = 1.25 / 1000;
                outputCostPerK = 5 / 1000;
                cachedCostPerK = 0.3125 / 1000;
              } else if (model === "gemini-1.5-flash") {
                inputCostPerK = 0.075 / 1000;
                outputCostPerK = 0.3 / 1000;
                cachedCostPerK = 0.01875 / 1000;
              } else if (model === "gemini-2.0-flash") {
                inputCostPerK = 0.1 / 1000;
                outputCostPerK = 0.4 / 1000;
                cachedCostPerK = 0.025 / 1000;
              }
            } else if (app === "codex_cli") {
              // OpenAI models
              if (model === "gpt-4o-mini") {
                inputCostPerK = 0.15 / 1000;
                outputCostPerK = 0.6 / 1000;
                cachedCostPerK = 0.075 / 1000;
              } else if (model === "gpt-4o") {
                inputCostPerK = 2.5 / 1000;
                outputCostPerK = 10 / 1000;
                cachedCostPerK = 1.25 / 1000;
              } else if (model === "o3-mini") {
                inputCostPerK = 1.1 / 1000;
                outputCostPerK = 4.4 / 1000;
                cachedCostPerK = 0.55 / 1000;
              }
            } else if (app === "github_copilot") {
              // GitHub Copilot models (OpenAI pricing)
              if (model === "gpt-4o-mini") {
                inputCostPerK = 0.15 / 1000;
                outputCostPerK = 0.6 / 1000;
                cachedCostPerK = 0.075 / 1000;
              } else if (model === "gpt-4o") {
                inputCostPerK = 2.5 / 1000;
                outputCostPerK = 10 / 1000;
                cachedCostPerK = 1.25 / 1000;
              }
            }

            // Calculate total cost
            const inputCost = (inputTokens / 1000) * inputCostPerK;
            const outputCost = (outputTokens / 1000) * outputCostPerK;
            const cacheCost = app === "claude_code" ? cachedCostPerK : (cachedTokens / 1000) * cachedCostPerK;
            const cost = Math.round((inputCost + outputCost + cacheCost) * 1000) / 1000;

            buffer.push({
              globalHash: makeHash("msg"),
              userId: user.id,
              application: app,
              role,
              date: msgDate,
              projectHash,
              conversationHash,
              localHash: null,
              inputTokens: BigInt(inputTokens),
              outputTokens: BigInt(outputTokens),
              cacheCreationTokens: BigInt(cacheCreationTokens),
              cacheReadTokens: BigInt(cacheReadTokens),
              cachedTokens: BigInt(cachedTokens),
              cost,
              model,
              toolCalls: BigInt(toolCalls),
              // Use Prisma.DbNull to represent null JSON in Prisma
              fileTypes: Prisma.DbNull,
              terminalCommands: BigInt(terminalCommands),
              fileSearches: BigInt(fileSearches),
              fileContentSearches: BigInt(fileContentSearches),
              filesRead: BigInt(filesRead),
              filesAdded: BigInt(filesAdded),
              filesEdited: BigInt(filesEdited),
              filesDeleted: BigInt(filesDeleted),
              linesRead: BigInt(linesRead),
              linesEdited: BigInt(linesEdited),
              linesAdded: BigInt(linesAdded),
              linesDeleted: BigInt(linesDeleted),
              bytesRead: BigInt(bytesRead),
              bytesAdded: BigInt(bytesAdded),
              bytesEdited: BigInt(bytesEdited),
              bytesDeleted: BigInt(bytesDeleted),
              codeLines: BigInt(codeLines),
              docsLines: BigInt(docsLines),
              dataLines: BigInt(dataLines),
              mediaLines: BigInt(mediaLines),
              configLines: BigInt(configLines),
              otherLines: BigInt(otherLines),
              todosCreated: BigInt(todosCreated),
              todosCompleted: BigInt(todosCompleted),
              todosInProgress: BigInt(todosInProgress),
              todoWrites: BigInt(todoWrites),
              todoReads: BigInt(todoReads),
            });

            if (buffer.length >= batchSize) {
              const inserted = await prisma.messageStats.createMany({
                data: buffer,
                skipDuplicates: true,
              });
              totalInserted += inserted.count ?? buffer.length;
              buffer = [];
            }
          }
        }
      }
    }
  }

  if (buffer.length > 0) {
    const inserted = await prisma.messageStats.createMany({
      data: buffer,
      skipDuplicates: true,
    });
    totalInserted += inserted.count ?? buffer.length;
    buffer = [];
  }

  console.log(`✅ Inserted ~${totalInserted.toLocaleString()} message stats rows`);
}

async function createUsers() {
  console.log("👤 Creating users...");
  
  const users = await Promise.all(
    sampleUsers.map(userData => 
      prisma.user.create({
        data: {
          githubId: userData.githubId,
          username: userData.username,
          displayName: userData.displayName,
          avatarUrl: `https://github.com/${userData.username}.png`,
          email: userData.email,
          preferences: {
            create: {
              currency: "USD",
              publicProfile: true,
            },
          },
        },
      })
    )
  );
  
  console.log(`✅ Created ${users.length} users`);
  return users.map((user, index) => ({
    ...user,
    multiplier: sampleUsers[index].multiplier
  }));
}

async function createPeriodStats(users: Array<{ id: string; multiplier: number }>) {
  console.log("📊 Creating period statistics...");
  
  const periods = getPeriodDates();
  const applications = ["claude_code", "gemini_cli", "codex_cli"] as const;
  
  // Period multipliers (how much activity in each period)
  const periodMultipliers = {
    hourly: 0.1,   // 10% of daily activity in current hour
    daily: 1.0,    // Base daily activity
    weekly: 6.5,   // About 6.5 days worth of activity
    monthly: 22,   // About 22 working days
    yearly: 250,   // About 250 working days
  };
  
  // Application usage distribution for each user
  const applicationWeights = {
    claude_code: 0.6,   // 60% usage
    gemini_cli: 0.3,    // 30% usage
    codex_cli: 0.1,     // 10% usage
  };
  
  let processedUsers = 0;
  const totalUsers = users.length;
  
  for (const user of users) {
    // Create stats for each period
    const periodConfigs = [
      { period: "hourly", multiplier: periodMultipliers.hourly, start: periods.hourly.start, end: periods.hourly.end },
      { period: "daily", multiplier: periodMultipliers.daily, start: periods.daily.start, end: periods.daily.end },
      { period: "weekly", multiplier: periodMultipliers.weekly, start: periods.weekly.start, end: periods.weekly.end },
      { period: "monthly", multiplier: periodMultipliers.monthly, start: periods.monthly.start, end: periods.monthly.end },
      { period: "yearly", multiplier: periodMultipliers.yearly, start: periods.yearly.start, end: periods.yearly.end },
    ];

    // Batch all stats for this user
    const userStatsData = [];
    
    for (const config of periodConfigs) {
      // Create stats for each application
      for (const application of applications) {
        // Apply application weight to the stats
        const appWeight = applicationWeights[application];
        const stats = generateStats(user.multiplier * appWeight, config.multiplier, application);
        
        userStatsData.push({
          userId: user.id,
          period: config.period,
          periodStart: config.start,
          periodEnd: config.end,
          application,
          ...stats,
        });
      }
    }
    
    // Batch insert all stats for this user
    await prisma.userStats.createMany({
      data: userStatsData,
    });
    
    processedUsers++;
    if (processedUsers % 50 === 0) {
      console.log(`  📈 Progress: ${processedUsers}/${totalUsers} users processed`);
    }
  }
  
  const totalStats = users.length * 5 * applications.length; // 5 periods, 3 applications
  console.log(`✅ Created ${totalStats.toLocaleString()} period statistics for ${users.length} users`);
}

async function createApiTokens(users: Array<{ id: string; username?: string }>) {
  console.log("🔑 Creating API tokens...");
  
  const tokenData = users.map(user => ({
    userId: user.id,
    token: `st_${user.username}_${Math.random().toString(36).substring(2, 15)}`,
    name: "CLI Token",
  }));
  
  // Batch insert all tokens
  await prisma.apiToken.createMany({
    data: tokenData,
  });
  
  console.log(`✅ Created API tokens for ${users.length} users`);
}

async function main() {
  console.log("🌱 Starting database seed...");
  
  await clearDatabase();
  const users = await createUsers();

  // Insert granular message_stats first so the stats API has raw data to aggregate
  await createMessageStats(users);

  // Keep pre-aggregated period stats for leaderboard API and fast queries
  await createPeriodStats(users);

  // Issue API tokens so the CLI can authenticate
  await createApiTokens(users);
  
  console.log("🎉 Database seeding completed!");
  console.log("");
  console.log("📊 Summary:");
  console.log(`  • ${users.length} users created`);
  console.log(`  • ${(users.length * 5 * 3).toLocaleString()} total UserStats records`);
  console.log(`  • ${users.length} API tokens created`);
  console.log("  • MessageStats generated for up to 120 days, 3 applications, multiple conversations/day");
  console.log("");
  console.log("📈 Generated data for all time periods:");
  console.log("  • Hourly (current hour)");
  console.log("  • Daily (current day)");
  console.log("  • Weekly (current week)");
  console.log("  • Monthly (current month)");
  console.log("  • Yearly (current year)");
  console.log("");
  console.log("🚀 Generated data for all applications:");
  console.log("  • Claude Code (60% usage)");
  console.log("  • Gemini CLI (30% usage)");
  console.log("  • Codex CLI (10% usage)");
  console.log("");
  console.log("📈 User distribution:");
  console.log("  • Most users have multipliers around 1.0 (normal distribution)");
  console.log("  • ~70% of users have display names, ~30% only have usernames");
  console.log("  • Top performers: Elite Coder #1 (2.8x), topdev002 (2.5x), Pro Coder #3 (2.2x)");
  console.log("  • Beginners: beginnercoder001 (0.3x), Learner Developer #2 (0.4x)");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

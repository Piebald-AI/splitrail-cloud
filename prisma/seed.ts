import { UserStats } from "@/types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleUsers = [
  {
    githubId: "12345",
    username: "codecrafter",
    displayName: "Code Crafter",
    email: "code@example.com",
    multiplier: 1.8,
  },
  {
    githubId: "12346", 
    username: "aidev",
    displayName: "AI Developer",
    email: "ai@example.com",
    multiplier: 1.5,
  },
  {
    githubId: "12347",
    username: "scriptmaster",
    displayName: "Script Master", 
    email: "script@example.com",
    multiplier: 1.2,
  },
  {
    githubId: "12348",
    username: "debugger",
    displayName: "The Debugger",
    email: "debug@example.com", 
    multiplier: 1.0,
  },
  {
    githubId: "12349",
    username: "novice",
    displayName: "Novice Coder",
    email: "novice@example.com",
    multiplier: 0.6,
  }
];

function generateStats(baseMultiplier: number, periodMultiplier: number): UserStats {
  const multiplier = baseMultiplier * periodMultiplier;
  const variation = Math.random() * 0.4 + 0.8; // 0.8 to 1.2 variation
  
  return {
    toolsCalled: Math.round((Math.random() * 25 + 10) * multiplier * variation),
    messagesSent: Math.round((Math.random() * 40 + 20) * multiplier * variation),
    inputTokens: Math.round((Math.random() * 15000 + 8000) * multiplier * variation),
    outputTokens: Math.round((Math.random() * 8000 + 4000) * multiplier * variation),
    cacheCreationTokens: Math.round((Math.random() * 3000 + 1500) * multiplier * variation),
    cacheReadTokens: Math.round((Math.random() * 5000 + 2500) * multiplier * variation),
    cost: Math.round((Math.random() * 75 + 25) * multiplier * variation * 100) / 100,
    filesRead: Math.round((Math.random() * 80 + 30) * multiplier * variation),
    filesAdded: Math.round((Math.random() * 15 + 5) * multiplier * variation),
    filesEdited: Math.round((Math.random() * 25 + 10) * multiplier * variation),
    filesDeleted: Math.round((Math.random() * 15 + 5) * multiplier * variation),
    linesRead: Math.round((Math.random() * 8000 + 3000) * multiplier * variation),
    linesAdded: Math.round((Math.random() * 600 + 200) * multiplier * variation),
    linesEdited: Math.round((Math.random() * 800 + 300) * multiplier * variation),
    linesDeleted: Math.round((Math.random() * 600 + 200) * multiplier * variation),
    bytesRead: Math.round((Math.random() * 150000 + 50000) * multiplier * variation),
    bytesAdded: Math.round((Math.random() * 30000 + 10000) * multiplier * variation),
    bytesEdited: Math.round((Math.random() * 30000 + 10000) * multiplier * variation),
    bytesDeleted: Math.round((Math.random() * 25000 + 8000) * multiplier * variation),
    codeLines: Math.round((Math.random() * 600 + 200) * multiplier * variation),
    docsLines: Math.round((Math.random() * 600 + 200) * multiplier * variation),
    dataLines: Math.round((Math.random() * 600 + 200) * multiplier * variation),
    mediaLines: Math.round((Math.random() * 600 + 200) * multiplier * variation),
    configLines: Math.round((Math.random() * 600 + 200) * multiplier * variation),
    otherLines: Math.round((Math.random() * 600 + 200) * multiplier * variation),
    terminalCommands: Math.round((Math.random() * 15 + 5) * multiplier * variation),
    fileSearches: Math.round((Math.random() * 12 + 3) * multiplier * variation),
    fileContentSearches: Math.round((Math.random() * 18 + 5) * multiplier * variation),
    todosCreated: Math.round((Math.random() * 8 + 2) * multiplier * variation),
    todosCompleted: Math.round((Math.random() * 12 + 4) * multiplier * variation),
    todosInProgress: Math.round((Math.random() * 4 + 1) * multiplier * variation),
    todoWrites: Math.round((Math.random() * 10 + 3) * multiplier * variation),
    todoReads: Math.round((Math.random() * 15 + 5) * multiplier * variation),
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
  
  await prisma.userStats.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.apiToken.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  
  console.log("✅ Database cleared");
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
              displayNamePreference: "displayName",
              locale: "en",
              timezone: "UTC",
              currency: "USD",
              optOutPublic: false,
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
  
  // Period multipliers (how much activity in each period)
  const periodMultipliers = {
    hourly: 0.1,   // 10% of daily activity in current hour
    daily: 1.0,    // Base daily activity
    weekly: 6.5,   // About 6.5 days worth of activity
    monthly: 22,   // About 22 working days
    yearly: 250,   // About 250 working days
    "all-time": 500,  // Lifetime accumulated (about 2 years)
  };
  
  for (const user of users) {
    // Create stats for each period
    const periodConfigs = [
      { period: "hourly", multiplier: periodMultipliers.hourly, start: periods.hourly.start, end: periods.hourly.end },
      { period: "daily", multiplier: periodMultipliers.daily, start: periods.daily.start, end: periods.daily.end },
      { period: "weekly", multiplier: periodMultipliers.weekly, start: periods.weekly.start, end: periods.weekly.end },
      { period: "monthly", multiplier: periodMultipliers.monthly, start: periods.monthly.start, end: periods.monthly.end },
      { period: "yearly", multiplier: periodMultipliers.yearly, start: periods.yearly.start, end: periods.yearly.end },
      { period: "all-time", multiplier: periodMultipliers["all-time"], start: null, end: null },
    ];

    for (const config of periodConfigs) {
      const stats = generateStats(user.multiplier, config.multiplier);
      await prisma.userStats.create({
        data: {
          userId: user.id,
          period: config.period,
          periodStart: config.start,
          periodEnd: config.end,
          ...stats,
        },
      });
    }
  }
  
  console.log(`✅ Created period statistics for ${users.length} users`);
}

async function createApiTokens(users: Array<{ id: string; username?: string }>) {
  console.log("🔑 Creating API tokens...");
  
  for (const user of users) {
    await prisma.apiToken.create({
      data: {
        userId: user.id,
        token: `st_${user.username}_${Math.random().toString(36).substring(2, 15)}`,
        name: "CLI Token",
      },
    });
  }
  
  console.log(`✅ Created API tokens for ${users.length} users`);
}

async function main() {
  console.log("🌱 Starting database seed...");
  
  await clearDatabase();
  const users = await createUsers();
  await createPeriodStats(users);
  await createApiTokens(users);
  
  console.log("🎉 Database seeding completed!");
  console.log("");
  console.log("📈 Generated data for all time periods:");
  console.log("  • Hourly (current hour)");
  console.log("  • Daily (current day)");
  console.log("  • Weekly (current week)");
  console.log("  • Monthly (current month)");
  console.log("  • Yearly (current year)");
  console.log("  • All-time (lifetime s)");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface UserStats {
  toolsCalled: number;
  messagesSent: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
  filesRead: number;
  filesEdited: number;
  filesWritten: number;
  linesRead: number;
  linesEdited: number;
  linesWritten: number;
  bytesRead: number;
  bytesEdited: number;
  bytesWritten: number;
  terminalCommands: number;
  globSearches: number;
  grepSearches: number;
  todosCreated: number;
  todosCompleted: number;
  todosInProgress: number;
  todoWrites: number;
  todoReads: number;
}

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
    filesEdited: Math.round((Math.random() * 25 + 10) * multiplier * variation),
    filesWritten: Math.round((Math.random() * 15 + 5) * multiplier * variation),
    linesRead: Math.round((Math.random() * 8000 + 3000) * multiplier * variation),
    linesEdited: Math.round((Math.random() * 800 + 300) * multiplier * variation),
    linesWritten: Math.round((Math.random() * 600 + 200) * multiplier * variation),
    bytesRead: Math.round((Math.random() * 150000 + 50000) * multiplier * variation),
    bytesEdited: Math.round((Math.random() * 30000 + 10000) * multiplier * variation),
    bytesWritten: Math.round((Math.random() * 25000 + 8000) * multiplier * variation),
    terminalCommands: Math.round((Math.random() * 15 + 5) * multiplier * variation),
    globSearches: Math.round((Math.random() * 12 + 3) * multiplier * variation),
    grepSearches: Math.round((Math.random() * 18 + 5) * multiplier * variation),
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
  
  await prisma.userHourlyStats.deleteMany();
  await prisma.userDailyStats.deleteMany();
  await prisma.userWeeklyStats.deleteMany();
  await prisma.userMonthlyStats.deleteMany();
  await prisma.userYearlyStats.deleteMany();
  await prisma.userAllTimeStats.deleteMany();
  await prisma.userEvents.deleteMany();
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
    allTime: 500,  // Lifetime accumulated (about 2 years)
  };
  
  for (const user of users) {
    // Hourly stats
    const hourlyStats = generateStats(user.multiplier, periodMultipliers.hourly);
    await prisma.userHourlyStats.create({
      data: {
        userId: user.id,
        periodStart: periods.hourly.start,
        periodEnd: periods.hourly.end,
        ...hourlyStats,
        inputTokens: hourlyStats.inputTokens,
        outputTokens: hourlyStats.outputTokens,
        cacheCreationTokens: hourlyStats.cacheCreationTokens,
        cacheReadTokens: hourlyStats.cacheReadTokens,
        linesRead: hourlyStats.linesRead,
        linesEdited: hourlyStats.linesEdited,
        linesWritten: hourlyStats.linesWritten,
        bytesRead: hourlyStats.bytesRead,
        bytesEdited: hourlyStats.bytesEdited,
        bytesWritten: hourlyStats.bytesWritten,
      },
    });

    // Daily stats
    const dailyStats = generateStats(user.multiplier, periodMultipliers.daily);
    await prisma.userDailyStats.create({
      data: {
        userId: user.id,
        periodStart: periods.daily.start,
        periodEnd: periods.daily.end,
        ...dailyStats,
        inputTokens: dailyStats.inputTokens,
        outputTokens: dailyStats.outputTokens,
        cacheCreationTokens: dailyStats.cacheCreationTokens,
        cacheReadTokens: dailyStats.cacheReadTokens,
        linesRead: dailyStats.linesRead,
        linesEdited: dailyStats.linesEdited,
        linesWritten: dailyStats.linesWritten,
        bytesRead: dailyStats.bytesRead,
        bytesEdited: dailyStats.bytesEdited,
        bytesWritten: dailyStats.bytesWritten,
      },
    });

    // Weekly stats
    const weeklyStats = generateStats(user.multiplier, periodMultipliers.weekly);
    await prisma.userWeeklyStats.create({
      data: {
        userId: user.id,
        periodStart: periods.weekly.start,
        periodEnd: periods.weekly.end,
        ...weeklyStats,
        inputTokens: weeklyStats.inputTokens,
        outputTokens: weeklyStats.outputTokens,
        cacheCreationTokens: weeklyStats.cacheCreationTokens,
        cacheReadTokens: weeklyStats.cacheReadTokens,
        linesRead: weeklyStats.linesRead,
        linesEdited: weeklyStats.linesEdited,
        linesWritten: weeklyStats.linesWritten,
        bytesRead: weeklyStats.bytesRead,
        bytesEdited: weeklyStats.bytesEdited,
        bytesWritten: weeklyStats.bytesWritten,
      },
    });

    // Monthly stats
    const monthlyStats = generateStats(user.multiplier, periodMultipliers.monthly);
    await prisma.userMonthlyStats.create({
      data: {
        userId: user.id,
        periodStart: periods.monthly.start,
        periodEnd: periods.monthly.end,
        ...monthlyStats,
        inputTokens: monthlyStats.inputTokens,
        outputTokens: monthlyStats.outputTokens,
        cacheCreationTokens: monthlyStats.cacheCreationTokens,
        cacheReadTokens: monthlyStats.cacheReadTokens,
        linesRead: monthlyStats.linesRead,
        linesEdited: monthlyStats.linesEdited,
        linesWritten: monthlyStats.linesWritten,
        bytesRead: monthlyStats.bytesRead,
        bytesEdited: monthlyStats.bytesEdited,
        bytesWritten: monthlyStats.bytesWritten,
      },
    });

    // Yearly stats
    const yearlyStats = generateStats(user.multiplier, periodMultipliers.yearly);
    await prisma.userYearlyStats.create({
      data: {
        userId: user.id,
        periodStart: periods.yearly.start,
        periodEnd: periods.yearly.end,
        ...yearlyStats,
        inputTokens: yearlyStats.inputTokens,
        outputTokens: yearlyStats.outputTokens,
        cacheCreationTokens: yearlyStats.cacheCreationTokens,
        cacheReadTokens: yearlyStats.cacheReadTokens,
        linesRead: yearlyStats.linesRead,
        linesEdited: yearlyStats.linesEdited,
        linesWritten: yearlyStats.linesWritten,
        bytesRead: yearlyStats.bytesRead,
        bytesEdited: yearlyStats.bytesEdited,
        bytesWritten: yearlyStats.bytesWritten,
      },
    });

    // All-time stats
    const allTimeStats = generateStats(user.multiplier, periodMultipliers.allTime);
    await prisma.userAllTimeStats.create({
      data: {
        userId: user.id,
        ...allTimeStats,
        inputTokens: allTimeStats.inputTokens,
        outputTokens: allTimeStats.outputTokens,
        cacheCreationTokens: allTimeStats.cacheCreationTokens,
        cacheReadTokens: allTimeStats.cacheReadTokens,
        linesRead: allTimeStats.linesRead,
        linesEdited: allTimeStats.linesEdited,
        linesWritten: allTimeStats.linesWritten,
        bytesRead: allTimeStats.bytesRead,
        bytesEdited: allTimeStats.bytesEdited,
        bytesWritten: allTimeStats.bytesWritten,
      },
    });
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

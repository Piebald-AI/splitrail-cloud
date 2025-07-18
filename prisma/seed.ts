import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface UserStats {
  totalToolsCalled: number;
  totalMessagesSent: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
  totalCost: number;
  totalFilesRead: number;
  totalFilesEdited: number;
  totalFilesWritten: number;
  totalLinesRead: number;
  totalLinesEdited: number;
  totalLinesWritten: number;
  totalBytesRead: number;
  totalBytesEdited: number;
  totalBytesWritten: number;
  totalTerminalCommands: number;
  totalGlobSearches: number;
  totalGrepSearches: number;
  totalTodosCreated: number;
  totalTodosCompleted: number;
  totalTodosInProgress: number;
  totalTodoWrites: number;
  totalTodoReads: number;
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
    totalToolsCalled: Math.round((Math.random() * 25 + 10) * multiplier * variation),
    totalMessagesSent: Math.round((Math.random() * 40 + 20) * multiplier * variation),
    totalInputTokens: Math.round((Math.random() * 15000 + 8000) * multiplier * variation),
    totalOutputTokens: Math.round((Math.random() * 8000 + 4000) * multiplier * variation),
    totalCacheCreationTokens: Math.round((Math.random() * 3000 + 1500) * multiplier * variation),
    totalCacheReadTokens: Math.round((Math.random() * 5000 + 2500) * multiplier * variation),
    totalCost: Math.round((Math.random() * 75 + 25) * multiplier * variation * 100) / 100,
    totalFilesRead: Math.round((Math.random() * 80 + 30) * multiplier * variation),
    totalFilesEdited: Math.round((Math.random() * 25 + 10) * multiplier * variation),
    totalFilesWritten: Math.round((Math.random() * 15 + 5) * multiplier * variation),
    totalLinesRead: Math.round((Math.random() * 8000 + 3000) * multiplier * variation),
    totalLinesEdited: Math.round((Math.random() * 800 + 300) * multiplier * variation),
    totalLinesWritten: Math.round((Math.random() * 600 + 200) * multiplier * variation),
    totalBytesRead: Math.round((Math.random() * 150000 + 50000) * multiplier * variation),
    totalBytesEdited: Math.round((Math.random() * 30000 + 10000) * multiplier * variation),
    totalBytesWritten: Math.round((Math.random() * 25000 + 8000) * multiplier * variation),
    totalTerminalCommands: Math.round((Math.random() * 15 + 5) * multiplier * variation),
    totalGlobSearches: Math.round((Math.random() * 12 + 3) * multiplier * variation),
    totalGrepSearches: Math.round((Math.random() * 18 + 5) * multiplier * variation),
    totalTodosCreated: Math.round((Math.random() * 8 + 2) * multiplier * variation),
    totalTodosCompleted: Math.round((Math.random() * 12 + 4) * multiplier * variation),
    totalTodosInProgress: Math.round((Math.random() * 4 + 1) * multiplier * variation),
    totalTodoWrites: Math.round((Math.random() * 10 + 3) * multiplier * variation),
    totalTodoReads: Math.round((Math.random() * 15 + 5) * multiplier * variation),
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
        totalInputTokens: BigInt(hourlyStats.totalInputTokens),
        totalOutputTokens: BigInt(hourlyStats.totalOutputTokens),
        totalCacheCreationTokens: BigInt(hourlyStats.totalCacheCreationTokens),
        totalCacheReadTokens: BigInt(hourlyStats.totalCacheReadTokens),
        totalLinesRead: BigInt(hourlyStats.totalLinesRead),
        totalLinesEdited: BigInt(hourlyStats.totalLinesEdited),
        totalLinesWritten: BigInt(hourlyStats.totalLinesWritten),
        totalBytesRead: BigInt(hourlyStats.totalBytesRead),
        totalBytesEdited: BigInt(hourlyStats.totalBytesEdited),
        totalBytesWritten: BigInt(hourlyStats.totalBytesWritten),
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
        totalInputTokens: BigInt(dailyStats.totalInputTokens),
        totalOutputTokens: BigInt(dailyStats.totalOutputTokens),
        totalCacheCreationTokens: BigInt(dailyStats.totalCacheCreationTokens),
        totalCacheReadTokens: BigInt(dailyStats.totalCacheReadTokens),
        totalLinesRead: BigInt(dailyStats.totalLinesRead),
        totalLinesEdited: BigInt(dailyStats.totalLinesEdited),
        totalLinesWritten: BigInt(dailyStats.totalLinesWritten),
        totalBytesRead: BigInt(dailyStats.totalBytesRead),
        totalBytesEdited: BigInt(dailyStats.totalBytesEdited),
        totalBytesWritten: BigInt(dailyStats.totalBytesWritten),
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
        totalInputTokens: BigInt(weeklyStats.totalInputTokens),
        totalOutputTokens: BigInt(weeklyStats.totalOutputTokens),
        totalCacheCreationTokens: BigInt(weeklyStats.totalCacheCreationTokens),
        totalCacheReadTokens: BigInt(weeklyStats.totalCacheReadTokens),
        totalLinesRead: BigInt(weeklyStats.totalLinesRead),
        totalLinesEdited: BigInt(weeklyStats.totalLinesEdited),
        totalLinesWritten: BigInt(weeklyStats.totalLinesWritten),
        totalBytesRead: BigInt(weeklyStats.totalBytesRead),
        totalBytesEdited: BigInt(weeklyStats.totalBytesEdited),
        totalBytesWritten: BigInt(weeklyStats.totalBytesWritten),
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
        totalInputTokens: BigInt(monthlyStats.totalInputTokens),
        totalOutputTokens: BigInt(monthlyStats.totalOutputTokens),
        totalCacheCreationTokens: BigInt(monthlyStats.totalCacheCreationTokens),
        totalCacheReadTokens: BigInt(monthlyStats.totalCacheReadTokens),
        totalLinesRead: BigInt(monthlyStats.totalLinesRead),
        totalLinesEdited: BigInt(monthlyStats.totalLinesEdited),
        totalLinesWritten: BigInt(monthlyStats.totalLinesWritten),
        totalBytesRead: BigInt(monthlyStats.totalBytesRead),
        totalBytesEdited: BigInt(monthlyStats.totalBytesEdited),
        totalBytesWritten: BigInt(monthlyStats.totalBytesWritten),
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
        totalInputTokens: BigInt(yearlyStats.totalInputTokens),
        totalOutputTokens: BigInt(yearlyStats.totalOutputTokens),
        totalCacheCreationTokens: BigInt(yearlyStats.totalCacheCreationTokens),
        totalCacheReadTokens: BigInt(yearlyStats.totalCacheReadTokens),
        totalLinesRead: BigInt(yearlyStats.totalLinesRead),
        totalLinesEdited: BigInt(yearlyStats.totalLinesEdited),
        totalLinesWritten: BigInt(yearlyStats.totalLinesWritten),
        totalBytesRead: BigInt(yearlyStats.totalBytesRead),
        totalBytesEdited: BigInt(yearlyStats.totalBytesEdited),
        totalBytesWritten: BigInt(yearlyStats.totalBytesWritten),
      },
    });

    // All-time stats
    const allTimeStats = generateStats(user.multiplier, periodMultipliers.allTime);
    await prisma.userAllTimeStats.create({
      data: {
        userId: user.id,
        ...allTimeStats,
        totalInputTokens: BigInt(allTimeStats.totalInputTokens),
        totalOutputTokens: BigInt(allTimeStats.totalOutputTokens),
        totalCacheCreationTokens: BigInt(allTimeStats.totalCacheCreationTokens),
        totalCacheReadTokens: BigInt(allTimeStats.totalCacheReadTokens),
        totalLinesRead: BigInt(allTimeStats.totalLinesRead),
        totalLinesEdited: BigInt(allTimeStats.totalLinesEdited),
        totalLinesWritten: BigInt(allTimeStats.totalLinesWritten),
        totalBytesRead: BigInt(allTimeStats.totalBytesRead),
        totalBytesEdited: BigInt(allTimeStats.totalBytesEdited),
        totalBytesWritten: BigInt(allTimeStats.totalBytesWritten),
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
  console.log("  • All-time (lifetime totals)");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

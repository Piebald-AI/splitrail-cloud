import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  await prisma.dailyStats.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.apiToken.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        githubId: "12346",
        username: "codecrafter",
        displayName: "Code Crafter",
        avatarUrl: "https://github.com/codecrafter.png",
        email: "code@example.com",
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
    }),
    prisma.user.create({
      data: {
        githubId: "12347",
        username: "aidev",
        displayName: "AI Developer",
        avatarUrl: "https://github.com/aidev.png",
        email: "ai@example.com",
        preferences: {
          create: {
            displayNamePreference: "username",
            locale: "en",
            timezone: "UTC",
            currency: "USD",
            optOutPublic: false,
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Generate daily stats for the last 30 days
  const today = new Date();
  const statsPromises = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    for (const user of users) {
      const multiplier =
        user.username === "evalstate"
          ? 2
          : user.username === "codecrafter"
            ? 1.5
            : 1;
      const dayVariation = Math.random() * 0.5 + 0.75; // 0.75 to 1.25 variation

      statsPromises.push(
        prisma.dailyStats.create({
          data: {
            userId: user.id,
            date: date,
            cost:
              Math.round(
                (Math.random() * 50 + 10) * multiplier * dayVariation * 100
              ) / 100,
            inputTokens: Math.round(
              (Math.random() * 10000 + 5000) * multiplier * dayVariation
            ),
            outputTokens: Math.round(
              (Math.random() * 5000 + 2000) * multiplier * dayVariation
            ),
            cachedTokens: Math.round(
              (Math.random() * 3000 + 1000) * multiplier * dayVariation
            ),
            userMessages: Math.round(
              (Math.random() * 20 + 10) * multiplier * dayVariation
            ),
            aiMessages: Math.round(
              (Math.random() * 25 + 15) * multiplier * dayVariation
            ),
            toolCalls: Math.round(
              (Math.random() * 15 + 5) * multiplier * dayVariation
            ),
            conversations: Math.round(
              (Math.random() * 3 + 1) * multiplier * dayVariation
            ),
            maxFlowLengthSeconds: Math.round(
              (Math.random() * 1800 + 300) * multiplier * dayVariation
            ),
            filesRead: Math.round(
              (Math.random() * 50 + 20) * multiplier * dayVariation
            ),
            filesEdited: Math.round(
              (Math.random() * 15 + 5) * multiplier * dayVariation
            ),
            filesWritten: Math.round(
              (Math.random() * 10 + 2) * multiplier * dayVariation
            ),
            linesRead: Math.round(
              (Math.random() * 5000 + 1000) * multiplier * dayVariation
            ),
            linesAdded: Math.round(
              (Math.random() * 500 + 100) * multiplier * dayVariation
            ),
            linesDeleted: Math.round(
              (Math.random() * 200 + 50) * multiplier * dayVariation
            ),
            linesModified: Math.round(
              (Math.random() * 300 + 100) * multiplier * dayVariation
            ),
            bytesRead: Math.round(
              (Math.random() * 100000 + 20000) * multiplier * dayVariation
            ),
            bytesEdited: Math.round(
              (Math.random() * 20000 + 5000) * multiplier * dayVariation
            ),
            bytesWritten: Math.round(
              (Math.random() * 15000 + 3000) * multiplier * dayVariation
            ),
            bashCommands: Math.round(
              (Math.random() * 10 + 2) * multiplier * dayVariation
            ),
            globSearches: Math.round(
              (Math.random() * 8 + 1) * multiplier * dayVariation
            ),
            grepSearches: Math.round(
              (Math.random() * 12 + 3) * multiplier * dayVariation
            ),
            todosCreated: Math.round(
              (Math.random() * 5 + 1) * multiplier * dayVariation
            ),
            todosCompleted: Math.round(
              (Math.random() * 8 + 2) * multiplier * dayVariation
            ),
            todosInProgress: Math.round(
              (Math.random() * 3 + 0) * multiplier * dayVariation
            ),
            todoReads: Math.round(
              (Math.random() * 10 + 3) * multiplier * dayVariation
            ),
            todoWrites: Math.round(
              (Math.random() * 6 + 1) * multiplier * dayVariation
            ),
            codeLines: Math.round(
              (Math.random() * 2000 + 500) * multiplier * dayVariation
            ),
            docsLines: Math.round(
              (Math.random() * 800 + 200) * multiplier * dayVariation
            ),
            dataLines: Math.round(
              (Math.random() * 500 + 100) * multiplier * dayVariation
            ),
            projectsData: {
              "fast-agent": {
                percentage: 88.5,
                lines: Math.round((Math.random() * 1000 + 500) * multiplier),
              },
              "web-scraper": {
                percentage: 11.5,
                lines: Math.round((Math.random() * 200 + 100) * multiplier),
              },
            },
            languagesData: {
              python: {
                lines: Math.round((Math.random() * 1500 + 300) * multiplier),
                files: Math.round((Math.random() * 10 + 3) * multiplier),
              },
              typescript: {
                lines: Math.round((Math.random() * 800 + 200) * multiplier),
                files: Math.round((Math.random() * 8 + 2) * multiplier),
              },
              javascript: {
                lines: Math.round((Math.random() * 400 + 100) * multiplier),
                files: Math.round((Math.random() * 5 + 1) * multiplier),
              },
            },
            modelsData: {
              "claude-sonnet-4": Math.round(
                (Math.random() * 20 + 5) * multiplier
              ),
              "claude-opus-4": Math.round((Math.random() * 5 + 1) * multiplier),
            },
          },
        })
      );
    }
  }

  await Promise.all(statsPromises);
  console.log(`✅ Created ${statsPromises.length} daily stats entries`);

  // Create API tokens for users
  for (const user of users) {
    await prisma.apiToken.create({
      data: {
        userId: user.id,
        token: `st_${user.username}_${Math.random().toString(36).substring(2, 15)}`,
        name: "CLI Token",
      },
    });
  }

  console.log("✅ Created API tokens for all users");
  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

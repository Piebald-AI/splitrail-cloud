import { PrismaClient, Project } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Helper functions for common database operations
export class DatabaseService {
  // Get leaderboard data with ranking
  static async getLeaderboardData(
    sortBy: string = "cost",
    sortOrder: "asc" | "desc" = "desc",
    page: number = 1,
    pageSize: number = 100
  ) {
    const skip = (page - 1) * pageSize;

    // First get aggregated stats for all users
    const usersWithStats = await db.user.findMany({
      include: {
        dailyStats: true,
        preferences: true,
      },
      where: {
        OR: [
          { preferences: { optOutPublic: false } },
          { preferences: null },
          { preferences: { optOutPublic: { not: true } } },
        ],
      },
    });

    // Calculate aggregated metrics for each user
    const usersWithMetrics = usersWithStats.map((user) => {
      const totalCost = user.dailyStats.reduce(
        (sum, stat) => sum + stat.cost,
        0
      );
      const totalTokens = user.dailyStats.reduce(
        (sum, stat) =>
          sum + stat.inputTokens + stat.outputTokens + stat.cachedTokens,
        0
      );
      const totalLinesAdded = user.dailyStats.reduce(
        (sum, stat) => sum + stat.linesAdded,
        0
      );
      const totalLinesDeleted = user.dailyStats.reduce(
        (sum, stat) => sum + stat.linesDeleted,
        0
      );
      const totalLinesModified = user.dailyStats.reduce(
        (sum, stat) => sum + stat.linesModified,
        0
      );
      const totalCodeLines = user.dailyStats.reduce(
        (sum, stat) => sum + stat.codeLines,
        0
      );
      const totalDocsLines = user.dailyStats.reduce(
        (sum, stat) => sum + stat.docsLines,
        0
      );
      const totalDataLines = user.dailyStats.reduce(
        (sum, stat) => sum + stat.dataLines,
        0
      );
      const totalTodosCompleted = user.dailyStats.reduce(
        (sum, stat) => sum + stat.todosCompleted,
        0
      );

      // Calculate unique projects and languages
      const allProjects = new Set<string>();
      const allLanguages = new Set<string>();

      user.dailyStats.forEach((stat) => {
        if (stat.projectsData && typeof stat.projectsData === "object") {
          Object.keys(stat.projectsData).forEach((project) =>
            allProjects.add(project)
          );
        }
        if (stat.languagesData && typeof stat.languagesData === "object") {
          Object.keys(stat.languagesData).forEach((language) =>
            allLanguages.add(language)
          );
        }
      });

      return {
        ...user,
        totalCost,
        totalTokens,
        totalLinesAdded,
        totalLinesDeleted,
        totalLinesModified,
        totalProjects: allProjects.size,
        totalLanguages: allLanguages.size,
        totalCodeLines,
        totalDocsLines,
        totalDataLines,
        totalTodosCompleted,
        rank: 0, // Will be calculated after sorting
        badge: undefined as "gold" | "silver" | "bronze" | undefined,
      };
    });

    // Sort users based on the specified metric
    const sortedUsers = usersWithMetrics.sort((a, b) => {
      let valueA: number;
      let valueB: number;

      switch (sortBy) {
        case "tokens":
          valueA = a.totalTokens;
          valueB = b.totalTokens;
          break;
        case "linesAdded":
          valueA = a.totalLinesAdded;
          valueB = b.totalLinesAdded;
          break;
        case "linesDeleted":
          valueA = a.totalLinesDeleted;
          valueB = b.totalLinesDeleted;
          break;
        case "linesModified":
          valueA = a.totalLinesModified;
          valueB = b.totalLinesModified;
          break;
        case "projects":
          valueA = a.totalProjects;
          valueB = b.totalProjects;
          break;
        case "languages":
          valueA = a.totalLanguages;
          valueB = b.totalLanguages;
          break;
        case "codeLines":
          valueA = a.totalCodeLines;
          valueB = b.totalCodeLines;
          break;
        case "docsLines":
          valueA = a.totalDocsLines;
          valueB = b.totalDocsLines;
          break;
        case "dataLines":
          valueA = a.totalDataLines;
          valueB = b.totalDataLines;
          break;
        case "todosCompleted":
          valueA = a.totalTodosCompleted;
          valueB = b.totalTodosCompleted;
          break;
        default: // 'cost'
          valueA = a.totalCost;
          valueB = b.totalCost;
      }

      return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
    });

    // Assign ranks and badges
    sortedUsers.forEach((user, index) => {
      user.rank = index + 1;
      if (index === 0) user.badge = "gold";
      else if (index === 1) user.badge = "silver";
      else if (index === 2) user.badge = "bronze";
    });

    // Apply pagination
    const paginatedUsers = sortedUsers.slice(skip, skip + pageSize);

    return {
      users: paginatedUsers,
      total: sortedUsers.length,
      currentPage: page,
      pageSize,
    };
  }

  // Get user profile with detailed stats
  static async getUserProfile(userId: string, timeRange: string = "all") {
    // Calculate date filter based on time range
    let dateFilter: { gte?: Date; lte?: Date } | Record<string, never> = {};
    const now = new Date();

    switch (timeRange) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: weekAgo };
        break;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: monthAgo };
        break;
      case "year":
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: yearAgo };
        break;
      default: // 'all'
        dateFilter = {};
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        dailyStats: {
          where: dateFilter.gte ? { date: dateFilter } : {},
          orderBy: { date: "desc" },
        },
        preferences: true,
        folderProjects: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!user) return null;

    // Calculate aggregated stats
    const totalCost = user.dailyStats.reduce((sum, stat) => sum + stat.cost, 0);
    const totalTokens = user.dailyStats.reduce(
      (sum, stat) =>
        sum + stat.inputTokens + stat.outputTokens + stat.cachedTokens,
      0
    );
    const totalLinesAdded = user.dailyStats.reduce(
      (sum, stat) => sum + stat.linesAdded,
      0
    );
    const totalLinesDeleted = user.dailyStats.reduce(
      (sum, stat) => sum + stat.linesDeleted,
      0
    );
    const totalLinesModified = user.dailyStats.reduce(
      (sum, stat) => sum + stat.linesModified,
      0
    );
    const totalCodeLines = user.dailyStats.reduce(
      (sum, stat) => sum + stat.codeLines,
      0
    );
    const totalDocsLines = user.dailyStats.reduce(
      (sum, stat) => sum + stat.docsLines,
      0
    );
    const totalDataLines = user.dailyStats.reduce(
      (sum, stat) => sum + stat.dataLines,
      0
    );
    const totalTodosCompleted = user.dailyStats.reduce(
      (sum, stat) => sum + stat.todosCompleted,
      0
    );

    // Calculate projects and languages data
    const projectsMap = new Map<
      string,
      {
        lines: number;
        percentage: number;
        isAssociated?: boolean;
        description?: string;
        openSource?: boolean;
        githubLink?: string;
        websiteLink?: string;
      }
    >();
    const languagesMap = new Map<string, { lines: number; files: number }>();
    const modelsMap = new Map<string, number>();

    // Create a map of folder to project for quick lookup
    const folderToProject = new Map<string, Project>();
    user.folderProjects.forEach((fp) => {
      folderToProject.set(fp.folder, fp.project);
    });

    user.dailyStats.forEach((stat) => {
      // If this stat has a folder and is associated with a project, add to associated projects
      if (stat.folder && folderToProject.has(stat.folder)) {
        const project = folderToProject.get(stat.folder);
        if (project) {
          const totalLines =
            stat.linesAdded + stat.linesDeleted + stat.linesModified;
          const existing = projectsMap.get(project.name) || {
            lines: 0,
            percentage: 0,
            isAssociated: true,
            description: project.description || undefined,
            openSource: project.openSource,
            githubLink: project.githubLink || undefined,
            websiteLink: project.websiteLink || undefined,
          };
          projectsMap.set(project.name, {
            ...existing,
            lines: existing.lines + totalLines,
          });
        }
      }

      // Also include legacy projectsData for backward compatibility
      if (stat.projectsData && typeof stat.projectsData === "object") {
        Object.entries(stat.projectsData).forEach(
          ([project, data]: [string, unknown]) => {
            if (data && typeof data === "object") {
              const projectData = data as {
                lines?: number;
                percentage?: number;
              };
              const existing = projectsMap.get(project) || {
                lines: 0,
                percentage: 0,
                isAssociated: false,
              };
              projectsMap.set(project, {
                ...existing,
                lines: existing.lines + (projectData.lines || 0),
                percentage: Math.max(
                  existing.percentage,
                  projectData.percentage || 0
                ),
              });
            }
          }
        );
      }

      if (stat.languagesData && typeof stat.languagesData === "object") {
        Object.entries(stat.languagesData).forEach(
          ([language, data]: [string, unknown]) => {
            if (data && typeof data === "object") {
              const languageData = data as { lines?: number; files?: number };
              const existing = languagesMap.get(language) || {
                lines: 0,
                files: 0,
              };
              languagesMap.set(language, {
                lines: existing.lines + (languageData.lines || 0),
                files: existing.files + (languageData.files || 0),
              });
            }
          }
        );
      }

      if (stat.modelsData && typeof stat.modelsData === "object") {
        Object.entries(stat.modelsData).forEach(
          ([model, usage]: [string, unknown]) => {
            if (typeof usage === "number") {
              modelsMap.set(model, (modelsMap.get(model) || 0) + usage);
            }
          }
        );
      }
    });

    const topProjects = Array.from(projectsMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 10);

    const topLanguages = Array.from(languagesMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 10);

    const topModels = Array.from(modelsMap.entries())
      .map(([name, usage]) => ({ name, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);

    const activeDays = user.dailyStats.length;
    const averageCostPerDay = activeDays > 0 ? totalCost / activeDays : 0;
    const averageTokensPerDay = activeDays > 0 ? totalTokens / activeDays : 0;
    const averageLinesPerDay =
      activeDays > 0
        ? (totalLinesAdded + totalLinesDeleted + totalLinesModified) /
          activeDays
        : 0;

    return {
      ...user,
      aggregatedStats: {
        totalCost,
        totalTokens,
        totalLinesAdded,
        totalLinesDeleted,
        totalLinesModified,
        totalProjects: projectsMap.size,
        totalLanguages: languagesMap.size,
        totalCodeLines,
        totalDocsLines,
        totalDataLines,
        totalTodosCompleted,
        averageCostPerDay,
        averageTokensPerDay,
        averageLinesPerDay,
        streakDays: 0, // Will be calculated separately
        topProjects,
        topLanguages,
        topModels,
      },
    };
  }

  // Store or update daily stats
  static async upsertDailyStats(
    userId: string,
    date: Date,
    statsData: Record<string, unknown>
  ) {
    return db.dailyStats.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        ...statsData,
        updatedAt: new Date(),
      },
      create: {
        userId,
        date,
        ...statsData,
      },
    });
  }

  // Get all API tokens for user
  static async getUserApiTokens(userId: string) {
    return await db.apiToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        name: true,
        lastUsed: true,
        createdAt: true,
      },
    });
  }

  // Create new API token for user
  static async createApiToken(userId: string, name?: string) {
    const tokenCount = await db.apiToken.count({
      where: { userId },
    });

    if (tokenCount >= 50) {
      throw new Error("Maximum number of tokens (50) reached");
    }

    const token =
      "st_" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const apiToken = await db.apiToken.create({
      data: {
        userId,
        token,
        name: name || `CLI Token ${tokenCount + 1}`,
      },
      select: {
        id: true,
        token: true,
        name: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    return apiToken;
  }

  // Delete specific API token
  static async deleteApiToken(userId: string, tokenId: string) {
    const deleted = await db.apiToken.delete({
      where: {
        id: tokenId,
        userId: userId, // Ensure user owns the token
      },
    });

    return deleted;
  }

  // Get or create API token for user (backward compatibility)
  static async getOrCreateApiToken(userId: string) {
    const existingTokens = await this.getUserApiTokens(userId);

    if (existingTokens.length > 0) {
      return existingTokens[0].token;
    }

    const newToken = await this.createApiToken(userId, "CLI Token");
    return newToken.token;
  }

  // Validate API token and get user
  static async validateApiToken(token: string) {
    const apiToken = await db.apiToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!apiToken) return null;

    // Update last used timestamp
    await db.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() },
    });

    return apiToken.user;
  }
}

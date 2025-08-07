import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  DbStatKeys,
  type ConversationMessage,
  Periods,
} from "@/types";
import { getPeriodStart, getPeriodEnd } from "@/lib/dateUtils";
import { unsupportedMethod } from "@/lib/routeUtils";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    console.log("/api/upload-stats POST", {
      method: request.method,
      url: request.url,
      ip: request.headers.get("x-forwarded-for") || "unknown",
      ua: request.headers.get("user-agent"),
    });
    // Get auth token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const apiToken = await db.apiToken.findUnique({
      where: { token: authHeader.substring(7) },
      include: { user: true },
    });

    if (!apiToken) {
      return NextResponse.json({ error: "Invalid API token" }, { status: 401 });
    }

    // Update last used timestamp
    await db.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() },
    });

    const user = apiToken.user;
    const body: ConversationMessage[] = await request.json();

    // Before asynchronously processing the data, validate the request.
    if (!body || !Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    } else if (
      !body.every(
        (message) =>
          message && typeof message === "object" && "stats" in message
      )
    ) {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    // Extract unique applications from messages to limit DB query
    const applications = new Set<string>();
    for (const message of body) {
      applications.add(message.application);
    }
    
    // Only fetch stats for relevant applications and periods
    const existingStats = await db.userStats.findMany({
      where: {
        userId: user.id,
        application: {
          in: Array.from(applications)
        }
      },
    });
    
    // Create a map for faster lookups
    const existingStatsMap = new Map<string, typeof existingStats[0]>();
    for (const stat of existingStats) {
      existingStatsMap.set(`${stat.period}_${stat.application}`, stat);
    }
    
    const statsToUpsert: Array<Partial<Prisma.UserStatsUncheckedCreateInput & { id?: string }>> = [];
    const messages: Array<Prisma.MessageStatsUncheckedCreateInput> = [];
    const messageDict: Record<string, ConversationMessage> = {};

    // Format all messages in a format that the DB will accept, and record each message in a dict
    // so that later, when we loop over insertedMessages, we can use the original message to get
    // the stats.
    for (const message of body) {
      const { stats, date, ...rest } = message;
      // Build the dbMessage object with all required fields
      const dbMessage: Record<string, unknown> = {
        ...rest,
        date: new Date(date),
        userId: user.id,
      };
      
      // Convert stats for database - batch process known keys
      if (stats.cost !== undefined && stats.cost !== null) dbMessage.cost = stats.cost;
      
      // Process BigInt fields in a single pass
      const bigIntFields = ['toolCalls', 'inputTokens', 'outputTokens', 'cacheCreationTokens', 'cacheReadTokens', 
        'cachedTokens', 'filesRead', 'filesAdded', 'filesEdited', 'filesDeleted',
        'linesRead', 'linesAdded', 'linesEdited', 'linesDeleted', 'bytesRead', 
        'bytesAdded', 'bytesEdited', 'bytesDeleted', 'codeLines', 'docsLines', 
        'dataLines', 'mediaLines', 'configLines', 'otherLines', 'terminalCommands',
        'fileSearches', 'fileContentSearches', 'todosCreated', 'todosCompleted', 
        'todosInProgress', 'todoWrites', 'todoReads'];
      
      for (const field of bigIntFields) {
        const value = stats[field as keyof typeof stats];
        if (value !== undefined && value !== null) {
          dbMessage[field] = BigInt(Math.round(Number(value)));
        }
      }
      
      messages.push(dbMessage as Prisma.MessageStatsUncheckedCreateInput);
      messageDict[message.globalHash] = message;
    }

    // Insert the messages, skipping duplicates.
    const insertedMessages = await db.messageStats.createManyAndReturn({
      data: messages,
      skipDuplicates: true,
    });

    // Create accumulator maps to aggregate stats efficiently
    const statAccumulators = new Map<string, Record<string, number>>();
    const messageCounters = new Map<string, { assistant: number, user: number }>();
    
    // Process inserted messages to accumulate stats
    for (const message of insertedMessages) {
      const { stats, role, application } = messageDict[message.globalHash];
      const isAssistantMessage = role === "assistant";
      
      // Process each period
      for (const period of Periods) {
        const key = `${period}_${application}`;
        
        // Initialize accumulator if needed
        if (!statAccumulators.has(key)) {
          statAccumulators.set(key, {});
          messageCounters.set(key, { assistant: 0, user: 0 });
        }
        
        const accumulator = statAccumulators.get(key)!;
        const counter = messageCounters.get(key)!;
        
        // Accumulate stats - process all defined values
        for (const statKey of DbStatKeys) {
          if (statKey !== "assistantMessages" && statKey !== "userMessages" && stats[statKey] !== undefined && stats[statKey] !== null) {
            accumulator[statKey] = (accumulator[statKey] || 0) + Number(stats[statKey]);
          }
        }
        
        // Count messages
        if (isAssistantMessage) {
          counter.assistant++;
        } else {
          counter.user++;
        }
      }
    }
    
    // Build upsert operations from accumulated data
    const now = new Date();
    for (const [key, accumulator] of statAccumulators) {
      const [period, application] = key.split('_');
      const counter = messageCounters.get(key)!;
      const existingStat = existingStatsMap.get(key);
      
      if (existingStat) {
        // Update existing stat - build update object with only changed fields
        const updates: Partial<Prisma.UserStatsUncheckedCreateInput> & { id: string } = {
          id: existingStat.id,
          userId: user.id,
          period,
          application,
          periodStart: existingStat.periodStart,
          periodEnd: existingStat.periodEnd,
          createdAt: existingStat.createdAt,
          updatedAt: now,
        };
        
        // Add accumulated values to existing stats
        for (const statKey of DbStatKeys) {
          if (statKey === "assistantMessages") {
            updates.assistantMessages = BigInt(existingStat.assistantMessages) + BigInt(counter.assistant);
          } else if (statKey === "userMessages") {
            updates.userMessages = BigInt(existingStat.userMessages) + BigInt(counter.user);
          } else if (accumulator[statKey] !== undefined) {
            const existing = existingStat[statKey] || 0;
            if (statKey === 'cost') {
              updates.cost = Number(existing) + accumulator[statKey];
            } else {
              // All other stats are BigInt fields
              const bigIntKey = statKey as Exclude<typeof statKey, 'cost' | 'assistantMessages' | 'userMessages'>;
              updates[bigIntKey] = BigInt(existing) + BigInt(accumulator[statKey]);
            }
          } else {
            // Copy existing value when no new data
            if (statKey === 'cost') {
              updates.cost = existingStat.cost;
            } else {
              const bigIntKey = statKey as Exclude<typeof statKey, 'cost'>;
              updates[bigIntKey] = existingStat[bigIntKey];
            }
          }
        }
        
        statsToUpsert.push(updates);
      } else {
        // Create new stat entry
        const newStat: Prisma.UserStatsUncheckedCreateInput = {
          userId: user.id,
          application,
          period,
          periodStart: getPeriodStart(period as (typeof Periods)[number]),
          periodEnd: getPeriodEnd(period as (typeof Periods)[number]),
          assistantMessages: BigInt(counter.assistant),
          userMessages: BigInt(counter.user),
          createdAt: now,
          updatedAt: now,
        };
        
        // Add accumulated stats with proper types
        for (const statKey of DbStatKeys) {
          if (statKey !== "assistantMessages" && statKey !== "userMessages" && accumulator[statKey] !== undefined) {
            const value = accumulator[statKey];
            if (statKey === 'cost') {
              newStat.cost = Number(value);
            } else {
              // All other stats are BigInt fields
              const bigIntKey = statKey as Exclude<typeof statKey, 'cost' | 'assistantMessages' | 'userMessages'>;
              newStat[bigIntKey] = BigInt(value);
            }
          }
        }
        
        statsToUpsert.push(newStat);
      }
    }

    // Batch upserts by operation type for better performance
    if (statsToUpsert.length > 0) {
      await db.$transaction(async (tx) => {
        await Promise.all(
          statsToUpsert.map(stat => {
            if (stat.id) {
              // Update existing record
              return tx.userStats.update({
                where: { id: stat.id },
                data: stat
              });
            } else {
              // Upsert for new records to handle race conditions
              const { userId, period, application, ...data } = stat;
              return tx.userStats.upsert({
                where: {
                  userId_period_application: {
                    userId: userId!,
                    period: period!,
                    application: application!
                  }
                },
                update: data,
                create: stat as Prisma.UserStatsUncheckedCreateInput
              });
            }
          })
        );
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Upload stats error:", error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = unsupportedMethod;
export const PUT = unsupportedMethod;
export const DELETE = unsupportedMethod;

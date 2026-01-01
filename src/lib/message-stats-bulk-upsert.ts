import { Prisma } from "@prisma/client";

type Sql = Prisma.Sql;

const COLS = [
  "globalHash",
  "userId",
  "application",
  "role",
  "date",
  "projectHash",
  "conversationHash",
  "localHash",
  "uuid",
  "sessionName",
  "inputTokens",
  "outputTokens",
  "cacheCreationTokens",
  "cacheReadTokens",
  "cachedTokens",
  "reasoningTokens",
  "cost",
  "model",
  "toolCalls",
  "fileTypes",
  "terminalCommands",
  "fileSearches",
  "fileContentSearches",
  "filesRead",
  "filesAdded",
  "filesEdited",
  "filesDeleted",
  "linesRead",
  "linesEdited",
  "linesAdded",
  "linesDeleted",
  "bytesRead",
  "bytesAdded",
  "bytesEdited",
  "bytesDeleted",
  "codeLines",
  "docsLines",
  "dataLines",
  "mediaLines",
  "configLines",
  "otherLines",
  "todosCreated",
  "todosCompleted",
  "todosInProgress",
  "todoWrites",
  "todoReads",
] as const;

type Col = (typeof COLS)[number];

export type MessageStatsUpsertRow = Record<Col, unknown>;

const INSERT_COLUMNS_SQL = Prisma.raw(COLS.map((c) => `"${c}"`).join(","));

const UPDATE_SET_SQL = Prisma.raw(
  COLS.filter((c) => c !== "globalHash")
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(",")
);

export function bulkUpsertMessageStatsSql(rows: MessageStatsUpsertRow[]) {
  const valuesSql: Sql[] = rows.map((row) =>
    Prisma.sql`(${Prisma.join(
      COLS.map((col) => Prisma.sql`${row[col]}`),
      ","
    )})`
  );

  return Prisma.sql`
    INSERT INTO "message_stats" (${INSERT_COLUMNS_SQL})
    VALUES ${Prisma.join(valuesSql, ",")}
    ON CONFLICT ("globalHash") DO UPDATE SET ${UPDATE_SET_SQL}
  `;
}

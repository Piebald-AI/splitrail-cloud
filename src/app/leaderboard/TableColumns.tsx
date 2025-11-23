"use client";

import { ColumnDef } from "@tanstack/react-table";
import { UserWithStats } from "@/types";
import {
  formatCurrency,
  formatLargeNumber,
  getDisplayName,
  cn,
} from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, Code, FileText, Database } from "lucide-react";

// User avatar component
function UserAvatarCell({ user }: { user: UserWithStats }) {
  const displayName = getDisplayName(user);

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-7 w-7 user-avatar">
        <AvatarImage src={user.avatarUrl || undefined} alt={displayName} />
        <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
          {displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="font-medium text-sm user-display-name">
          {displayName}
        </div>
        <div className="text-xs text-muted-foreground user-username">
          @{user.username}
        </div>
      </div>
    </div>
  );
}

export const createColumns = (
  currency: string = "USD",
  locale: string = "en"
): ColumnDef<UserWithStats>[] => [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => {
      const rank = row.original.rank;
      return (
        <div className="flex items-center justify-center">
          {rank <= 3 ? (
            <Award
              className={cn(
                "h-5 w-5",
                ["text-yellow-500", "text-slate-400", "text-amber-600"][
                  rank - 1
                ],
                [
                  "drop-shadow-[0_0_2px_rgba(234,179,8,1)]",
                  "drop-shadow-[0_0_2px_rgba(148,163,184,1)]",
                  "drop-shadow-[0_0_2px_rgba(217,119,6,1)]",
                ][rank - 1]
              )}
            />
          ) : (
            <span className="font-medium text-sm">{rank}</span>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "username",
    header: "Developer",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <UserAvatarCell user={row.original} />
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "cost",
    header: "Cost",
    cell: ({ getValue }) => (
      <div className="text-center text-yellow-600 dark:text-yellow-400 font-medium">
        {formatCurrency(getValue() as number, currency, locale)}
      </div>
    ),
  },
  {
    accessorKey: "tokens",
    header: "Tokens",
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {formatLargeNumber(row.original.tokens)}
      </div>
    ),
  },
  {
    accessorKey: "linesAdded",
    header: "Lines Added",
    cell: ({ getValue }) => (
      <div className="text-green-600 dark:text-green-400 text-center font-medium">
        +{formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
  {
    accessorKey: "linesDeleted",
    header: "Lines Deleted",
    cell: ({ getValue }) => (
      <div className="text-red-600 dark:text-red-400 text-center font-medium">
        -{formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
  {
    accessorKey: "linesEdited",
    header: "Lines Edited",
    cell: ({ getValue }) => (
      <div className="text-blue-600 dark:text-blue-400 text-center font-medium">
        ~{formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
  {
    accessorKey: "codeLines",
    header: "Code",
    cell: ({ getValue }) => (
      <div className="flex items-center gap-1 justify-center text-purple-600 dark:text-purple-400 font-medium">
        <Code className="size-4" />
        {formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
  {
    accessorKey: "docsLines",
    header: "Docs",
    cell: ({ getValue }) => (
      <div className="flex items-center gap-1 justify-center text-orange-600 dark:text-orange-400 font-medium">
        <FileText className="size-4" />
        {formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
  {
    accessorKey: "dataLines",
    header: "Data",
    cell: ({ getValue }) => (
      <div className="flex items-center gap-1 justify-center text-cyan-600 dark:text-cyan-500 font-medium">
        <Database className="size-4" />
        {formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
  {
    accessorKey: "todosCompleted",
    header: "Tasks Completed",
    cell: ({ getValue }) => (
      <div className="text-center text-green-600 dark:text-green-400 font-medium">
        {formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
];

"use client";

import { ColumnDef, Column } from "@tanstack/react-table";
import { UserWithStatsFromAPI } from "@/types";
import {
  formatCurrency,
  formatLargeNumber,
  getDisplayName,
  cn,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronUp,
  ChevronDown,
  Award,
  Code,
  FileText,
  Database,
} from "lucide-react";

// User avatar component
function UserAvatarCell({ user }: { user: UserWithStatsFromAPI }) {
  const displayName = getDisplayName(user, "displayName");

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

// Helper function to render sort icon based on state
function SortIcon({
  column,
}: {
  column: Column<UserWithStatsFromAPI, unknown>;
}) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") {
    return <ChevronUp className="ml-2 h-4 w-4" />;
  } else if (sorted === "desc") {
    return <ChevronDown className="ml-2 h-4 w-4" />;
  } else {
    return null;
  }
}

export const columns: ColumnDef<UserWithStatsFromAPI>[] = [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        {row.index < 3 ? (
          <Award
            className={cn(
              "h-5 w-5",
              ["text-yellow-500", "text-slate-400", "text-amber-600"][
                row.index
              ],
              [
                "drop-shadow-[0_0_2px_rgba(234,179,8,1)]",
                "drop-shadow-[0_0_2px_rgba(148,163,184,1)]",
                "drop-shadow-[0_0_2px_rgba(217,119,6,1)]",
              ][row.index]
            )}
          />
        ) : (
          <span className="font-medium text-sm">{row.index + 1}</span>
        )}
      </div>
    ),
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cost
          <SortIcon column={column} />
        </Button>
      );
    },
    cell: ({ getValue }) => (
      <div className="text-center">{formatCurrency(getValue() as number)}</div>
    ),
  },
  {
    accessorKey: "tokens",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tokens
          <SortIcon column={column} />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-center">
        {formatLargeNumber({
          $bigint: (
            BigInt(row.original.inputTokens.$bigint) +
            BigInt(row.original.outputTokens.$bigint)
          ).toString(),
        })}
      </div>
    ),
  },
  {
    accessorKey: "linesAdded",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Lines Added
          <SortIcon column={column} />
        </Button>
      );
    },
    cell: ({ getValue }) => (
      <div className="text-green-600 text-center font-medium">
        +{formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
  {
    accessorKey: "linesDeleted",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Lines Deleted
          <SortIcon column={column} />
        </Button>
      );
    },
    cell: ({ getValue }) => (
      <div className="text-red-600 text-center font-medium">
        -{formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
  {
    accessorKey: "linesEdited",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Lines Edited
          <SortIcon column={column} />
        </Button>
      );
    },
    cell: ({ getValue }) => (
      <div className="text-blue-600 text-center font-medium">
        ~{formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
  {
    accessorKey: "codeLines",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Code
          <SortIcon column={column} />
        </Button>
      );
    },
    cell: ({ getValue }) => (
      <div className="flex items-center gap-1 justify-center text-purple-600 font-medium">
        <Code className="size-4" />
        {formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
  {
    accessorKey: "docsLines",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Docs
          <SortIcon column={column} />
        </Button>
      );
    },
    cell: ({ getValue }) => (
      <div className="flex items-center gap-1 justify-center text-orange-600 font-medium">
        <FileText className="size-4" />
        {formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
  {
    accessorKey: "dataLines",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data
          <SortIcon column={column} />
        </Button>
      );
    },
    cell: ({ getValue }) => (
      <div className="flex items-center gap-1 justify-center text-cyan-600 font-medium">
        <Database className="size-4" />
        {formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
  {
    accessorKey: "todosCompleted",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tasks Completed
          <SortIcon column={column} />
        </Button>
      );
    },
    cell: ({ getValue }) => (
      <div className="text-center">
        {formatLargeNumber(getValue() as number)}
      </div>
    ),
  },
];

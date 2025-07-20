"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Table } from "@tanstack/react-table";
import { type UserWithStats } from "@/types";

interface ColumnsDropdownProps {
  table: Table<UserWithStats>;
}

export function ColumnsDropdown({ table }: ColumnsDropdownProps) {
  const columnNames: { [key: string]: string } = {
    rank: "Rank",
    username: "Developer",
    cost: "Cost",
    tokens: "Tokens",
    linesAdded: "Lines Added",
    linesDeleted: "Lines Deleted",
    linesModified: "Lines Modified",
    codeLines: "Code",
    docsLines: "Docs",
    dataLines: "Data",
    todosCompleted: "Tasks Completed",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Columns <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {columnNames[column.id] || column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { type ApplicationType } from "@/types";

interface ApplicationDropdownProps {
  apps: ApplicationType[];
  setApps: (applications: ApplicationType[]) => void;
}

export function ApplicationDropdown({
  apps,
  setApps,
}: ApplicationDropdownProps) {
  const applications = [
    { value: "claude_code", label: "Claude Code" },
    { value: "gemini_cli", label: "Gemini CLI" },
    { value: "codex_cli", label: "Codex CLI" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Applications <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {applications.map((app) => (
          <DropdownMenuCheckboxItem
            key={app.value}
            checked={apps.includes(app.value as ApplicationType)}
            onCheckedChange={(checked) => {
              if (checked) {
                setApps([...apps, app.value as ApplicationType]);
              } else {
                setApps(apps.filter((a) => a !== app.value));
              }
            }}
          >
            {app.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

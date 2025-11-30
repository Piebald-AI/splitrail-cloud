"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ALL_APPLICATIONS, APPLICATION_LABELS } from "@/lib/application-config";
import type { ApplicationType } from "@/types";

interface ApplicationFilterStepProps {
  selectedApplications: ApplicationType[];
  onApplicationsChange: (apps: ApplicationType[]) => void;
}

export function ApplicationFilterStep({
  selectedApplications,
  onApplicationsChange,
}: ApplicationFilterStepProps) {
  const handleToggle = (app: ApplicationType) => {
    if (selectedApplications.includes(app)) {
      onApplicationsChange(selectedApplications.filter((a) => a !== app));
    } else {
      onApplicationsChange([...selectedApplications, app]);
    }
  };

  const handleSelectAll = () => {
    onApplicationsChange([...ALL_APPLICATIONS]);
  };

  const handleDeselectAll = () => {
    onApplicationsChange([]);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Applications</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select which applications&apos; data to delete for the chosen date(s).
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
        >
          Deselect All
        </Button>
      </div>

      <div className="space-y-3">
        {ALL_APPLICATIONS.map((app) => (
          <div key={app} className="flex items-center space-x-2">
            <Checkbox
              id={`app-${app}`}
              checked={selectedApplications.includes(app)}
              onCheckedChange={() => handleToggle(app)}
            />
            <Label
              htmlFor={`app-${app}`}
              className="font-normal cursor-pointer"
            >
              {APPLICATION_LABELS[app]}
            </Label>
          </div>
        ))}
      </div>

      {selectedApplications.length === 0 && (
        <p className="text-sm text-destructive">
          Please select at least one application.
        </p>
      )}
    </div>
  );
}

"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type DeletionType = "single" | "range";

interface DeletionTypeStepProps {
  value: DeletionType;
  onChange: (value: DeletionType) => void;
}

export function DeletionTypeStep({ value, onChange }: DeletionTypeStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Deletion Type</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose whether to delete data from one specific day or across multiple days.
        </p>
      </div>

      <RadioGroup value={value} onValueChange={(v: string) => onChange(v as DeletionType)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="single" id="single" />
          <Label htmlFor="single" className="font-normal cursor-pointer">
            Delete data for a single day
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="range" id="range" />
          <Label htmlFor="range" className="font-normal cursor-pointer">
            Delete data for a date range
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}

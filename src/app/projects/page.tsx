"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProjectsPage() {
  return (
    <>
      <div className="text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Projects Feature Unavailable</CardTitle>
            <CardDescription>
              The Projects feature is temporarily unavailable. Please check back
              later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This feature is currently being updated and will be available
              again soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

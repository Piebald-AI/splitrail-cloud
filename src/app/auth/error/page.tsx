"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

const errorMessages = {
  Configuration: {
    title: "Configuration Error",
    description:
      "There was an issue with the authentication configuration. Please try again later.",
  },
  AccessDenied: {
    title: "Access Denied",
    description:
      "You do not have permission to access this resource. Please contact support if you believe this is an error.",
  },
  Verification: {
    title: "Verification Failed",
    description:
      "The verification link has expired or is invalid. Please request a new verification email.",
  },
  Default: {
    title: "Authentication Error",
    description:
      "An unexpected error occurred during authentication. Please try again.",
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") as keyof typeof errorMessages;

  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {errorInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/api/auth/signin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Try Again
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}

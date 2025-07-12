"use client";

import { signIn, getProviders } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Github, Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const errorMessages = {
  OAuthSignin:
    "There was an error signing in with your provider. Please try again.",
  OAuthCallback:
    "There was an error during the OAuth callback. Please try again.",
  OAuthCreateAccount: "Could not create an account. Please try again.",
  EmailCreateAccount: "Could not create an account. Please try again.",
  Callback: "There was an error during authentication. Please try again.",
  OAuthAccountNotLinked:
    "Your account is not linked to this provider. Please try signing in with a different account.",
  EmailSignin: "There was an error sending the email. Please try again.",
  CredentialsSignin:
    "Invalid credentials. Please check your information and try again.",
  SessionRequired: "You must be signed in to access this page.",
  Default: "An unexpected error occurred. Please try again.",
};

export default function SignInForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") as keyof typeof errorMessages;
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [providers, setProviders] = useState<Record<string, { id: string; name: string }> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    loadProviders();
  }, []);

  const handleSignIn = async (providerId: string) => {
    setLoading(true);
    try {
      await signIn(providerId, { callbackUrl });
    } catch (error) {
      console.error("Sign in error:", error);
      setLoading(false);
    }
  };

  const errorMessage = error
    ? errorMessages[error] || errorMessages.Default
    : null;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {providers &&
            Object.values(providers).map((provider: { id: string; name: string }) => (
              <Button
                key={provider.name}
                onClick={() => handleSignIn(provider.id)}
                disabled={loading}
                className="w-full"
                variant={provider.id === "github" ? "default" : "outline"}
              >
                {provider.id === "github" && (
                  <Github className="mr-2 h-4 w-4" />
                )}
                {loading
                  ? "Signing in..."
                  : `Sign in with ${provider.name}`}
              </Button>
            ))}
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
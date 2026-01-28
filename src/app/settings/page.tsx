"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { type UserPreferences } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { CLITokenDisplay } from "@/components/cli-token-display";
import { DeleteDataByDate } from "@/components/delete-data-by-date";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormField,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "KRW", name: "Korean Won", symbol: "₩" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "PLN", name: "Polish Złoty", symbol: "zł" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [deleteDataDialogOpen, setDeleteDataDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);

  // RHF setup (initialized empty, will be populated from DB once loaded)
  const form = useForm<UserPreferences>({
    defaultValues: {
      currency: undefined as unknown as string,
      publicProfile: false,
    },
  });

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["preferences", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("No user session");

      const response = await fetch(`/api/user/${session.user.id}/preferences`);
      if (!response.ok) throw new Error("Failed to fetch preferences");

      const data = await response.json();
      if (data.success) {
        return data.data as UserPreferences;
      }
      throw new Error("Failed to fetch preferences");
    },
    enabled: !!session?.user?.id,
  });

  // Check if user has Codex CLI data (for showing gpt-5.2-codex warning)
  const { data: hasCodexData } = useQuery({
    queryKey: ["hasCodexData", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;

      const response = await fetch(
        `/api/user/${session.user.id}/stats?timezone=UTC`
      );
      if (!response.ok) return false;

      const data = await response.json();
      const applications: string[] = data?.applications || [];
      return applications.includes("codex_cli");
    },
    enabled: !!session?.user?.id,
  });

  // Initialize RHF defaults from DB once the query succeeds
  useEffect(() => {
    if (preferences) {
      form.reset(preferences);
    }
  }, [preferences, form]);

  const savePreferencesMutation = useMutation({
    mutationFn: async (prefs: UserPreferences) => {
      if (!session?.user?.id) throw new Error("No user session");

      const response = await fetch(`/api/user/${session.user.id}/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prefs),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save settings");
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["preferences", session?.user?.id],
      });
      // Always invalidate leaderboard query when settings are saved
      queryClient.invalidateQueries({
        queryKey: ["leaderboard"],
      });
      toast.success("Settings saved successfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while saving settings"
      );
    },
  });

  const deleteDataMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error("No user session");

      const response = await fetch(`/api/user/${session.user.id}?type=data`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to delete all data");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("All data deleted successfully!");
      setDeleteDataDialogOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while deleting all data"
      );
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error("No user session");

      const response = await fetch(
        `/api/user/${session.user.id}?type=account`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to delete account");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Account deleted successfully! You will be signed out.");
      setDeleteAccountDialogOpen(false);
      // Sign out the user after successful account deletion
      setTimeout(() => {
        signOut({ callbackUrl: "/" });
      }, 2000);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while deleting account"
      );
    },
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p className="text-muted-foreground">
            Please sign in to access your settings.
          </p>
        </div>
      </div>
    );
  }

  function onSubmit(values: UserPreferences) {
    savePreferencesMutation.mutate(values);
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* GPT-5.2-Codex Pricing Notice - only show for Codex CLI users */}
      {hasCodexData && (
        <Alert className="mb-8 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950">
          <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">
            GPT-5.2-Codex Users
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            GPT-5.2-Codex pricing was added recently. Any data uploaded with
            this model will show costs as $0. To fix: delete your Codex CLI data
            using <strong>Delete Data by Date</strong> below, then re-upload.
          </AlertDescription>
        </Alert>
      )}

      {/* CLI Integration Section */}
      <div className="mb-12 border-b border-border pb-12">
        <h2 className="text-xl font-semibold mb-4">CLI Integration</h2>
        <CLITokenDisplay />
      </div>

      {/* Profile & Display Settings */}
      <div className="mb-12 border-b border-border pb-12">
        <h2 className="text-xl font-semibold mb-4">Profile &amp; Display</h2>

        <Form {...form}>
          {/* Make sure RHF has a value after preferences load */}
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col space-y-8">
              <FormField
                control={form.control}
                name="publicProfile"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-row items-center gap-2">
                      <FormControl>
                        <Checkbox
                          id="publicProfile"
                          checked={!!field.value}
                          onCheckedChange={(checked) => {
                            const booleanValue = checked === true;
                            field.onChange(booleanValue);
                          }}
                        />
                      </FormControl>
                      <FormLabel htmlFor="publicProfile" className="text-sm">
                        Show my summarized usage data on the Splitrail
                        Leaderboard
                      </FormLabel>
                    </div>
                    <FormDescription>
                      By enabling this option you agree to share your usage
                      statistics publicly on the{" "}
                      <Link href="/leaderboard" className="text-primary">
                        Splitrail Leaderboard
                      </Link>
                      .
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Currency */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      {/* Avoid passing undefined to shadcn Select; fall back to DB or 'USD' */}
                      <Select
                        value={
                          (field.value as string | undefined) ??
                          (preferences?.currency as string | undefined) ??
                          "USD"
                        }
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="w-56">
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <SelectItem
                              key={currency.code}
                              value={currency.code}
                            >
                              {currency.symbol} {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Timezone (read-only, set by CLI) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <p className="text-sm text-muted-foreground">
                  {preferences?.timezone || "Not set"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Your timezone is automatically detected from the Splitrail CLI
                  and used to determine which day your usage is attributed to.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Button
                type="submit"
                disabled={savePreferencesMutation.isPending}
              >
                {savePreferencesMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Delete Data by Date */}
      <div className="mb-12 border-b border-border pb-12">
        <h2 className="text-xl font-semibold mb-4">Delete Data by Date</h2>
        <div className="p-6 border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
          <DeleteDataByDate />
        </div>
      </div>

      {/* Data Management */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>

        <div className="space-y-6">
          <div className="p-6 border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-medium text-yellow-800 dark:text-yellow-200">
                  Delete All Data
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  This will delete all your usage data, API tokens, and
                  preferences, but keep your account active.
                </p>
              </div>
              <Button
                variant="warning"
                onClick={() => setDeleteDataDialogOpen(true)}
                disabled={
                  deleteDataMutation.isPending ||
                  deleteAccountMutation.isPending
                }
              >
                Delete All Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
          Danger Zone
        </h2>
        <div className="p-6 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 rounded-lg">
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-medium text-red-800 dark:text-red-200">
                Delete Account
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                This will permanently delete your account and all associated
                data. You will be signed out and cannot recover this data.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteAccountDialogOpen(true)}
              disabled={
                deleteDataMutation.isPending || deleteAccountMutation.isPending
              }
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Data Dialog */}
      <AlertDialog
        open={deleteDataDialogOpen}
        onOpenChange={setDeleteDataDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ALL your data? This includes usage
              statistics, API tokens, and preferences. Your account will remain
              active but all data will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDataDialogOpen(false)}
              disabled={
                deleteDataMutation.isPending || deleteAccountMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              variant="warning"
              onClick={() => deleteDataMutation.mutate()}
              disabled={
                deleteDataMutation.isPending || deleteAccountMutation.isPending
              }
            >
              {deleteDataMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog
        open={deleteAccountDialogOpen}
        onOpenChange={setDeleteAccountDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete your account? This
              will delete your account and ALL associated data. You will be
              signed out and this action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAccountDialogOpen(false)}
              disabled={
                deleteDataMutation.isPending || deleteAccountMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteAccountMutation.mutate()}
              disabled={
                deleteDataMutation.isPending || deleteAccountMutation.isPending
              }
            >
              {deleteAccountMutation.isPending
                ? "Deleting..."
                : "Yes, Delete Account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

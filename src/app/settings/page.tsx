"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { type UserPreferences } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
  const [localPreferences, setLocalPreferences] = useState<UserPreferences>({
    currency: "USD",
    publicProfile: false,
  });
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

  // Initialize RHF defaults from DB once the query succeeds
  useEffect(() => {
    if (preferences) {
      // Ensure we keep local copy for non-form usage if any
      setLocalPreferences(preferences);
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

  const handleInputChange = (
    field: keyof UserPreferences,
    value: string | number | boolean
  ) => {
    setLocalPreferences((prev) => ({ ...prev, [field]: value }));
  };

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
    // Update local state and persist via existing mutation
    setLocalPreferences(values);
    savePreferencesMutation.mutate(values);
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-12">Settings</h1>

      {/* CLI Integration Section */}
      <div className="mb-12 border-b border-border pb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          CLI Integration
        </h2>
        <CLITokenDisplay />
      </div>

      {/* Profile & Display Settings */}
      <div className="mb-12 border-b border-border pb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Profile &amp; Display
        </h2>

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
                            handleInputChange("publicProfile", booleanValue);
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
                          handleInputChange("currency", value);
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

      {/* Data Management */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Data Management
        </h2>

        <div className="space-y-6">
          <div className="p-6 border border-yellow-300 bg-yellow-50 rounded-lg">
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-medium text-yellow-800">
                  Delete All Data
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This will delete all your usage data, API tokens, and
                  preferences, but keep your account active.
                </p>
              </div>
              <Button
                variant="destructive"
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
        <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>

        <div className="p-6 border border-red-300 bg-red-50 rounded-lg">
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-medium text-red-800">
                Delete Account
              </h3>
              <p className="text-sm text-red-700 mt-1">
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
              variant="destructive"
              onClick={() => deleteDataMutation.mutate()}
              disabled={
                deleteDataMutation.isPending || deleteAccountMutation.isPending
              }
            >
              {deleteDataMutation.isPending
                ? "Deleting..."
                : "Yes, Delete All Data"}
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

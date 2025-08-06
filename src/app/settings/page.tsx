"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { type UserPreferencesData } from "@/types";
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

const SUPPORTED_LOCALES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "中文 (简体)", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
];

const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "KRW", name: "Korean Won", symbol: "₩" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
];

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Seoul",
  "Australia/Sydney",
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [preferences, setPreferences] = useState<UserPreferencesData>({
    displayNamePreference: "displayName",
    locale: "en",
    timezone: "UTC",
    currency: "USD",
    optOutPublic: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ type: "" });

  const fetchPreferences = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/user/${session.user.id}/preferences`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);


  useEffect(() => {
    if (session?.user?.id) {
      fetchPreferences();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status, fetchPreferences]);

  const savePreferences = async () => {
    if (!session?.user?.id) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/user/${session.user.id}/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch {
      toast.error("An error occurred while saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof UserPreferencesData,
    value: string | number | boolean
  ) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteAllData = async () => {
    if (!session?.user?.id) return;

    try {
      setDeleteLoading(true);

      const response = await fetch(`/api/user/${session.user.id}?type=data`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("All data deleted successfully!");
        setDeleteConfirm({ type: "" });
      } else {
        toast.error(data.error || "Failed to delete all data");
      }
    } catch {
      toast.error("An error occurred while deleting all data");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;

    try {
      setDeleteLoading(true);

      const response = await fetch(
        `/api/user/${session.user.id}?type=account`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Account deleted successfully! You will be signed out.");
        setDeleteConfirm({ type: "" });
        // Sign out the user after successful account deletion
        setTimeout(() => {
          signOut({ callbackUrl: "/" });
        }, 2000);
      } else {
        toast.error(data.error || "Failed to delete account");
      }
    } catch {
      toast.error("An error occurred while deleting account");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (status === "loading" || loading) {
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

  return (
    <div className="container mx-auto py-8 px-6 max-w-4xl">
      {/* Header */}
      <div className="border-b pb-8 mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and configure your Splitrail CLI integration.
        </p>
      </div>
            {/* CLI Integration Section */}
            <div className="mb-12">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">CLI Integration</h2>
                <p className="text-sm text-gray-600">
                  Configure your Splitrail CLI for tracking your development activity
                </p>
              </div>
              <CLITokenDisplay />
            </div>

            {/* Profile & Display Settings */}
            <div className="mb-12">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile & Display</h2>
                <p className="text-sm text-gray-600">
                  Control how your profile appears and configure localization settings
                </p>
              </div>

              <div className="space-y-8">
                {/* Display Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Display Preferences</h3>
                    
                    <div className="space-y-3">
                      <Label htmlFor="displayNamePreference" className="text-sm font-medium">
                        Display Name Preference
                      </Label>
                      <Select
                        value={preferences.displayNamePreference}
                        onValueChange={(value) =>
                          handleInputChange(
                            "displayNamePreference",
                            value as "displayName" | "username"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select display preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="displayName">
                            Use display name (when available)
                          </SelectItem>
                          <SelectItem value="username">Always use username</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Choose how your name appears on the leaderboard
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="optOutPublic"
                          checked={!preferences.optOutPublic}
                          onCheckedChange={(checked) =>
                            handleInputChange("optOutPublic", !checked)
                          }
                        />
                        <Label htmlFor="optOutPublic" className="text-sm font-medium">
                          Show my profile on the public leaderboard
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500">
                        Your profile will be visible on the <a href="/leaderboard" className="text-primary hover:underline">Splitrail Leaderboard</a>
                      </p>
                    </div>
                  </div>

                  {/* Live Leaderboard Sample */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Live Sample</h3>
                    <p className="text-sm text-gray-600">How your settings appear on the leaderboard</p>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Rank</th>
                            <th className="text-left p-3 font-medium">User</th>
                            <th className="text-right p-3 font-medium">Cost</th>
                            <th className="text-right p-3 font-medium">Tokens</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t">
                            <td className="p-3 font-medium">1</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {session.user?.image && (
                                  <img
                                    src={session.user.image}
                                    alt="Profile"
                                    className="w-6 h-6 rounded-full"
                                  />
                                )}
                                <span className="font-medium">
                                  {preferences.displayNamePreference === "displayName"
                                    ? session.user?.name || session.user?.username || "Unknown"
                                    : session.user?.username || "Unknown"}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono">
                              {new Intl.NumberFormat(preferences.locale, {
                                style: "currency",
                                currency: preferences.currency,
                              }).format(42.73)}
                            </td>
                            <td className="p-3 text-right font-mono">
                              {new Intl.NumberFormat(preferences.locale).format(185429)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Localization Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Localization</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-sm font-medium">Language</Label>
                      <Select
                        value={preferences.locale}
                        onValueChange={(value) => handleInputChange("locale", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_LOCALES.map((locale) => (
                            <SelectItem key={locale.code} value={locale.code}>
                              {locale.flag} {locale.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                      <Select
                        value={preferences.currency}
                        onValueChange={(value) =>
                          handleInputChange("currency", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="text-sm font-medium">Timezone</Label>
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) =>
                          handleInputChange("timezone", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end mb-12 pb-8 border-b border-gray-200">
              <Button onClick={savePreferences} disabled={saving} size="lg" className="px-8">
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>

            {/* Data Management */}
            <div className="mb-12">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Management</h2>
                <p className="text-sm text-gray-600">
                  Manage your data and account settings. These actions cannot be undone.
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-6 border border-yellow-300 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-base font-medium text-yellow-800">Delete All Data</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        This will delete all your usage data, API tokens, and
                        preferences, but keep your account active.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteConfirm({ type: "allData" })}
                      disabled={deleteLoading}
                    >
                      Delete All Data
                    </Button>
                  </div>

                  {/* Confirmation for delete all data */}
                  {deleteConfirm.type === "allData" && (
                    <div className="mt-4 p-4 border border-red-300 rounded-lg">
                      <p className="text-sm text-red-800 mb-4">
                        Are you sure you want to delete ALL your data? This includes
                        usage statistics, API tokens, and preferences. Your account
                        will remain active but all data will be lost. This action
                        cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDeleteAllData}
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? "Deleting..." : "Yes, Delete All Data"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirm({ type: "" })}
                          disabled={deleteLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Danger Zone</h2>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and all associated data.
                </p>
              </div>

              <div className="p-6 border border-red-300 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-medium text-red-800">Delete Account</h3>
                    <p className="text-sm text-red-700 mt-1">
                      This will permanently delete your account and all associated
                      data. You will be signed out and cannot recover this data.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirm({ type: "account" })}
                    disabled={deleteLoading}
                  >
                    Delete Account
                  </Button>
                </div>

                {/* Confirmation for delete account */}
                {deleteConfirm.type === "account" && (
                  <div className="mt-4 p-4 border border-red-400 rounded-lg">
                    <p className="text-sm text-red-900 mb-4">
                      Are you sure you want to permanently delete your account?
                      This will delete your account and ALL associated data. You
                      will be signed out and this action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? "Deleting..." : "Yes, Delete Account"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirm({ type: "" })}
                        disabled={deleteLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
    </div>
  );
}

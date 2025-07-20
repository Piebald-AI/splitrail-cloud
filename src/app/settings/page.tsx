"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { type UserPreferencesData } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CLITokenDisplay } from "@/components/cli-token-display";
import { signOut } from "next-auth/react";

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
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
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
      setMessage(null);

      const response = await fetch(`/api/user/${session.user.id}/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to save settings",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "An error occurred while saving settings",
      });
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
      setMessage(null);

      const response = await fetch(`/api/user/${session.user.id}?type=data`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "All data deleted successfully!" });
        setDeleteConfirm({ type: "" });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to delete all data",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "An error occurred while deleting all data",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;

    try {
      setDeleteLoading(true);
      setMessage(null);

      const response = await fetch(
        `/api/user/${session.user.id}?type=account`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Account deleted successfully! You will be signed out.",
        });
        setDeleteConfirm({ type: "" });
        // Sign out the user after successful account deletion
        setTimeout(() => {
          signOut({ callbackUrl: "/" });
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to delete account",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "An error occurred while deleting account",
      });
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
    <>
      {message && (
        <Alert
          className={`mb-6 ${
            message.type === "success" ? "border-green-200 bg-green-50" : ""
          }`}
          variant={message.type === "success" ? undefined : "destructive"}
        >
          <AlertDescription
            className={message.type === "success" ? "text-green-800" : ""}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* CLI Integration */}
        <div>
          <h2 className="text-lg font-semibold mb-3">CLI Integration</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Configure your Splitrail CLI for tracking your development activity
          </p>
          <CLITokenDisplay />
        </div>

        {/* Display Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Display Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayNamePreference">
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
              <p className="text-xs text-muted-foreground">
                Choose how your name appears on the leaderboard
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="optOutPublic"
                  checked={preferences.optOutPublic}
                  onCheckedChange={(checked) =>
                    handleInputChange("optOutPublic", checked)
                  }
                />
                <Label htmlFor="optOutPublic">
                  Opt out of public leaderboard
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Hide your profile from the public leaderboard (you can still
                view your own stats)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card>
          <CardHeader>
            <CardTitle>Localization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
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
                <Label htmlFor="currency">Currency</Label>
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
                        {currency.symbol} {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
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
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Display Name:</span>{" "}
                {preferences.displayNamePreference === "displayName"
                  ? session.user?.name || session.user?.username || "Unknown"
                  : session.user?.username || "Unknown"}
              </div>
              <div>
                <span className="font-medium">Currency Format:</span>{" "}
                {new Intl.NumberFormat(preferences.locale, {
                  style: "currency",
                  currency: preferences.currency,
                }).format(123.45)}
              </div>
              <div>
                <span className="font-medium">Number Format:</span>{" "}
                {new Intl.NumberFormat(preferences.locale).format(12345.67)}
              </div>
              <div>
                <span className="font-medium">Date Format:</span>{" "}
                {new Intl.DateTimeFormat(preferences.locale, {
                  timeZone: preferences.timezone,
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }).format(new Date())}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {/* Data Management */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Data Management</CardTitle>
            <CardDescription className="text-orange-700">
              Manage your data and account settings. These actions cannot be
              undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Delete All Data */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-orange-800">Delete All Data</Label>
                <p className="text-sm text-orange-700">
                  This will delete all your usage data, API tokens, and
                  preferences, but keep your account active.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm({ type: "allData" })}
                  disabled={deleteLoading}
                >
                  Delete All Data
                </Button>
              </div>

              {/* Confirmation for delete all data */}
              {deleteConfirm.type === "allData" && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    Are you sure you want to delete ALL your data? This includes
                    usage statistics, API tokens, and preferences. Your account
                    will remain active but all data will be lost. This action
                    cannot be undone.
                    <div className="mt-2 flex gap-2">
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
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Deletion */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Danger Zone</CardTitle>
            <CardDescription className="text-red-700">
              Permanently delete your account and all associated data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-red-800">Delete Account</Label>
                <p className="text-sm text-red-700">
                  This will permanently delete your account and all associated
                  data. You will be signed out and cannot recover this data
                  (unless you still have it all locally, in which case you can
                  re-create your account and re-upload it).
                </p>
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
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    Are you sure you want to permanently delete your account?
                    This will delete your account and ALL associated data. You
                    will be signed out and this action cannot be undone.
                    <div className="mt-2 flex gap-2">
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
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

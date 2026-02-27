import { SettingsSkeleton } from "@/components/ui/page-loading";

export default function SettingsLoading() {
  return (
    <div className="animate-in fade-in-0 duration-300">
      <SettingsSkeleton />
    </div>
  );
}

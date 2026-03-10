import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import AnalyticsPage from "@/app/analytics/analytics-page";

export const metadata: Metadata = {
  title: "Analytics — Splitrail Cloud",
  description: "Daily breakdown of your agentic development stats.",
};

export default async function AnalyticsRoute() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }
  return <AnalyticsPage />;
}

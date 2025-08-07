import { auth } from "@/auth";
import { Metadata } from "next";
import { metadata as cloudMetadata } from "./layout";
import StatsPage from "./stats-page";
import HomePage from "./home-page";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();

  return session
    ? cloudMetadata
    : {
        title: "Splitrail",
        description:
          "Blazing fast, single-executable, cross-platform, agentic development monitor.",
      };
}

export default async function IndexPage() {
  const session = await auth();
  return session ? <StatsPage /> : <HomePage />;
}

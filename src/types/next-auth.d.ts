import { type DefaultSession } from "next-auth";
import { type UserPreferences } from "@prisma/client";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
      githubId: string;
      preferences?: UserPreferences | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username: string;
    githubId?: string;
    preferences?: UserPreferences | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;
    githubId?: string;
  }
}

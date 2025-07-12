import { NextAuthOptions } from "next-auth";
// import { PrismaAdapter } from '@auth/prisma-adapter'
import GitHubProvider from "next-auth/providers/github";
import { db } from "@/lib/db";

interface GitHubProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export const authOptions: NextAuthOptions = {
  // Remove the adapter to use JWT-only auth
  // adapter: PrismaAdapter(db),
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          username: profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.sub!;
        session.user.username = token.username as string;
        session.user.githubId = token.githubId as string;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        // Create or update user in database
        const githubProfile = profile as GitHubProfile;
        try {
          const dbUser = await db.user.upsert({
            where: { githubId: githubProfile.id.toString() },
            create: {
              githubId: githubProfile.id.toString(),
              username: githubProfile.login,
              displayName: githubProfile.name || githubProfile.login,
              avatarUrl: githubProfile.avatar_url,
              email: githubProfile.email,
              preferences: {
                create: {
                  displayNamePreference: "displayName",
                  locale: "en",
                  timezone: "UTC",
                  currency: "USD",
                  optOutPublic: false,
                },
              },
            },
            update: {
              username: githubProfile.login,
              displayName: githubProfile.name || githubProfile.login,
              avatarUrl: githubProfile.avatar_url,
              email: githubProfile.email,
            },
          });

          token.username = dbUser.username;
          token.githubId = dbUser.githubId;
          token.sub = dbUser.id;
        } catch (error) {
          console.error("Error upserting user:", error);
        }
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

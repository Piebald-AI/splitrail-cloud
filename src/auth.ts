import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "@/lib/db";

interface GitHubProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  [key: string]: unknown;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: {
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  trustHost: true, // Allow non-localhost hosts
  providers: [
    GitHub({
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
        const githubProfile = profile as unknown as GitHubProfile;
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
                  locale: "en",
                  timezone: "UTC",
                  currency: "USD",
                  publicProfile: false,
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
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});

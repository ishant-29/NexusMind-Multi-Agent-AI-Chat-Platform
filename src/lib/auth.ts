import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import dbConnect from "./mongodb";
import { User } from "@/models/User";

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          await dbConnect();
          const user = await User.findOne({ email: credentials.email }).lean();

          if (!user || !user.passwordHash) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      }
    }),

    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),

    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [GitHubProvider({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        })]
      : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google" || account?.provider === "github") {
          await dbConnect();
          
          let existingUser = await User.findOne({ email: user.email }).lean();
          
          if (!existingUser) {
            const newUser = await User.create({
              name: user.name,
              email: user.email,
              provider: account.provider,
              image: user.image,
            });
            existingUser = newUser.toObject();
          }
          
          user.id = existingUser._id.toString();
        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return true;
      }
    },

    async jwt({ token, user, account }) {
      try {
        if (user) {
          if (account?.provider === "google" || account?.provider === "github") {
            await dbConnect();
            const dbUser = await User.findOne({ email: user.email }).lean();
            if (dbUser) {
              token.id = dbUser._id.toString();
            }
          } else {
            token.id = user.id;
          }
          
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;
          
          if (account) {
            token.provider = account.provider;
          }
        }
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },

    async session({ session, token }) {
      try {
        if (session.user && token) {
          await dbConnect();
          
          let userId = token.id as string;
          const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
          
          if (!isValidObjectId && token.email) {
            const dbUser = await User.findOne({ email: token.email }).lean();
            if (dbUser) {
              userId = dbUser._id.toString();
            }
          }
          
          const dbUser = await User.findById(userId).select("-passwordHash").lean();
          
          if (dbUser) {
            const extendedUser = session.user as typeof session.user & { provider?: string };
            extendedUser.id = userId;
            extendedUser.email = dbUser.email;
            extendedUser.name = dbUser.name;
            extendedUser.image = dbUser.image;
            if (token.provider) {
              extendedUser.provider = token.provider as string;
            }
          }
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
  },

  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  // Required for self-hosted deployments (next start behind localhost or a
  // proxy); without it NextAuth v5 rejects every request with UntrustedHost.
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

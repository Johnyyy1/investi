import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import { anonymous } from "better-auth/plugins/anonymous";
import { eq } from "drizzle-orm";
import { ensureDemoSeed } from "@/features/demo/repository";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export const auth = betterAuth({
  appName: "investi",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  rateLimit: { enabled: true, customRules: { "/sign-in/anonymous": { window: 60, max: 5 } } },
  databaseHooks: {
    session: { create: { before: async (session) => {
      const owner = await db.query.user.findFirst({ where: eq(schema.user.id, session.userId) });
      if (!owner?.isAnonymous) return { data: session };
      await ensureDemoSeed(owner.id);
      return { data: { ...session, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } };
    } } },
  },
  plugins: [anonymous({ generateName: () => "Alex", disableDeleteAnonymousUser: false }), nextCookies()],
});

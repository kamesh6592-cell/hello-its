// Base auth instance without "server-only" - can be used in seed scripts
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { pgDb } from "lib/db/pg/db.pg";
import { headers } from "next/headers";
import {
  AccountTable,
  SessionTable,
  UserTable,
  VerificationTable,
} from "lib/db/pg/schema.pg";
import { getAuthConfig } from "./config";
import logger from "logger";
import { userRepository } from "lib/db/repository";
import { DEFAULT_USER_ROLE, USER_ROLES } from "app-types/roles";
import { admin, editor, user, ac } from "./roles";
import { sendVerificationEmail as sendVerifyEmail, sendPasswordResetEmail } from "lib/mailer";

const {
  emailAndPasswordEnabled,
  signUpEnabled,
  socialAuthenticationProviders,
} = getAuthConfig();

const options = {
  secret: process.env.BETTER_AUTH_SECRET!,
  plugins: [
    adminPlugin({
      defaultRole: DEFAULT_USER_ROLE,
      adminRoles: [USER_ROLES.ADMIN],
      ac,
      roles: {
        admin,
        editor,
        user,
      },
    }),
    nextCookies(),
  ],
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL,
  user: {
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
    },
  },
  database: drizzleAdapter(pgDb, {
    provider: "pg",
    schema: {
      user: UserTable,
      session: SessionTable,
      account: AccountTable,
      verification: VerificationTable,
    },
  }),
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          // Send login notification email when a new session is created
          try {
            console.log(`[SESSION HOOK] 🔐 New session created for user: ${session.userId}`);
            
            // Get user details
            const [user] = await pgDb
              .select()
              .from(UserTable)
              .where((table) => table.id === session.userId)
              .limit(1);
            
            if (!user || !user.email) {
              console.log(`[SESSION HOOK] ⚠️ User not found or no email for session: ${session.userId}`);
              return;
            }
            
            // Get request details from headers
            const headersList = await headers();
            const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown';
            const userAgent = headersList.get('user-agent') || 'Unknown';
            
            // Import sendLoginNotificationEmail
            const { sendLoginNotificationEmail } = await import('lib/mailer');
            
            console.log(`[SESSION HOOK] 📧 Sending login notification to ${user.email}`);
            console.log(`[SESSION HOOK] IP: ${ipAddress}, User-Agent: ${userAgent.substring(0, 50)}...`);
            
            const result = await sendLoginNotificationEmail(
              user.email,
              user.name || undefined,
              {
                ipAddress: ipAddress.split(',')[0].trim(), // Get first IP if multiple
                userAgent,
                timestamp: new Date(),
                userImage: user.image || undefined,
              }
            );
            
            if (result) {
              console.log(`[SESSION HOOK] ✅ Login notification sent to ${user.email}`);
              logger.info(`Login notification sent to: ${user.email}`);
            } else {
              console.error(`[SESSION HOOK] ❌ Failed to send login notification to ${user.email}`);
            }
          } catch (error) {
            console.error(`[SESSION HOOK] 💥 Error sending login notification:`, error);
            logger.error(`Error sending login notification:`, error);
          }
        },
      },
    },
    user: {
      create: {
        before: async (user) => {
          // This hook ONLY runs during user creation (sign-up), not on sign-in
          // Use our optimized getIsFirstUser function with caching
          const isFirstUser = await getIsFirstUser();

          // Set role based on whether this is the first user
          const role = isFirstUser ? USER_ROLES.ADMIN : DEFAULT_USER_ROLE;

          logger.info(
            `User creation hook: ${user.email} will get role: ${role} (isFirstUser: ${isFirstUser})`,
          );

          return {
            data: {
              ...user,
              role,
            },
          };
        },
        after: async (user) => {
          // Send welcome email AFTER user is created (works for both email/password and OAuth)
          console.log(`[DB HOOK] 📧 New user created: ${user.email}`);
          console.log(`[DB HOOK] User data:`, { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified });
          
          try {
            // Import sendWelcomeEmail
            const { sendWelcomeEmail } = await import('lib/mailer');
            
            // For OAuth users (Google, GitHub, etc.), email is already verified
            // So send welcome email instead of verification email
            if (user.emailVerified) {
              console.log(`[DB HOOK] 📧 OAuth user detected (email already verified), sending welcome email...`);
              const result = await sendWelcomeEmail(user.email, user.name || undefined, user.image || undefined);
              
              if (result) {
                console.log(`[DB HOOK] ✅ Welcome email sent to ${user.email}`);
                logger.info(`Welcome email sent to OAuth user: ${user.email}`);
              } else {
                console.error(`[DB HOOK] ❌ Failed to send welcome email to ${user.email}`);
                logger.error(`Failed to send welcome email to OAuth user: ${user.email}`);
              }
            } else {
              // For email/password users, send verification email
              console.log(`[DB HOOK] 📧 Email/password user detected, sending verification email...`);
              const verificationUrl = `${process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL}/verify?email=${encodeURIComponent(user.email)}`;
              const result = await sendVerifyEmail(user.email, verificationUrl, user.name || undefined, user.image || undefined);
              
              if (result) {
                console.log(`[DB HOOK] ✅ Verification email sent to ${user.email}`);
                logger.info(`Verification email sent to new user: ${user.email}`);
              } else {
                console.error(`[DB HOOK] ❌ Failed to send verification email to ${user.email}`);
                logger.error(`Failed to send verification email to new user: ${user.email}`);
              }
            }
          } catch (error) {
            console.error(`[DB HOOK] 💥 Error sending email:`, error);
            logger.error(`Error sending email to ${user.email}:`, error);
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: emailAndPasswordEnabled,
    disableSignUp: !signUpEnabled,
    sendResetPassword: async ({ user, url }) => {
      try {
        logger.info(
          `[AUTH] Sending password reset email to ${user.email} with URL: ${url}`,
        );
        console.log(`[AUTH] Password reset - Provider: ${process.env.EMAIL_PROVIDER}`);
        
        // Better Auth provides full URL already, pass it directly
        const result = await sendPasswordResetEmail(user.email, url, user.name);
        
        if (!result) {
          const errorMsg = `Failed to send password reset email to ${user.email}`;
          logger.error(errorMsg);
          console.error(`[AUTH ERROR] ${errorMsg}`);
          // Don't throw error - show error message to user instead
        } else {
          logger.info(
            `[AUTH] Successfully sent password reset email to ${user.email}`,
          );
          console.log(`[AUTH SUCCESS] Password reset email sent to ${user.email}`);
        }
      } catch (error) {
        const errorMsg = `Error sending password reset email to ${user.email}`;
        logger.error(errorMsg, error);
        console.error(`[AUTH EXCEPTION] ${errorMsg}`, error);
        // Don't throw error - show error message to user instead
      }
    },
  },
  // Email verification disabled - we handle it via database hooks instead
  // Better Auth's emailVerification hooks don't fire reliably in v1.3.x
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
  advanced: {
    useSecureCookies:
      process.env.NO_HTTPS == "1"
        ? false
        : process.env.NODE_ENV === "production",
    database: {
      generateId: false,
    },
  },
  account: {
    accountLinking: {
      trustedProviders: (
        Object.keys(
          socialAuthenticationProviders,
        ) as (keyof typeof socialAuthenticationProviders)[]
      ).filter((key) => socialAuthenticationProviders[key]),
    },
  },
  socialProviders: socialAuthenticationProviders,
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [...(options.plugins ?? [])],
});

export const getSession = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      logger.error("No session found");
      return null;
    }
    return session;
  } catch (error) {
    logger.error("Error getting session:", error);
    return null;
  }
};

// Cache the first user check to avoid repeated DB queries
let isFirstUserCache: boolean | null = null;

export const getIsFirstUser = async () => {
  // If we already know there's at least one user, return false immediately
  // This in-memory cache prevents any DB calls once we know users exist
  if (isFirstUserCache === false) {
    return false;
  }

  try {
    // Direct database query - simple and reliable
    const userCount = await userRepository.getUserCount();
    const isFirstUser = userCount === 0;

    // Once we have at least one user, cache it permanently in memory
    if (!isFirstUser) {
      isFirstUserCache = false;
    }

    return isFirstUser;
  } catch (error) {
    logger.error("Error checking if first user:", error);
    // Cache as false on error to prevent repeated attempts
    isFirstUserCache = false;
    return false;
  }
};

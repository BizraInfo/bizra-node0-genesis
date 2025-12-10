/**
 * Application Configuration
 * Centralizes all environment variables and app settings
 */

import { config as loadEnv } from "dotenv";
import { z } from "zod";

// Load environment variables
loadEnv();

// Configuration schema for validation
const configSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default(3000 as any),
  API_PREFIX: z.string().default("/api/v1"),

  // Security
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_ROUNDS: z
    .string()
    .transform(Number)
    .pipe(z.number().min(10))
    .default(12 as any),

  // OAuth2
  OAUTH_GOOGLE_CLIENT_ID: z.string().optional(),
  OAUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
  OAUTH_GITHUB_CLIENT_ID: z.string().optional(),
  OAUTH_GITHUB_CLIENT_SECRET: z.string().optional(),
  OAUTH_CALLBACK_URL: z.string().url().optional(),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z
    .string()
    .transform(Number)
    .default(2 as any),
  DATABASE_POOL_MAX: z
    .string()
    .transform(Number)
    .default(10 as any),

  // Redis
  REDIS_URL: z.string().url(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z
    .string()
    .transform(Number)
    .default(0 as any),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform(Number)
    .default(900000 as any), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform(Number)
    .default(100 as any),

  // Cache
  CACHE_TTL_DEFAULT: z
    .string()
    .transform(Number)
    .default(300 as any), // 5 minutes
  CACHE_TTL_AUTH: z
    .string()
    .transform(Number)
    .default(900 as any), // 15 minutes

  // BIZRA Blockchain
  BIZRA_NODE_URL: z.string().url(),
  BIZRA_NETWORK_ID: z.string().default("mainnet"),
  BIZRA_API_KEY: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_FORMAT: z.enum(["json", "pretty"]).default("json"),

  // CORS
  CORS_ORIGIN: z.string().default("*"),
  CORS_CREDENTIALS: z.string().transform(Boolean).default("true"),

  // Health Check
  HEALTH_CHECK_PATH: z.string().default("/health"),
  READINESS_CHECK_PATH: z.string().default("/ready"),

  // Graceful Shutdown
  SHUTDOWN_TIMEOUT_MS: z
    .string()
    .transform(Number)
    .default(10000 as any),
});

// Validate and parse configuration
const parseConfig = () => {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((issue) => issue.path.join("."))
        .join(", ");
      throw new Error(
        `Configuration validation failed. Missing or invalid: ${missingVars}`,
      );
    }
    throw error;
  }
};

export const appConfig = parseConfig();

// Export typed configuration object
export const config = {
  app: {
    env: appConfig.NODE_ENV,
    port: appConfig.PORT,
    apiPrefix: appConfig.API_PREFIX,
    isProduction: appConfig.NODE_ENV === "production",
    isDevelopment: appConfig.NODE_ENV === "development",
    isTest: appConfig.NODE_ENV === "test",
  },

  security: {
    jwt: {
      secret: appConfig.JWT_SECRET,
      expiresIn: appConfig.JWT_EXPIRES_IN,
    },
    refreshToken: {
      secret: appConfig.REFRESH_TOKEN_SECRET,
      expiresIn: appConfig.REFRESH_TOKEN_EXPIRES_IN,
    },
    bcryptRounds: appConfig.BCRYPT_ROUNDS,
  },

  oauth: {
    google: {
      clientId: appConfig.OAUTH_GOOGLE_CLIENT_ID,
      clientSecret: appConfig.OAUTH_GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: appConfig.OAUTH_GITHUB_CLIENT_ID,
      clientSecret: appConfig.OAUTH_GITHUB_CLIENT_SECRET,
    },
    callbackUrl: appConfig.OAUTH_CALLBACK_URL,
  },

  database: {
    url: appConfig.DATABASE_URL,
    pool: {
      min: appConfig.DATABASE_POOL_MIN,
      max: appConfig.DATABASE_POOL_MAX,
    },
  },

  redis: {
    url: appConfig.REDIS_URL,
    password: appConfig.REDIS_PASSWORD,
    db: appConfig.REDIS_DB,
  },

  rateLimit: {
    windowMs: appConfig.RATE_LIMIT_WINDOW_MS,
    maxRequests: appConfig.RATE_LIMIT_MAX_REQUESTS,
  },

  cache: {
    ttl: {
      default: appConfig.CACHE_TTL_DEFAULT,
      auth: appConfig.CACHE_TTL_AUTH,
    },
  },

  bizra: {
    nodeUrl: appConfig.BIZRA_NODE_URL,
    networkId: appConfig.BIZRA_NETWORK_ID,
    apiKey: appConfig.BIZRA_API_KEY,
  },

  logging: {
    level: appConfig.LOG_LEVEL,
    format: appConfig.LOG_FORMAT,
  },

  cors: {
    origin: appConfig.CORS_ORIGIN,
    credentials: appConfig.CORS_CREDENTIALS,
  },

  health: {
    checkPath: appConfig.HEALTH_CHECK_PATH,
    readinessPath: appConfig.READINESS_CHECK_PATH,
  },

  shutdown: {
    timeoutMs: appConfig.SHUTDOWN_TIMEOUT_MS,
  },
} as const;

export type AppConfig = typeof config;

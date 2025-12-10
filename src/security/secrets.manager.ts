/**
 * Secrets Management System
 * Environment-based configuration with encryption and validation
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface Secret {
  key: string;
  value: string;
  encrypted: boolean;
  createdAt: Date;
  lastRotated?: Date;
  expiresAt?: Date;
}

export interface SecretsConfig {
  encryptionKey?: string;
  secretsPath?: string;
  autoRotate?: boolean;
  rotationIntervalDays?: number;
}

/**
 * Secrets Manager - Secure storage and retrieval of sensitive data
 */
export class SecretsManager {
  private secrets: Map<string, Secret> = new Map();
  private encryptionKey: Buffer;
  private algorithm = "aes-256-gcm";
  private secretsPath: string;
  private autoRotate: boolean;
  private rotationIntervalDays: number;

  constructor(config?: SecretsConfig) {
    this.secretsPath =
      config?.secretsPath || path.join(process.cwd(), ".secrets");
    this.autoRotate = config?.autoRotate ?? false;
    this.rotationIntervalDays = config?.rotationIntervalDays ?? 90;

    // Initialize encryption key
    this.encryptionKey = this.getOrCreateEncryptionKey(config?.encryptionKey);

    // Load secrets from environment and file
    this.loadSecrets();

    // Start auto-rotation if enabled
    if (this.autoRotate) {
      this.startAutoRotation();
    }
  }

  /**
   * Get or create encryption key
   */
  private getOrCreateEncryptionKey(providedKey?: string): Buffer {
    if (providedKey) {
      return Buffer.from(providedKey, "hex");
    }

    const envKey = process.env.SECRETS_ENCRYPTION_KEY;
    if (envKey) {
      return Buffer.from(envKey, "hex");
    }

    // Generate new key
    const key = crypto.randomBytes(32);
    console.warn(
      "⚠️  Generated new encryption key. Set SECRETS_ENCRYPTION_KEY in environment.",
    );
    console.warn(`SECRETS_ENCRYPTION_KEY=${key.toString("hex")}`);
    return key;
  }

  /**
   * Load secrets from environment variables and file
   */
  private loadSecrets(): void {
    // Load from environment variables
    this.loadFromEnvironment();

    // Load from secrets file if it exists
    if (fs.existsSync(this.secretsPath)) {
      this.loadFromFile();
    }
  }

  /**
   * Load secrets from environment variables
   */
  private loadFromEnvironment(): void {
    const sensitiveKeys = [
      "DATABASE_URL",
      "REDIS_URL",
      "JWT_SECRET",
      "API_KEY",
      "ENCRYPTION_KEY",
      "AWS_SECRET_ACCESS_KEY",
      "STRIPE_SECRET_KEY",
      "SENDGRID_API_KEY",
      "TWILIO_AUTH_TOKEN",
    ];

    for (const key of sensitiveKeys) {
      const value = process.env[key];
      if (value) {
        this.secrets.set(key, {
          key,
          value,
          encrypted: false,
          createdAt: new Date(),
        });
      }
    }
  }

  /**
   * Load secrets from encrypted file
   */
  private loadFromFile(): void {
    try {
      const encrypted = fs.readFileSync(this.secretsPath, "utf-8");
      const decrypted = this.decrypt(encrypted);
      const secrets = JSON.parse(decrypted);

      for (const [key, value] of Object.entries(secrets)) {
        this.secrets.set(key, value as Secret);
      }
    } catch (error) {
      console.error("Failed to load secrets from file:", error);
    }
  }

  /**
   * Save secrets to encrypted file
   */
  private saveToFile(): void {
    try {
      const secretsObj: Record<string, Secret> = {};
      for (const [key, secret] of this.secrets.entries()) {
        secretsObj[key] = secret;
      }

      const json = JSON.stringify(secretsObj, null, 2);
      const encrypted = this.encrypt(json);

      // Ensure directory exists
      const dir = path.dirname(this.secretsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      }

      fs.writeFileSync(this.secretsPath, encrypted, { mode: 0o600 });
    } catch (error) {
      console.error("Failed to save secrets to file:", error);
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
      data: encrypted,
    });
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private decrypt(encrypted: string): string {
    const { iv, authTag, data } = JSON.parse(encrypted);

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(iv, "hex"),
    );

    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Get secret value
   */
  public get(key: string): string | undefined {
    const secret = this.secrets.get(key);
    if (!secret) {
      return undefined;
    }

    // Check expiration
    if (secret.expiresAt && secret.expiresAt < new Date()) {
      console.warn(`Secret ${key} has expired`);
      return undefined;
    }

    return secret.value;
  }

  /**
   * Set secret value
   */
  public set(key: string, value: string, expiresInDays?: number): void {
    const now = new Date();
    const expiresAt = expiresInDays
      ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    this.secrets.set(key, {
      key,
      value,
      encrypted: true,
      createdAt: now,
      expiresAt,
    });

    this.saveToFile();
  }

  /**
   * Delete secret
   */
  public delete(key: string): boolean {
    const deleted = this.secrets.delete(key);
    if (deleted) {
      this.saveToFile();
    }
    return deleted;
  }

  /**
   * Rotate secret value
   */
  public rotate(key: string, newValue: string): void {
    const secret = this.secrets.get(key);
    if (!secret) {
      throw new Error(`Secret ${key} not found`);
    }

    secret.value = newValue;
    secret.lastRotated = new Date();

    this.saveToFile();
  }

  /**
   * Check if secret needs rotation
   */
  private needsRotation(secret: Secret): boolean {
    if (!secret.lastRotated) {
      // Use creation date if never rotated
      const daysSinceCreation = Math.floor(
        (Date.now() - secret.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysSinceCreation >= this.rotationIntervalDays;
    }

    const daysSinceRotation = Math.floor(
      (Date.now() - secret.lastRotated.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysSinceRotation >= this.rotationIntervalDays;
  }

  /**
   * Start automatic secret rotation
   */
  private startAutoRotation(): void {
    setInterval(
      () => {
        for (const [key, secret] of this.secrets.entries()) {
          if (this.needsRotation(secret)) {
            console.warn(`Secret ${key} needs rotation`);
            // Emit event or trigger rotation workflow
            // Implementation depends on your rotation strategy
          }
        }
      },
      24 * 60 * 60 * 1000,
    ); // Check daily
  }

  /**
   * Get all secret keys (for auditing)
   */
  public keys(): string[] {
    return Array.from(this.secrets.keys());
  }

  /**
   * Validate required secrets
   */
  public validateRequired(requiredKeys: string[]): void {
    const missing = requiredKeys.filter((key) => !this.secrets.has(key));
    if (missing.length > 0) {
      throw new Error(`Missing required secrets: ${missing.join(", ")}`);
    }
  }

  /**
   * Export secrets for backup (encrypted)
   */
  public export(): string {
    const secretsObj: Record<string, Secret> = {};
    for (const [key, secret] of this.secrets.entries()) {
      secretsObj[key] = secret;
    }
    return this.encrypt(JSON.stringify(secretsObj));
  }

  /**
   * Import secrets from backup
   */
  public import(encrypted: string): void {
    const decrypted = this.decrypt(encrypted);
    const secrets = JSON.parse(decrypted);

    for (const [key, value] of Object.entries(secrets)) {
      this.secrets.set(key, value as Secret);
    }

    this.saveToFile();
  }
}

// Singleton instance
export const secretsManager = new SecretsManager();

/**
 * Environment configuration with validation
 */
export interface EnvironmentConfig {
  nodeEnv: "development" | "production" | "test";
  port: number;
  databaseUrl: string;
  redisUrl?: string;
  jwtSecret: string;
  apiKey?: string;
  logLevel: "debug" | "info" | "warn" | "error";
}

/**
 * Load and validate environment configuration
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  // Validate required environment variables
  const required = ["DATABASE_URL", "JWT_SECRET"];
  secretsManager.validateRequired(required);

  return {
    nodeEnv: (process.env.NODE_ENV as any) || "development",
    port: parseInt(process.env.PORT || "3000", 10),
    databaseUrl: secretsManager.get("DATABASE_URL")!,
    redisUrl: secretsManager.get("REDIS_URL"),
    jwtSecret: secretsManager.get("JWT_SECRET")!,
    apiKey: secretsManager.get("API_KEY"),
    logLevel: (process.env.LOG_LEVEL as any) || "info",
  };
}

/**
 * Prevent secrets from being logged
 */
export function sanitizeForLogging(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const sensitiveKeys = [
    "password",
    "secret",
    "token",
    "key",
    "authorization",
    "auth",
    "apiKey",
    "api_key",
  ];

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((sk) => lowerKey.includes(sk));

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

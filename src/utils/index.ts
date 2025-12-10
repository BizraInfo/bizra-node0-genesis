/**
 * Utility Functions
 */

import crypto from "crypto";

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Hash string with SHA256
 */
export const hashString = (input: string): string => {
  return crypto.createHash("sha256").update(input).digest("hex");
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry async function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
};

/**
 * Pagination helper
 */
export const paginate = <T>(
  items: T[],
  page: number = 1,
  limit: number = 10,
): { data: T[]; pagination: any } => {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: items.slice(start, end),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Omit fields from object
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

/**
 * Pick fields from object
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Check if value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

/**
 * Format bytes to human readable
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
  );
};

/**
 * Format duration in milliseconds to human readable
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Merge objects deeply
 */
export const deepMerge = <T extends object>(
  target: T,
  ...sources: Partial<T>[]
): T => {
  if (!sources.length) return target;

  const source = sources.shift();
  if (!source) return target;

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue)
    ) {
      if (!targetValue || typeof targetValue !== "object") {
        (target as any)[key] = {};
      }
      deepMerge(targetValue as any, sourceValue as any);
    } else {
      (target as any)[key] = sourceValue;
    }
  }

  return deepMerge(target, ...sources);
};

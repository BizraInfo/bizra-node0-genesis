import { Request, Response, NextFunction } from "express";
import zlib from "zlib";
import { promisify } from "util";
import { Logger } from "../utils/logger";

const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);

/**
 * High-performance response compression middleware
 * Supports Gzip and Brotli compression with intelligent selection
 * Target: Reduce response size by 60-80%
 */
export class CompressionMiddleware {
  private static instance: CompressionMiddleware;
  private readonly logger = Logger.getInstance("CompressionMiddleware");

  // Configuration
  private readonly MIN_SIZE = 1024; // Only compress responses >1KB
  private readonly COMPRESSION_LEVEL = 6; // Balance between speed and ratio
  private readonly BROTLI_LEVEL = 4; // Brotli quality level

  // Performance tracking
  private metrics = {
    totalRequests: 0,
    compressed: 0,
    bytesSaved: 0,
    compressionTime: 0,
  };

  private constructor() {}

  public static getInstance(): CompressionMiddleware {
    if (!CompressionMiddleware.instance) {
      CompressionMiddleware.instance = new CompressionMiddleware();
    }
    return CompressionMiddleware.instance;
  }

  /**
   * Express middleware for automatic response compression
   */
  public middleware(options: CompressionOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      this.metrics.totalRequests++;

      // Skip compression for certain conditions
      if (this.shouldSkipCompression(req, res, options)) {
        return next();
      }

      // Determine best compression method
      const compressionMethod = this.selectCompressionMethod(req);
      if (!compressionMethod) {
        return next();
      }

      // Intercept response
      const originalSend = res.send.bind(res);
      const originalJson = res.json.bind(res);

      // Override send method
      res.send = (body: any): Response => {
        this.compressAndSend(
          body,
          res,
          originalSend,
          compressionMethod,
          startTime,
        ).catch((error) => {
          this.logger.error("Compression error", error);
          originalSend(body);
        });

        return res;
      };

      // Override json method
      res.json = (body: any): Response => {
        this.compressAndSend(
          JSON.stringify(body),
          res,
          originalSend,
          compressionMethod,
          startTime,
          "application/json",
        ).catch((error) => {
          this.logger.error("JSON compression error", error);
          originalJson(body);
        });

        return res;
      };

      next();
    };
  }

  /**
   * Manually compress data with optimal settings
   */
  public async compress(
    data: Buffer | string,
    method: CompressionMethod = "gzip",
  ): Promise<Buffer> {
    const startTime = Date.now();
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    try {
      let compressed: Buffer;

      if (method === "brotli") {
        compressed = await brotliCompress(buffer, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: this.BROTLI_LEVEL,
            [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buffer.length,
          },
        });
      } else {
        compressed = await gzip(buffer, {
          level: this.COMPRESSION_LEVEL,
        });
      }

      const duration = Date.now() - startTime;
      const ratio = (1 - compressed.length / buffer.length) * 100;

      this.logger.debug(
        `Compressed ${buffer.length} bytes to ${compressed.length} bytes ` +
          `(${ratio.toFixed(1)}% reduction) using ${method} in ${duration}ms`,
      );

      return compressed;
    } catch (error) {
      this.logger.error(`Compression failed with method: ${method}`, error);
      throw error;
    }
  }

  /**
   * Get compression metrics
   */
  public getMetrics(): CompressionMetrics {
    const { totalRequests, compressed, bytesSaved, compressionTime } =
      this.metrics;

    return {
      totalRequests,
      compressed,
      compressionRate:
        totalRequests > 0 ? (compressed / totalRequests) * 100 : 0,
      bytesSaved,
      avgCompressionTime: compressed > 0 ? compressionTime / compressed : 0,
      avgBytesSaved: compressed > 0 ? bytesSaved / compressed : 0,
    };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      compressed: 0,
      bytesSaved: 0,
      compressionTime: 0,
    };
  }

  // Private helper methods

  private shouldSkipCompression(
    req: Request,
    res: Response,
    options: CompressionOptions,
  ): boolean {
    // Skip if already compressed
    if (res.getHeader("Content-Encoding")) {
      return true;
    }

    // Skip if no Accept-Encoding header
    if (!req.headers["accept-encoding"]) {
      return true;
    }

    // Skip for certain paths
    if (options.excludePaths?.some((path) => req.path.startsWith(path))) {
      return true;
    }

    // Skip for certain content types
    const contentType = res.getHeader("Content-Type") as string;
    if (contentType && this.isAlreadyCompressed(contentType)) {
      return true;
    }

    // Skip if specifically disabled
    if (options.enabled === false) {
      return true;
    }

    return false;
  }

  private selectCompressionMethod(req: Request): CompressionMethod | null {
    const acceptEncoding = req.headers["accept-encoding"] as string;

    if (!acceptEncoding) {
      return null;
    }

    // Prefer Brotli (better compression ratio)
    if (acceptEncoding.includes("br")) {
      return "brotli";
    }

    // Fallback to Gzip (better compatibility)
    if (acceptEncoding.includes("gzip")) {
      return "gzip";
    }

    // Last resort: deflate
    if (acceptEncoding.includes("deflate")) {
      return "deflate";
    }

    return null;
  }

  private async compressAndSend(
    body: any,
    res: Response,
    originalSend: (body: any) => Response,
    method: CompressionMethod,
    startTime: number,
    contentType?: string,
  ): Promise<void> {
    // Convert to buffer
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(String(body));

    // Skip compression for small responses
    if (buffer.length < this.MIN_SIZE) {
      originalSend(body);
      return;
    }

    try {
      // Compress data
      const compressed = await this.compress(buffer, method);

      // Update metrics
      this.metrics.compressed++;
      this.metrics.bytesSaved += buffer.length - compressed.length;
      this.metrics.compressionTime += Date.now() - startTime;

      // Set headers
      res.setHeader("Content-Encoding", method);
      res.setHeader("Content-Length", compressed.length);
      res.setHeader("Vary", "Accept-Encoding");

      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }

      // Send compressed response
      originalSend(compressed);

      // Log performance
      const duration = Date.now() - startTime;
      const ratio = (1 - compressed.length / buffer.length) * 100;

      this.logger.debug(
        `Response compressed: ${buffer.length}B → ${compressed.length}B ` +
          `(${ratio.toFixed(1)}% saved) in ${duration}ms`,
      );
    } catch (error) {
      this.logger.error("Failed to compress response", error);
      originalSend(body);
    }
  }

  private isAlreadyCompressed(contentType: string): boolean {
    const compressedTypes = [
      "image/",
      "video/",
      "audio/",
      "application/zip",
      "application/gzip",
      "application/x-rar",
      "application/pdf",
    ];

    return compressedTypes.some((type) => contentType.includes(type));
  }
}

// Types and interfaces

type CompressionMethod = "gzip" | "brotli" | "deflate";

interface CompressionOptions {
  enabled?: boolean;
  excludePaths?: string[];
  minSize?: number;
  level?: number;
}

interface CompressionMetrics {
  totalRequests: number;
  compressed: number;
  compressionRate: number;
  bytesSaved: number;
  avgCompressionTime: number;
  avgBytesSaved: number;
}

// Export singleton instance and factory function
export const compressionMiddleware = CompressionMiddleware.getInstance();

export function createCompressionMiddleware(options?: CompressionOptions) {
  return compressionMiddleware.middleware(options);
}

/**
 * API Gateway
 * Central routing, rate limiting, and middleware orchestration
 */

import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config } from "../config/app.config";
import { database } from "../config/database.config";
import { redis } from "../config/redis.config";
import {
  errorHandler,
  notFoundHandler,
  setupProcessErrorHandlers,
} from "../middleware/error-handler";
import {
  logger,
  requestIdMiddleware,
  httpLoggerMiddleware,
} from "../middleware/logger";
import { sanitizeInput } from "../middleware/validation.middleware";
import { apiRateLimiter, authRateLimiter } from "./rate-limiter";

// Import routes
import authRoutes from "../services/auth/auth.routes";
import userRoutes from "../services/user/user.routes";
import validationRoutes from "../services/validation/validation.routes";

export class ApiGateway {
  private app: Express;
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security
    this.app.use(
      helmet({
        contentSecurityPolicy: config.app.isProduction,
        crossOriginEmbedderPolicy: config.app.isProduction,
      }),
    );

    // CORS
    this.app.use(
      cors({
        origin: config.cors.origin,
        credentials: config.cors.credentials,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
        exposedHeaders: [
          "X-Request-Id",
          "X-RateLimit-Limit",
          "X-RateLimit-Remaining",
        ],
      }),
    );

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Compression
    this.app.use(compression());

    // Request tracking
    this.app.use(requestIdMiddleware);

    // Logging
    this.app.use(httpLoggerMiddleware);

    // Input sanitization
    this.app.use(sanitizeInput);

    // Trust proxy (for accurate IP detection)
    this.app.set("trust proxy", 1);

    logger.info("Middleware configured");
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    const apiPrefix = config.app.apiPrefix;

    // Health checks (no rate limiting)
    this.app.get(config.health.checkPath, this.healthCheck);
    this.app.get(config.health.readinessPath, this.readinessCheck);

    // API info
    this.app.get(`${apiPrefix}`, this.apiInfo);

    // Authentication routes (stricter rate limiting)
    this.app.use(`${apiPrefix}/auth`, authRateLimiter, authRoutes);

    // User routes (standard rate limiting)
    this.app.use(`${apiPrefix}/users`, apiRateLimiter, userRoutes);

    // Validation routes (standard rate limiting)
    this.app.use(`${apiPrefix}/validate`, apiRateLimiter, validationRoutes);

    // 404 handler
    this.app.use(notFoundHandler);

    logger.info("Routes configured", { apiPrefix });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // Express error handler
    this.app.use(errorHandler);

    // Process-level error handlers
    setupProcessErrorHandlers();

    logger.info("Error handlers configured");
  }

  /**
   * Health check endpoint
   */
  private healthCheck = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.env,
    });
  };

  /**
   * Readiness check endpoint
   */
  private readinessCheck = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const checks = {
      database: false,
      redis: false,
    };

    try {
      // Check database
      checks.database = await database.healthCheck();

      // Check Redis
      checks.redis = await redis.healthCheck();

      const isReady = checks.database && checks.redis;

      res.status(isReady ? 200 : 503).json({
        status: isReady ? "ready" : "not_ready",
        timestamp: new Date().toISOString(),
        checks,
      });
    } catch (error) {
      res.status(503).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        checks,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * API info endpoint
   */
  private apiInfo = (req: Request, res: Response): void => {
    res.json({
      name: "BIZRA Backend API",
      version: "1.0.0",
      environment: config.app.env,
      endpoints: {
        health: config.health.checkPath,
        readiness: config.health.readinessPath,
        auth: `${config.app.apiPrefix}/auth`,
        users: `${config.app.apiPrefix}/users`,
        validation: `${config.app.apiPrefix}/validate`,
      },
      documentation: "/api/docs", // Would link to Swagger/OpenAPI
    });
  };

  /**
   * Start server
   */
  async start(): Promise<void> {
    try {
      // Connect to database
      await database.connect();

      // Connect to Redis
      await redis.connect();

      // Start HTTP server
      const server = this.app.listen(config.app.port, () => {
        logger.info(`Server started`, {
          port: config.app.port,
          env: config.app.env,
          apiPrefix: config.app.apiPrefix,
        });
      });

      // Graceful shutdown
      const shutdown = async () => {
        if (this.isShuttingDown) {
          return;
        }

        this.isShuttingDown = true;
        logger.info("Shutting down gracefully...");

        // Stop accepting new connections
        server.close(async () => {
          logger.info("HTTP server closed");

          try {
            // Close database connections
            await database.disconnect();

            // Close Redis connections
            await redis.disconnect();

            logger.info("Shutdown complete");
            process.exit(0);
          } catch (error) {
            logger.error("Error during shutdown", { error });
            process.exit(1);
          }
        });

        // Force shutdown after timeout
        setTimeout(() => {
          logger.error("Forced shutdown after timeout");
          process.exit(1);
        }, config.shutdown.timeoutMs);
      };

      // Handle shutdown signals
      process.on("SIGTERM", shutdown);
      process.on("SIGINT", shutdown);
    } catch (error) {
      logger.error("Failed to start server", { error });
      process.exit(1);
    }
  }

  /**
   * Get Express app instance
   */
  getApp(): Express {
    return this.app;
  }
}

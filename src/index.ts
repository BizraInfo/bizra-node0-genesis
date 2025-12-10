/**
 * Application Entry Point
 * Bootstraps and starts the BIZRA Backend API
 */

import { ApiGateway } from "./gateway/gateway";
import { logger } from "./middleware/logger";
import { config } from "./config/app.config";

/**
 * Bootstrap application
 */
const bootstrap = async (): Promise<void> => {
  try {
    logger.info("Starting BIZRA Backend API...", {
      environment: config.app.env,
      nodeVersion: process.version,
    });

    // Create and start API gateway
    const gateway = new ApiGateway();
    await gateway.start();
  } catch (error) {
    logger.error("Failed to bootstrap application", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

// Start application
bootstrap();

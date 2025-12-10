/**
 * Test Server Helper
 * Manages test server lifecycle and configuration
 */
import express, { Express } from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';

export class TestServer {
  private app: Express;
  private server: Server | null = null;
  private port: number = 0;

  constructor(app?: Express) {
    this.app = app || express();
  }

  /**
   * Start test server on random available port
   */
  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(0, () => {
          const address = this.server!.address() as AddressInfo;
          this.port = address.port;
          resolve(this.port);
        });

        this.server.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop test server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((error) => {
        if (error) {
          reject(error);
        } else {
          this.server = null;
          this.port = 0;
          resolve();
        }
      });
    });
  }

  /**
   * Get server URL
   */
  getUrl(): string {
    if (!this.port) {
      throw new Error('Server not started');
    }
    return `http://localhost:${this.port}`;
  }

  /**
   * Get Express app instance
   */
  getApp(): Express {
    return this.app;
  }

  /**
   * Get server port
   */
  getPort(): number {
    return this.port;
  }
}

/**
 * Create test server with automatic cleanup
 */
export const createTestServer = (app?: Express): TestServer => {
  const server = new TestServer(app);

  // Auto-cleanup
  afterAll(async () => {
    await server.stop();
  });

  return server;
};

/**
 * Setup Express app for testing
 */
export const setupTestApp = (): Express => {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS for testing
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  return app;
};

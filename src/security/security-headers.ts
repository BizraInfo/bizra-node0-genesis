/**
 * Security Headers Configuration with Helmet.js
 * Comprehensive HTTP security headers for production
 */

import helmet from "helmet";
import { Application } from "express";

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: boolean | object;
  strictTransportSecurity?: boolean | object;
  xFrameOptions?: boolean | object;
  dnsPrefetchControl?: boolean | object;
  expectCt?: boolean | object;
  referrerPolicy?: boolean | object;
  permissionsPolicy?: boolean | object;
}

/**
 * Content Security Policy (CSP) configuration
 */
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Remove in production if possible
      "https://cdn.jsdelivr.net",
      "https://cdnjs.cloudflare.com",
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for many CSS frameworks
      "https://cdn.jsdelivr.net",
      "https://cdnjs.cloudflare.com",
    ],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    fontSrc: [
      "'self'",
      "data:",
      "https://cdn.jsdelivr.net",
      "https://cdnjs.cloudflare.com",
    ],
    connectSrc: ["'self'", process.env.API_URL || "http://localhost:3000"],
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests:
      process.env.NODE_ENV === "production" ? [] : undefined,
  },
  reportOnly: false,
};

/**
 * HTTP Strict Transport Security (HSTS) configuration
 */
const hstsConfig = {
  maxAge: 31536000, // 1 year in seconds
  includeSubDomains: true,
  preload: true,
};

/**
 * X-Frame-Options configuration
 */
const xFrameOptionsConfig = {
  action: "deny" as const,
};

/**
 * DNS Prefetch Control configuration
 */
const dnsPrefetchControlConfig = {
  allow: false,
};

/**
 * Expect-CT configuration
 */
const expectCtConfig = {
  maxAge: 86400, // 24 hours
  enforce: true,
  reportUri: process.env.EXPECT_CT_REPORT_URI,
};

/**
 * Referrer Policy configuration
 */
const referrerPolicyConfig = {
  policy: "strict-origin-when-cross-origin" as const,
};

/**
 * Permissions Policy configuration
 */
const permissionsPolicyConfig = {
  features: {
    geolocation: ["'self'"],
    microphone: ["'none'"],
    camera: ["'none'"],
    payment: ["'self'"],
    usb: ["'none'"],
    accelerometer: ["'none'"],
    gyroscope: ["'none'"],
    magnetometer: ["'none'"],
  },
};

/**
 * Apply security headers to Express app
 */
export function applySecurityHeaders(
  app: Application,
  config?: SecurityHeadersConfig,
): void {
  // Use Helmet.js with comprehensive security headers
  app.use(
    helmet({
      contentSecurityPolicy:
        config?.contentSecurityPolicy !== false ? cspConfig : false,
      strictTransportSecurity:
        config?.strictTransportSecurity !== false ? hstsConfig : false,
      xFrameOptions:
        config?.xFrameOptions !== false ? xFrameOptionsConfig : false,
      dnsPrefetchControl:
        config?.dnsPrefetchControl !== false ? dnsPrefetchControlConfig : false,
      expectCt: config?.expectCt !== false ? expectCtConfig : false,
      referrerPolicy:
        config?.referrerPolicy !== false ? referrerPolicyConfig : false,

      // Additional security headers
      noSniff: true, // X-Content-Type-Options: nosniff
      ieNoOpen: true, // X-Download-Options: noopen
      xssFilter: true, // X-XSS-Protection: 1; mode=block
      hidePoweredBy: true, // Remove X-Powered-By header
      hsts: config?.strictTransportSecurity !== false ? hstsConfig : false,
    }),
  );

  // Custom security headers
  app.use((req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Enable browser XSS protection
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");

    // Disable caching for sensitive data
    if (req.path.includes("/api/auth") || req.path.includes("/api/admin")) {
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
    }

    // Add custom security headers
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    res.setHeader("X-DNS-Prefetch-Control", "off");

    // Permissions Policy (formerly Feature Policy)
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(self), microphone=(), camera=(), payment=(self), usb=(), " +
        "accelerometer=(), gyroscope=(), magnetometer=()",
    );

    // Cross-Origin headers
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

    next();
  });
}

/**
 * Security headers for API responses
 */
export function apiSecurityHeaders() {
  return (req: any, res: any, next: any) => {
    // API-specific headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-API-Version", process.env.API_VERSION || "1.0.0");

    // Prevent caching of API responses
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "-1");

    next();
  };
}

/**
 * Security headers for static content
 */
export function staticContentHeaders() {
  return (req: any, res: any, next: any) => {
    // Allow caching for static content
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    // But still enforce security
    res.setHeader("X-Content-Type-Options", "nosniff");

    next();
  };
}

/**
 * CORS configuration with security
 */
export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3001",
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-API-Key",
    "X-CSRF-Token",
  ],
  exposedHeaders: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    "X-Total-Count",
    "X-Page-Count",
  ],
  maxAge: 86400, // 24 hours
};

/**
 * CSRF token configuration
 */
export const csrfOptions = {
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 3600000, // 1 hour
  },
  ignoreMethods: ["GET", "HEAD", "OPTIONS"],
  value: (req: any) => {
    return req.headers["x-csrf-token"] || req.body?._csrf || req.query?._csrf;
  },
};

/**
 * Security audit logger
 */
export function logSecurityEvent(event: string, details: any): void {
  const timestamp = new Date().toISOString();
  console.log(
    JSON.stringify({
      timestamp,
      event,
      severity: "SECURITY",
      ...details,
    }),
  );

  // In production, send to security monitoring system
  if (process.env.SECURITY_MONITORING_URL) {
    // Send to external monitoring service
    // Implementation depends on your monitoring solution
  }
}

/**
 * Security middleware chain
 */
export function securityMiddlewareChain(app: Application): void {
  // Apply all security headers
  applySecurityHeaders(app);

  // API-specific headers
  app.use("/api", apiSecurityHeaders());

  // Log security events
  app.use((req, res, next) => {
    // Log suspicious patterns
    const suspiciousPatterns = [
      /(\.\.|\/\/|\\\\)/, // Path traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /exec\(/i, // Command injection
    ];

    const url = req.url;
    const body = JSON.stringify(req.body);

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url) || pattern.test(body)) {
        logSecurityEvent("suspicious_request", {
          ip: req.ip,
          url: req.url,
          method: req.method,
          pattern: pattern.source,
          userAgent: req.headers["user-agent"],
        });
        break;
      }
    }

    next();
  });
}

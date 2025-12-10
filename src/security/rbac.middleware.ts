/**
 * Role-Based Access Control (RBAC) Middleware
 * Fine-grained permission management with hierarchical roles
 */

import { Request, Response, NextFunction } from "express";

export enum Permission {
  // User permissions
  USER_READ = "user:read",
  USER_WRITE = "user:write",
  USER_DELETE = "user:delete",
  USER_MANAGE = "user:manage",

  // Content permissions
  CONTENT_READ = "content:read",
  CONTENT_WRITE = "content:write",
  CONTENT_DELETE = "content:delete",
  CONTENT_PUBLISH = "content:publish",

  // Admin permissions
  ADMIN_READ = "admin:read",
  ADMIN_WRITE = "admin:write",
  ADMIN_DELETE = "admin:delete",
  ADMIN_MANAGE = "admin:manage",

  // System permissions
  SYSTEM_CONFIG = "system:config",
  SYSTEM_MONITOR = "system:monitor",
  SYSTEM_BACKUP = "system:backup",
  SYSTEM_RESTORE = "system:restore",

  // Security permissions
  SECURITY_AUDIT = "security:audit",
  SECURITY_MANAGE = "security:manage",

  // API permissions
  API_READ = "api:read",
  API_WRITE = "api:write",
  API_DELETE = "api:delete",
  API_ADMIN = "api:admin",
}

export enum Role {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  MODERATOR = "moderator",
  USER = "user",
  GUEST = "guest",
  SERVICE_ACCOUNT = "service_account",
}

export interface RoleDefinition {
  role: Role;
  permissions: Permission[];
  inherits?: Role[];
  description: string;
}

export interface UserContext {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

/**
 * RBAC Manager - Hierarchical role and permission management
 */
export class RBACManager {
  private roleDefinitions: Map<Role, RoleDefinition> = new Map();
  private roleHierarchy: Map<Role, Set<Permission>> = new Map();

  constructor() {
    this.initializeRoles();
    this.computeRoleHierarchy();
  }

  /**
   * Initialize role definitions
   */
  private initializeRoles(): void {
    // Super Admin - All permissions
    this.roleDefinitions.set(Role.SUPER_ADMIN, {
      role: Role.SUPER_ADMIN,
      permissions: Object.values(Permission),
      description: "Full system access",
    });

    // Admin - Most permissions except system-critical
    this.roleDefinitions.set(Role.ADMIN, {
      role: Role.ADMIN,
      permissions: [
        Permission.USER_READ,
        Permission.USER_WRITE,
        Permission.USER_DELETE,
        Permission.USER_MANAGE,
        Permission.CONTENT_READ,
        Permission.CONTENT_WRITE,
        Permission.CONTENT_DELETE,
        Permission.CONTENT_PUBLISH,
        Permission.ADMIN_READ,
        Permission.ADMIN_WRITE,
        Permission.SYSTEM_MONITOR,
        Permission.SECURITY_AUDIT,
        Permission.API_READ,
        Permission.API_WRITE,
        Permission.API_DELETE,
      ],
      description: "Administrative access",
    });

    // Moderator - Content and user management
    this.roleDefinitions.set(Role.MODERATOR, {
      role: Role.MODERATOR,
      permissions: [
        Permission.USER_READ,
        Permission.USER_WRITE,
        Permission.CONTENT_READ,
        Permission.CONTENT_WRITE,
        Permission.CONTENT_DELETE,
        Permission.CONTENT_PUBLISH,
        Permission.API_READ,
        Permission.API_WRITE,
      ],
      description: "Content moderation access",
    });

    // User - Basic CRUD on own resources
    this.roleDefinitions.set(Role.USER, {
      role: Role.USER,
      permissions: [
        Permission.USER_READ,
        Permission.CONTENT_READ,
        Permission.CONTENT_WRITE,
        Permission.API_READ,
        Permission.API_WRITE,
      ],
      description: "Standard user access",
    });

    // Guest - Read-only access
    this.roleDefinitions.set(Role.GUEST, {
      role: Role.GUEST,
      permissions: [Permission.CONTENT_READ, Permission.API_READ],
      description: "Read-only access",
    });

    // Service Account - API access
    this.roleDefinitions.set(Role.SERVICE_ACCOUNT, {
      role: Role.SERVICE_ACCOUNT,
      permissions: [
        Permission.API_READ,
        Permission.API_WRITE,
        Permission.SYSTEM_MONITOR,
      ],
      description: "Service-to-service access",
    });
  }

  /**
   * Compute role hierarchy with inherited permissions
   */
  private computeRoleHierarchy(): void {
    for (const [role, definition] of this.roleDefinitions.entries()) {
      const allPermissions = new Set<Permission>(definition.permissions);

      // Add inherited permissions
      if (definition.inherits) {
        for (const inheritedRole of definition.inherits) {
          const inheritedDef = this.roleDefinitions.get(inheritedRole);
          if (inheritedDef) {
            inheritedDef.permissions.forEach((p) => allPermissions.add(p));
          }
        }
      }

      this.roleHierarchy.set(role, allPermissions);
    }
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(
    userContext: UserContext,
    permission: Permission,
  ): boolean {
    for (const roleName of userContext.roles) {
      const role = roleName as Role;
      const permissions = this.roleHierarchy.get(role);
      if (permissions && permissions.has(permission)) {
        return true;
      }
    }

    // Check direct permissions
    return userContext.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  public hasAnyPermission(
    userContext: UserContext,
    permissions: Permission[],
  ): boolean {
    return permissions.some((permission) =>
      this.hasPermission(userContext, permission),
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  public hasAllPermissions(
    userContext: UserContext,
    permissions: Permission[],
  ): boolean {
    return permissions.every((permission) =>
      this.hasPermission(userContext, permission),
    );
  }

  /**
   * Get all permissions for user
   */
  public getUserPermissions(userContext: UserContext): Set<Permission> {
    const allPermissions = new Set<Permission>();

    // Add role-based permissions
    for (const roleName of userContext.roles) {
      const role = roleName as Role;
      const permissions = this.roleHierarchy.get(role);
      if (permissions) {
        permissions.forEach((p) => allPermissions.add(p));
      }
    }

    // Add direct permissions
    userContext.permissions.forEach((p) => {
      if (Object.values(Permission).includes(p as Permission)) {
        allPermissions.add(p as Permission);
      }
    });

    return allPermissions;
  }

  /**
   * Check if user has specific role
   */
  public hasRole(userContext: UserContext, role: Role): boolean {
    return userContext.roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  public hasAnyRole(userContext: UserContext, roles: Role[]): boolean {
    return roles.some((role) => this.hasRole(userContext, role));
  }
}

// Singleton instance
export const rbacManager = new RBACManager();

/**
 * Middleware factory - Require specific permissions
 */
export function requirePermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as UserContext;

    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    if (!rbacManager.hasAllPermissions(user, permissions)) {
      res.status(403).json({
        error: "Forbidden",
        message: "Insufficient permissions",
        required: permissions,
        current: Array.from(rbacManager.getUserPermissions(user)),
      });
      return;
    }

    next();
  };
}

/**
 * Middleware factory - Require any of the specified permissions
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as UserContext;

    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    if (!rbacManager.hasAnyPermission(user, permissions)) {
      res.status(403).json({
        error: "Forbidden",
        message: "Insufficient permissions",
        required: permissions,
        current: Array.from(rbacManager.getUserPermissions(user)),
      });
      return;
    }

    next();
  };
}

/**
 * Middleware factory - Require specific roles
 */
export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as UserContext;

    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    if (!rbacManager.hasAnyRole(user, roles)) {
      res.status(403).json({
        error: "Forbidden",
        message: "Insufficient role",
        required: roles,
        current: user.roles,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware - Resource ownership check
 */
export function requireOwnership(resourceUserIdField: string = "userId") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as UserContext;
    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    // Admins can access any resource
    if (rbacManager.hasAnyRole(user, [Role.SUPER_ADMIN, Role.ADMIN])) {
      next();
      return;
    }

    // Check ownership
    if (user.userId !== resourceUserId) {
      res.status(403).json({
        error: "Forbidden",
        message: "You can only access your own resources",
      });
      return;
    }

    next();
  };
}

/**
 * Middleware - Conditional permission check
 */
export function requirePermissionIf(
  condition: (req: Request) => boolean,
  ...permissions: Permission[]
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (condition(req)) {
      return requirePermissions(...permissions)(req, res, next);
    }
    next();
  };
}

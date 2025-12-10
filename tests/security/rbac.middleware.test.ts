/**
 * RBAC Middleware Tests
 * Test suite for role-based access control
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  RBACManager,
  Permission,
  Role,
  UserContext,
  requirePermissions,
  requireAnyPermission,
  requireRoles,
  requireOwnership
} from '../../src/security/rbac.middleware';

describe('RBACManager', () => {
  let rbacManager: RBACManager;

  beforeEach(() => {
    rbacManager = new RBACManager();
  });

  describe('Permission Checks', () => {
    it('should grant permission for user with correct role', () => {
      const user: UserContext = {
        userId: 'user-1',
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: []
      };

      const hasPermission = rbacManager.hasPermission(
        user,
        Permission.USER_MANAGE
      );

      expect(hasPermission).toBe(true);
    });

    it('should deny permission for user without correct role', () => {
      const user: UserContext = {
        userId: 'user-1',
        email: 'user@example.com',
        roles: ['user'],
        permissions: []
      };

      const hasPermission = rbacManager.hasPermission(
        user,
        Permission.USER_DELETE
      );

      expect(hasPermission).toBe(false);
    });

    it('should grant permission via direct permission assignment', () => {
      const user: UserContext = {
        userId: 'user-1',
        email: 'user@example.com',
        roles: ['user'],
        permissions: [Permission.ADMIN_READ]
      };

      const hasPermission = rbacManager.hasPermission(
        user,
        Permission.ADMIN_READ
      );

      expect(hasPermission).toBe(true);
    });

    it('should check multiple permissions with hasAllPermissions', () => {
      const user: UserContext = {
        userId: 'user-1',
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: []
      };

      const hasAll = rbacManager.hasAllPermissions(user, [
        Permission.USER_READ,
        Permission.USER_WRITE,
        Permission.CONTENT_READ
      ]);

      expect(hasAll).toBe(true);
    });

    it('should check any permission with hasAnyPermission', () => {
      const user: UserContext = {
        userId: 'user-1',
        email: 'user@example.com',
        roles: ['user'],
        permissions: []
      };

      const hasAny = rbacManager.hasAnyPermission(user, [
        Permission.USER_READ,
        Permission.CONTENT_READ
      ]);

      expect(hasAny).toBe(true);
    });
  });

  describe('Role Checks', () => {
    it('should verify user has specific role', () => {
      const user: UserContext = {
        userId: 'user-1',
        email: 'admin@example.com',
        roles: ['admin', 'moderator'],
        permissions: []
      };

      expect(rbacManager.hasRole(user, Role.ADMIN)).toBe(true);
      expect(rbacManager.hasRole(user, Role.MODERATOR)).toBe(true);
      expect(rbacManager.hasRole(user, Role.SUPER_ADMIN)).toBe(false);
    });

    it('should verify user has any of specified roles', () => {
      const user: UserContext = {
        userId: 'user-1',
        email: 'user@example.com',
        roles: ['user'],
        permissions: []
      };

      const hasAnyRole = rbacManager.hasAnyRole(user, [
        Role.ADMIN,
        Role.USER
      ]);

      expect(hasAnyRole).toBe(true);
    });
  });

  describe('Get User Permissions', () => {
    it('should return all permissions for super admin', () => {
      const user: UserContext = {
        userId: 'user-1',
        email: 'superadmin@example.com',
        roles: ['super_admin'],
        permissions: []
      };

      const permissions = rbacManager.getUserPermissions(user);

      expect(permissions.size).toBeGreaterThan(10);
      expect(permissions.has(Permission.SYSTEM_CONFIG)).toBe(true);
      expect(permissions.has(Permission.SECURITY_MANAGE)).toBe(true);
    });

    it('should return combined role and direct permissions', () => {
      const user: UserContext = {
        userId: 'user-1',
        email: 'user@example.com',
        roles: ['user'],
        permissions: [Permission.ADMIN_READ]
      };

      const permissions = rbacManager.getUserPermissions(user);

      expect(permissions.has(Permission.USER_READ)).toBe(true);
      expect(permissions.has(Permission.CONTENT_READ)).toBe(true);
      expect(permissions.has(Permission.ADMIN_READ)).toBe(true);
    });

    it('should have hierarchical permissions for different roles', () => {
      const guestUser: UserContext = {
        userId: 'user-1',
        email: 'guest@example.com',
        roles: ['guest'],
        permissions: []
      };

      const regularUser: UserContext = {
        userId: 'user-2',
        email: 'user@example.com',
        roles: ['user'],
        permissions: []
      };

      const adminUser: UserContext = {
        userId: 'user-3',
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: []
      };

      const guestPerms = rbacManager.getUserPermissions(guestUser);
      const userPerms = rbacManager.getUserPermissions(regularUser);
      const adminPerms = rbacManager.getUserPermissions(adminUser);

      expect(guestPerms.size).toBeLessThan(userPerms.size);
      expect(userPerms.size).toBeLessThan(adminPerms.size);
    });
  });
});

describe('RBAC Middleware Functions', () => {
  describe('requirePermissions', () => {
    it('should allow request with required permissions', () => {
      const middleware = requirePermissions(Permission.USER_READ);

      const req: any = {
        user: {
          userId: 'user-1',
          email: 'admin@example.com',
          roles: ['admin'],
          permissions: []
        }
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny request without required permissions', () => {
      const middleware = requirePermissions(Permission.SYSTEM_CONFIG);

      const req: any = {
        user: {
          userId: 'user-1',
          email: 'user@example.com',
          roles: ['user'],
          permissions: []
        }
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny unauthenticated request', () => {
      const middleware = requirePermissions(Permission.USER_READ);

      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAnyPermission', () => {
    it('should allow request with any of the required permissions', () => {
      const middleware = requireAnyPermission(
        Permission.USER_WRITE,
        Permission.ADMIN_WRITE
      );

      const req: any = {
        user: {
          userId: 'user-1',
          email: 'user@example.com',
          roles: ['user'],
          permissions: []
        }
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny request without any required permissions', () => {
      const middleware = requireAnyPermission(
        Permission.ADMIN_DELETE,
        Permission.SYSTEM_CONFIG
      );

      const req: any = {
        user: {
          userId: 'user-1',
          email: 'user@example.com',
          roles: ['user'],
          permissions: []
        }
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRoles', () => {
    it('should allow request with required role', () => {
      const middleware = requireRoles(Role.ADMIN);

      const req: any = {
        user: {
          userId: 'user-1',
          email: 'admin@example.com',
          roles: ['admin'],
          permissions: []
        }
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny request without required role', () => {
      const middleware = requireRoles(Role.ADMIN);

      const req: any = {
        user: {
          userId: 'user-1',
          email: 'user@example.com',
          roles: ['user'],
          permissions: []
        }
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnership', () => {
    it('should allow access to own resource', () => {
      const middleware = requireOwnership();

      const req: any = {
        user: {
          userId: 'user-123',
          email: 'user@example.com',
          roles: ['user'],
          permissions: []
        },
        params: {
          userId: 'user-123'
        }
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access to other user resource', () => {
      const middleware = requireOwnership();

      const req: any = {
        user: {
          userId: 'user-123',
          email: 'user@example.com',
          roles: ['user'],
          permissions: []
        },
        params: {
          userId: 'user-456'
        }
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow admin to access any resource', () => {
      const middleware = requireOwnership();

      const req: any = {
        user: {
          userId: 'admin-123',
          email: 'admin@example.com',
          roles: ['admin'],
          permissions: []
        },
        params: {
          userId: 'user-456'
        }
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});

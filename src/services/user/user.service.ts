/**
 * User Service
 * Business logic for user management
 */

import { UserRepository } from "./user.repository";
import { redis, cacheKeys } from "../../config/redis.config";
import {
  User,
  UserProfile,
  PaginatedResponse,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from "../../types";
import {
  UpdateUserInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
  GetUsersQuery,
  UserStatistics,
} from "./user.types";
import { logger } from "../../middleware/logger";
import { config } from "../../config/app.config";

export class UserService {
  private repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserProfile> {
    // Try cache first
    const cached = await redis.get<UserProfile>(cacheKeys.user(id), true);
    if (cached) {
      logger.debug("User cache hit", { userId: id });
      return cached;
    }

    // Get from database
    const user = await this.repository.getProfile(id);
    if (!user) {
      throw new NotFoundError("User");
    }

    // Cache user
    await redis.set(cacheKeys.user(id), user, config.cache.ttl.default);

    return user;
  }

  /**
   * Get paginated users
   */
  async getUsers(
    query: GetUsersQuery,
  ): Promise<PaginatedResponse<UserProfile>> {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search,
      sortBy = "created_at",
      sortOrder = "desc",
    } = query;

    return await this.repository.findAll(
      { role, status, search },
      { sortBy, sortOrder },
      page,
      limit,
    );
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    updates: UpdateUserInput,
  ): Promise<UserProfile> {
    // Check if user exists
    const exists = await this.repository.exists(userId);
    if (!exists) {
      throw new NotFoundError("User");
    }

    // Check username uniqueness if being updated
    if (updates.username) {
      const existingUser = await database.query(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        [updates.username, userId],
      );

      if (existingUser.length > 0) {
        throw new ConflictError("Username already taken");
      }
    }

    // Update user
    await this.repository.update(userId, updates);

    // Invalidate cache
    await redis.del(cacheKeys.user(userId));

    // Get updated profile
    return await this.getUserById(userId);
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(
    userId: string,
    updates: UpdateUserRoleInput,
  ): Promise<UserProfile> {
    // Check if user exists
    const exists = await this.repository.exists(userId);
    if (!exists) {
      throw new NotFoundError("User");
    }

    // Update role
    await this.repository.update(userId, { role: updates.role });

    // Invalidate cache
    await redis.del(cacheKeys.user(userId));

    logger.info("User role updated", { userId, newRole: updates.role });

    return await this.getUserById(userId);
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(
    userId: string,
    updates: UpdateUserStatusInput,
  ): Promise<UserProfile> {
    // Check if user exists
    const exists = await this.repository.exists(userId);
    if (!exists) {
      throw new NotFoundError("User");
    }

    // Update status
    await this.repository.update(userId, { status: updates.status });

    // Invalidate cache
    await redis.del(cacheKeys.user(userId));

    logger.info("User status updated", {
      userId,
      newStatus: updates.status,
      reason: updates.reason,
    });

    return await this.getUserById(userId);
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    // Check if user exists
    const exists = await this.repository.exists(userId);
    if (!exists) {
      throw new NotFoundError("User");
    }

    // Delete user
    await this.repository.delete(userId);

    // Invalidate cache
    await redis.del(cacheKeys.user(userId));

    logger.info("User deleted", { userId });
  }

  /**
   * Get user statistics (admin only)
   */
  async getStatistics(): Promise<UserStatistics> {
    return await this.repository.getStatistics();
  }

  /**
   * Get users by role (admin/moderator only)
   */
  async getUsersByRole(role: string): Promise<UserProfile[]> {
    return await this.repository.findByRole(role);
  }

  /**
   * Get recently active users
   */
  async getRecentlyActive(limit: number = 10): Promise<UserProfile[]> {
    return await this.repository.getRecentlyActive(limit);
  }
}

// Import database for direct queries in update validation
import { database } from "../../config/database.config";

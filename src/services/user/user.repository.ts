/**
 * User Repository
 * Database operations for user management
 */

import { database, buildQuery } from "../../config/database.config";
import { User, UserProfile, PaginatedResponse } from "../../types";
import { UserFilter, UserSort, UserStatistics } from "./user.types";
import { logger } from "../../middleware/logger";

export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE id = $1";
    const [user] = await database.query<User>(query, [id]);
    return user || null;
  }

  /**
   * Get user profile by ID
   */
  async getProfile(id: string): Promise<UserProfile | null> {
    const query = `
      SELECT id, email, username, role, status, email_verified, created_at, last_login
      FROM users
      WHERE id = $1
    `;
    const [profile] = await database.query<UserProfile>(query, [id]);
    return profile || null;
  }

  /**
   * Get paginated users with filters
   */
  async findAll(
    filter: UserFilter,
    sort: UserSort,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (filter.role) {
      conditions.push(`role = $${paramIndex}`);
      params.push(filter.role);
      paramIndex++;
    }

    if (filter.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filter.status);
      paramIndex++;
    }

    if (filter.search) {
      conditions.push(
        `(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`,
      );
      params.push(`%${filter.search}%`);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM users ${whereClause}`;
    const [{ count }] = await database.query<{ count: string }>(
      countQuery,
      params,
    );
    const total = parseInt(count);

    // Get users
    const usersQuery = `
      SELECT id, email, username, role, status, email_verified, created_at, last_login
      FROM users
      ${whereClause}
      ORDER BY ${sort.sortBy} ${sort.sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const users = await database.query<UserProfile>(usersQuery, [
      ...params,
      limit,
      offset,
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user
   */
  async update(id: string, updates: Partial<User>): Promise<User> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== "id") {
        fields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    fields.push("updated_at = NOW()");
    params.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const [user] = await database.query<User>(query, params);
    logger.info("User updated", { userId: id });
    return user;
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    const query = "DELETE FROM users WHERE id = $1";
    await database.query(query, [id]);
    logger.info("User deleted", { userId: id });
  }

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<UserStatistics> {
    const query = `
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users,
        COUNT(*) FILTER (WHERE status = 'pending_verification') as pending_verification,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
        COUNT(*) FILTER (WHERE role = 'moderator') as moderator_count,
        COUNT(*) FILTER (WHERE role = 'user') as user_count,
        COUNT(*) FILTER (WHERE role = 'guest') as guest_count
      FROM users
    `;

    const [stats] = await database.query<any>(query);

    return {
      totalUsers: parseInt(stats.total_users),
      activeUsers: parseInt(stats.active_users),
      suspendedUsers: parseInt(stats.suspended_users),
      pendingVerification: parseInt(stats.pending_verification),
      byRole: {
        admin: parseInt(stats.admin_count),
        moderator: parseInt(stats.moderator_count),
        user: parseInt(stats.user_count),
        guest: parseInt(stats.guest_count),
      },
    };
  }

  /**
   * Check if user exists
   */
  async exists(id: string): Promise<boolean> {
    const query = "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1) as exists";
    const [{ exists }] = await database.query<{ exists: boolean }>(query, [id]);
    return exists;
  }

  /**
   * Get users by role
   */
  async findByRole(role: string): Promise<UserProfile[]> {
    const query = `
      SELECT id, email, username, role, status, email_verified, created_at, last_login
      FROM users
      WHERE role = $1
      ORDER BY created_at DESC
    `;
    return await database.query<UserProfile>(query, [role]);
  }

  /**
   * Get recently active users
   */
  async getRecentlyActive(limit: number = 10): Promise<UserProfile[]> {
    const query = `
      SELECT id, email, username, role, status, email_verified, created_at, last_login
      FROM users
      WHERE last_login IS NOT NULL
      ORDER BY last_login DESC
      LIMIT $1
    `;
    return await database.query<UserProfile>(query, [limit]);
  }
}

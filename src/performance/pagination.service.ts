import { Logger } from "../utils/logger";

/**
 * High-performance cursor-based pagination service
 * Optimized for large datasets with O(1) complexity
 * Target: Support 1M+ records with <50ms response time
 */
export class PaginationService {
  private static instance: PaginationService;
  private readonly logger = Logger.getInstance("PaginationService");

  private constructor() {}

  public static getInstance(): PaginationService {
    if (!PaginationService.instance) {
      PaginationService.instance = new PaginationService();
    }
    return PaginationService.instance;
  }

  /**
   * Create paginated response with cursor-based navigation
   * More efficient than offset-based pagination for large datasets
   */
  public createPaginatedResponse<T>(
    items: T[],
    options: PaginationOptions<T>,
  ): PaginatedResponse<T> {
    const {
      limit = 20,
      cursor,
      getCursorValue,
      sortField = "id",
      sortOrder = "desc",
    } = options;

    // Validate input
    if (limit < 1 || limit > 1000) {
      throw new Error("Limit must be between 1 and 1000");
    }

    // Calculate pagination metadata
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;

    // Generate next cursor
    const nextCursor =
      hasMore && resultItems.length > 0
        ? this.generateCursor(
            resultItems[resultItems.length - 1],
            getCursorValue,
            sortField,
          )
        : null;

    // Generate previous cursor (for bidirectional pagination)
    const prevCursor =
      cursor && resultItems.length > 0
        ? this.generateCursor(resultItems[0], getCursorValue, sortField)
        : null;

    return {
      data: resultItems,
      pagination: {
        limit,
        hasMore,
        nextCursor,
        prevCursor,
        count: resultItems.length,
      },
      metadata: {
        sortField,
        sortOrder,
      },
    };
  }

  /**
   * Build SQL query with cursor-based pagination
   * Optimized for PostgreSQL with proper indexing
   */
  public buildCursorQuery(options: CursorQueryOptions): CursorQuery {
    const {
      table,
      columns = ["*"],
      cursor,
      limit = 20,
      sortField = "id",
      sortOrder = "desc",
      where = [],
      joins = [],
    } = options;

    // Validate limit
    const safeLimit = Math.min(Math.max(limit, 1), 1000);
    const fetchLimit = safeLimit + 1; // Fetch one extra to check hasMore

    // Build column list
    const columnList = columns.join(", ");

    // Build WHERE clause
    const whereConditions: string[] = [...where];
    const params: any[] = [];
    let paramCount = 0;

    // Add cursor condition
    if (cursor) {
      const decodedCursor = this.decodeCursor(cursor);
      const operator = sortOrder === "desc" ? "<" : ">";

      paramCount++;
      whereConditions.push(`${sortField} ${operator} $${paramCount}`);
      params.push(decodedCursor.value);
    }

    // Build JOIN clause
    const joinClause = joins.length > 0 ? joins.join(" ") : "";

    // Build complete WHERE clause
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Build ORDER BY clause
    const orderClause = `ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;

    // Build complete query
    const query = `
      SELECT ${columnList}
      FROM ${table}
      ${joinClause}
      ${whereClause}
      ${orderClause}
      LIMIT ${fetchLimit}
    `
      .trim()
      .replace(/\s+/g, " ");

    return {
      query,
      params,
      limit: safeLimit,
      fetchLimit,
    };
  }

  /**
   * Parse pagination parameters from request
   */
  public parsePaginationParams(params: any): ParsedPaginationParams {
    const limit = params.limit
      ? Math.min(Math.max(parseInt(params.limit, 10), 1), 1000)
      : 20;

    const cursor = params.cursor || null;
    const sortField = params.sortField || "id";
    const sortOrder = (
      params.sortOrder?.toLowerCase() === "asc" ? "asc" : "desc"
    ) as SortOrder;

    return {
      limit,
      cursor,
      sortField,
      sortOrder,
    };
  }

  /**
   * Encode cursor value for use in URLs
   */
  public encodeCursor(value: any, field: string): string {
    const cursorData = {
      value,
      field,
      timestamp: Date.now(),
    };

    return Buffer.from(JSON.stringify(cursorData)).toString("base64url");
  }

  /**
   * Decode cursor from URL-safe string
   */
  public decodeCursor(cursor: string): CursorData {
    try {
      const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
      return JSON.parse(decoded);
    } catch (error) {
      this.logger.error("Invalid cursor format", { cursor, error });
      throw new Error("Invalid cursor format");
    }
  }

  /**
   * Create offset-based pagination (legacy support)
   * Note: Less efficient for large datasets
   */
  public createOffsetPagination<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): OffsetPaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  /**
   * Build offset-based SQL query (legacy support)
   */
  public buildOffsetQuery(options: OffsetQueryOptions): OffsetQuery {
    const {
      table,
      columns = ["*"],
      page = 1,
      limit = 20,
      sortField = "id",
      sortOrder = "desc",
      where = [],
    } = options;

    const safeLimit = Math.min(Math.max(limit, 1), 1000);
    const safePage = Math.max(page, 1);
    const offset = (safePage - 1) * safeLimit;

    const columnList = columns.join(", ");
    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const orderClause = `ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;

    const query = `
      SELECT ${columnList}
      FROM ${table}
      ${whereClause}
      ${orderClause}
      LIMIT ${safeLimit}
      OFFSET ${offset}
    `
      .trim()
      .replace(/\s+/g, " ");

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${table}
      ${whereClause}
    `
      .trim()
      .replace(/\s+/g, " ");

    return {
      query,
      countQuery,
      limit: safeLimit,
      offset,
    };
  }

  /**
   * Validate cursor format and integrity
   */
  public isValidCursor(cursor: string): boolean {
    try {
      const decoded = this.decodeCursor(cursor);
      return decoded.value !== undefined && decoded.field !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Generate links for HATEOAS-style pagination
   */
  public generatePaginationLinks(
    baseUrl: string,
    pagination: PaginationMetadata,
    params: Record<string, any> = {},
  ): PaginationLinks {
    const buildUrl = (cursor: string | null) => {
      const urlParams = new URLSearchParams({
        ...params,
        limit: pagination.limit.toString(),
        ...(cursor && { cursor }),
      });
      return `${baseUrl}?${urlParams.toString()}`;
    };

    return {
      self: buildUrl(params.cursor || null),
      next: pagination.nextCursor ? buildUrl(pagination.nextCursor) : null,
      prev: pagination.prevCursor ? buildUrl(pagination.prevCursor) : null,
    };
  }

  // Private helper methods

  private generateCursor<T>(
    item: T,
    getCursorValue: ((item: T) => any) | undefined,
    sortField: string,
  ): string {
    const value = getCursorValue
      ? getCursorValue(item)
      : (item as any)[sortField];

    return this.encodeCursor(value, sortField);
  }
}

// Types and interfaces

type SortOrder = "asc" | "desc";

interface PaginationOptions<T> {
  limit?: number;
  cursor?: string | null;
  getCursorValue?: (item: T) => any;
  sortField?: string;
  sortOrder?: SortOrder;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
  metadata: {
    sortField: string;
    sortOrder: SortOrder;
  };
}

interface PaginationMetadata {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
  count: number;
}

interface CursorQueryOptions {
  table: string;
  columns?: string[];
  cursor?: string | null;
  limit?: number;
  sortField?: string;
  sortOrder?: SortOrder;
  where?: string[];
  joins?: string[];
}

interface CursorQuery {
  query: string;
  params: any[];
  limit: number;
  fetchLimit: number;
}

interface CursorData {
  value: any;
  field: string;
  timestamp: number;
}

interface ParsedPaginationParams {
  limit: number;
  cursor: string | null;
  sortField: string;
  sortOrder: SortOrder;
}

interface OffsetPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface OffsetQueryOptions {
  table: string;
  columns?: string[];
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: SortOrder;
  where?: string[];
}

interface OffsetQuery {
  query: string;
  countQuery: string;
  limit: number;
  offset: number;
}

interface PaginationLinks {
  self: string;
  next: string | null;
  prev: string | null;
}

// Export singleton instance
export const paginationService = PaginationService.getInstance();

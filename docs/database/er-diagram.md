# Database Entity-Relationship Diagram

## BIZRA-NODE0 Database Architecture

### Overview

This document describes the entity-relationship model for the BIZRA-NODE0 PostgreSQL database. The schema is designed for high-performance blockchain validation tracking with comprehensive auditing and API management.

---

## Core Tables

### 1. Users

**Purpose**: User account management with role-based access control

```
┌─────────────────────────────────────────────────────────────┐
│                           USERS                              │
├─────────────────────────────────────────────────────────────┤
│ PK  id                    UUID                               │
│     username              VARCHAR(255)    UNIQUE             │
│     email                 VARCHAR(255)    UNIQUE             │
│     password_hash         TEXT                               │
│     role                  user_role                          │
│     full_name             VARCHAR(255)                       │
│     department            VARCHAR(100)                       │
│     is_active             BOOLEAN                            │
│     is_verified           BOOLEAN                            │
│     failed_login_attempts INTEGER                            │
│     last_login_at         TIMESTAMP                          │
│     password_changed_at   TIMESTAMP                          │
│     mfa_enabled           BOOLEAN                            │
│     mfa_secret            TEXT                               │
│     metadata              JSONB                              │
│     created_at            TIMESTAMP                          │
│     updated_at            TIMESTAMP                          │
│     deleted_at            TIMESTAMP                          │
└─────────────────────────────────────────────────────────────┘
```

**Relationships**:

- One-to-Many with `sessions`
- One-to-Many with `api_keys`
- One-to-Many with `validations`
- One-to-Many with `audit_logs`

**Indexes**:

- `idx_users_email_active` - Case-insensitive email lookup
- `idx_users_username_active` - Case-insensitive username lookup
- `idx_users_role_active` - Role-based queries
- `idx_users_fulltext` - Full-text search (GIN)
- `idx_users_metadata` - JSONB queries (GIN)

---

### 2. Sessions

**Purpose**: JWT token management and session tracking

```
┌─────────────────────────────────────────────────────────────┐
│                         SESSIONS                             │
├─────────────────────────────────────────────────────────────┤
│ PK  id                    UUID                               │
│ FK  user_id               UUID       → users(id)             │
│     token_hash            TEXT       UNIQUE                  │
│     refresh_token_hash    TEXT       UNIQUE                  │
│     status                session_status                     │
│     ip_address            INET                               │
│     user_agent            TEXT                               │
│     device_fingerprint    TEXT                               │
│     last_activity_at      TIMESTAMP                          │
│     expires_at            TIMESTAMP                          │
│     metadata              JSONB                              │
│     created_at            TIMESTAMP                          │
│     revoked_at            TIMESTAMP                          │
│     revoked_reason        TEXT                               │
└─────────────────────────────────────────────────────────────┘
```

**Relationships**:

- Many-to-One with `users`

**Indexes**:

- `idx_sessions_token_hash` - Ultra-fast token lookup
- `idx_sessions_user_status_activity` - User session management
- `idx_sessions_expiry` - Expiry cleanup
- `idx_sessions_covering` - Index-only scan optimization

---

### 3. Validations (Partitioned by created_at)

**Purpose**: Blockchain validation records with monthly partitioning

```
┌─────────────────────────────────────────────────────────────┐
│                      VALIDATIONS                             │
│                  (Monthly Partitions)                        │
├─────────────────────────────────────────────────────────────┤
│ PK  id                      UUID                             │
│ PK  created_at              TIMESTAMP  (partition key)       │
│ FK  user_id                 UUID       → users(id)           │
│     validation_type         VARCHAR(100)                     │
│     status                  validation_status                │
│     blockchain_network      VARCHAR(50)                      │
│     transaction_hash        VARCHAR(255)                     │
│     block_number            BIGINT                           │
│     contract_address        VARCHAR(255)                     │
│     validator_address       VARCHAR(255)                     │
│     validation_data         JSONB                            │
│     result_data             JSONB                            │
│     gas_used                BIGINT                           │
│     gas_price               BIGINT                           │
│     error_message           TEXT                             │
│     validation_started_at   TIMESTAMP                        │
│     validation_completed_at TIMESTAMP                        │
└─────────────────────────────────────────────────────────────┘
```

**Partitions**:

- `validations_2025_01` through `validations_2025_12`
- Automatic monthly partition creation

**Relationships**:

- Many-to-One with `users`

**Indexes**:

- `idx_validations_user_status` - User validation history
- `idx_validations_tx_hash` - Transaction hash lookup
- `idx_validations_type_status` - Validation type filtering
- `idx_validations_network` - Network-specific queries
- `idx_validations_data` - JSONB searches (GIN)

---

### 4. Audit Logs (Partitioned by created_at)

**Purpose**: Comprehensive audit trail with monthly partitioning

```
┌─────────────────────────────────────────────────────────────┐
│                       AUDIT_LOGS                             │
│                  (Monthly Partitions)                        │
├─────────────────────────────────────────────────────────────┤
│ PK  id                UUID                                   │
│ PK  created_at        TIMESTAMP  (partition key)             │
│ FK  user_id           UUID       → users(id) [nullable]      │
│     action            audit_action                           │
│     resource_type     VARCHAR(100)                           │
│     resource_id       UUID                                   │
│     changes           JSONB                                  │
│     ip_address        INET                                   │
│     user_agent        TEXT                                   │
│     success           BOOLEAN                                │
│     error_message     TEXT                                   │
│     duration_ms       INTEGER                                │
│     metadata          JSONB                                  │
└─────────────────────────────────────────────────────────────┘
```

**Partitions**:

- `audit_logs_2025_01` through `audit_logs_2025_12`
- Automatic monthly partition creation

**Relationships**:

- Many-to-One with `users` (nullable)

**Indexes**:

- `idx_audit_user_action` - User activity tracking
- `idx_audit_resource` - Resource-specific audit queries
- `idx_audit_action_time` - Action-based filtering
- `idx_audit_errors` - Error log retrieval
- `idx_audit_metadata` - JSONB searches (GIN)

---

### 5. API Keys

**Purpose**: API key management with rate limiting

```
┌─────────────────────────────────────────────────────────────┐
│                        API_KEYS                              │
├─────────────────────────────────────────────────────────────┤
│ PK  id                     UUID                              │
│ FK  user_id                UUID       → users(id)            │
│     key_hash               TEXT       UNIQUE                 │
│     name                   VARCHAR(255)                      │
│     description            TEXT                              │
│     status                 api_key_status                    │
│     permissions            JSONB                             │
│     rate_limit_per_minute  INTEGER                           │
│     rate_limit_per_hour    INTEGER                           │
│     rate_limit_per_day     INTEGER                           │
│     last_used_at           TIMESTAMP                         │
│     usage_count            BIGINT                            │
│     expires_at             TIMESTAMP                         │
│     created_at             TIMESTAMP                         │
│     revoked_at             TIMESTAMP                         │
│     revoked_reason         TEXT                              │
└─────────────────────────────────────────────────────────────┘
```

**Relationships**:

- Many-to-One with `users`
- One-to-Many with `rate_limits`

**Indexes**:

- `idx_api_keys_hash_active` - Fast API key lookup
- `idx_api_keys_user_status` - User key management
- `idx_api_keys_covering` - Index-only scan optimization
- `idx_api_keys_permissions` - Permission queries (GIN)

---

### 6. Rate Limits

**Purpose**: Real-time rate limit tracking

```
┌─────────────────────────────────────────────────────────────┐
│                      RATE_LIMITS                             │
├─────────────────────────────────────────────────────────────┤
│ PK  id                BIGSERIAL                              │
│ FK  api_key_id        UUID       → api_keys(id)             │
│     window_start      TIMESTAMP                             │
│     window_type       VARCHAR(20)  ['minute','hour','day']  │
│     request_count     INTEGER                               │
│     created_at        TIMESTAMP                             │
│                                                              │
│ UNIQUE (api_key_id, window_start, window_type)              │
└─────────────────────────────────────────────────────────────┘
```

**Relationships**:

- Many-to-One with `api_keys`

**Indexes**:

- `idx_rate_limits_lookup` - Ultra-fast rate limit checks
- `idx_rate_limits_cleanup` - Old data cleanup

---

## Complete ER Diagram

```
┌─────────┐
│  USERS  │
└────┬────┘
     │
     ├──────────────┬─────────────┬─────────────┐
     │              │             │             │
     ▼              ▼             ▼             ▼
┌──────────┐  ┌────────────┐ ┌──────────┐ ┌────────────┐
│ SESSIONS │  │ API_KEYS   │ │VALIDATIONS│ │ AUDIT_LOGS │
└──────────┘  └─────┬──────┘ └──────────┘ └────────────┘
                    │        (Partitioned) (Partitioned)
                    ▼
              ┌──────────────┐
              │ RATE_LIMITS  │
              └──────────────┘
```

---

## Materialized Views

### mv_active_user_sessions

**Refresh**: Every 5 minutes
**Purpose**: Real-time active user sessions aggregated for dashboard

### mv_validation_stats_by_network

**Refresh**: Every 10 minutes
**Purpose**: Hourly validation statistics by network and type

### mv_user_activity_heatmap

**Refresh**: Every 15 minutes
**Purpose**: Hourly user activity patterns for behavioral analysis

### mv_api_key_usage

**Refresh**: Every 10 minutes
**Purpose**: Real-time API key usage and rate limit monitoring

### mv_security_anomalies

**Refresh**: Every 5 minutes
**Purpose**: Detect suspicious activity patterns for security monitoring

### mv_system_performance

**Refresh**: Every 5 minutes
**Purpose**: Real-time system performance metrics

### mv_user_role_distribution

**Refresh**: Daily
**Purpose**: User distribution by role with security metrics

---

## Data Types

### ENUM Types

**user_role**

- `admin` - Full system access
- `developer` - Development and API access
- `analyst` - Read and analysis access
- `viewer` - Read-only access
- `auditor` - Audit log access

**session_status**

- `active` - Currently valid session
- `expired` - Expired by time
- `revoked` - Manually revoked
- `invalid` - Invalid token

**validation_status**

- `pending` - Validation in progress
- `validated` - Successfully validated
- `failed` - Validation failed
- `expired` - Validation timeout

**api_key_status**

- `active` - Currently valid
- `revoked` - Manually revoked
- `expired` - Expired by time

**audit_action**

- `create`, `read`, `update`, `delete`
- `login`, `logout`
- `validate`, `error`

---

## Performance Characteristics

### Query Performance Targets

- **Simple queries** (single table, indexed): **< 10ms**
- **Complex queries** (joins, aggregations): **< 50ms**
- **Full-text searches**: **< 100ms**
- **Materialized view queries**: **< 5ms**

### Connection Pooling

- **Max connections**: 100
- **Min connections**: 10
- **Pool mode**: Transaction (via PgBouncer)
- **Replication lag**: < 100ms

### Storage Strategy

- **Partitioning**: Monthly for `validations` and `audit_logs`
- **Indexes**: 30+ optimized indexes across all tables
- **Materialized views**: 7 views for analytics layer

---

## Security Features

1. **Password Hashing**: bcrypt with salt
2. **MFA Support**: TOTP-based two-factor authentication
3. **Session Management**: JWT with refresh tokens
4. **API Key Management**: Hashed keys with granular permissions
5. **Rate Limiting**: Multi-window (minute/hour/day) tracking
6. **Audit Trail**: Comprehensive logging of all operations
7. **Soft Deletes**: Paranoid mode for data recovery
8. **Row-Level Security**: Role-based access control

---

## Maintenance

### Daily Tasks

- Expire old sessions
- Clean up rate limit data (> 7 days)
- Refresh critical materialized views
- Vacuum analyze active tables

### Weekly Tasks

- Create next month's partitions
- Reindex high-write tables
- Review slow query log
- Check replication lag

### Monthly Tasks

- Analyze partition sizes
- Review and drop unused indexes
- Backup and archive old partitions
- Update database statistics

---

## Backup Strategy

1. **Continuous Archiving**: WAL archiving enabled
2. **Point-in-Time Recovery**: Full PITR support
3. **Daily Full Backups**: Automated via pg_dump
4. **Hourly Incremental**: WAL-based incrementals
5. **Retention**: 30 days hot, 1 year cold storage

---

## Replication

### Master-Slave Setup

- **1 Master**: All write operations
- **2+ Replicas**: Read operations and failover
- **Streaming Replication**: Synchronous replication for critical data
- **Replication Lag**: Monitored, target < 100ms

---

_Generated for BIZRA-NODE0 Database Architecture v1.0.0_

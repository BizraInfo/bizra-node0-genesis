-- Test Database Initialization Script
-- Creates tables and seed data for testing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Validation rules table
CREATE TABLE IF NOT EXISTS validation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    required BOOLEAN DEFAULT false,
    min_length INTEGER,
    max_length INTEGER,
    pattern VARCHAR(255),
    custom_validator TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    attempts INTEGER DEFAULT 0,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, endpoint)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data for testing
INSERT INTO validation_rules (field, type, required, min_length, max_length, pattern) VALUES
    ('email', 'email', true, 5, 255, '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
    ('password', 'string', true, 8, 128, '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'),
    ('username', 'string', true, 3, 50, '^[a-zA-Z0-9_-]+$'),
    ('phone', 'string', false, 10, 15, '^\+?[1-9]\d{1,14}$'),
    ('url', 'url', false, 10, 2048, '^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;

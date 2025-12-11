-- LinkSweep Database Schema
-- PostgreSQL Database Creation Script

-- Drop database if exists (use with caution in production)
-- DROP DATABASE IF EXISTS linksweep;

-- Create database
CREATE DATABASE linksweep
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Connect to the database
\c linksweep;

-- Enable UUID extension if needed (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: roles
-- Purpose: Stores user role information
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    "RoleID" SERIAL PRIMARY KEY,
    "RoleName" VARCHAR(50) NOT NULL UNIQUE,
    "Status" VARCHAR(20) DEFAULT 'active',
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: users
-- Purpose: Stores user account information
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    "UserID" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "RoleID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY ("RoleID") REFERENCES roles("RoleID") ON DELETE RESTRICT
);

-- ============================================
-- Table: scans
-- Purpose: Stores scan configurations
-- ============================================
CREATE TABLE IF NOT EXISTS scans (
    "scanID" SERIAL PRIMARY KEY,
    "userID" INTEGER NOT NULL,
    "startURL" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scans_user FOREIGN KEY ("userID") REFERENCES users("UserID") ON DELETE CASCADE
);

-- ============================================
-- Table: scan_runs
-- Purpose: Stores individual scan execution runs
-- ============================================
CREATE TABLE IF NOT EXISTS scan_runs (
    "runID" SERIAL PRIMARY KEY,
    "scanID" INTEGER NOT NULL,
    "totalLinks" INTEGER DEFAULT 0,
    "brokenLinks" INTEGER DEFAULT 0,
    "runStartedAt" TIMESTAMP NOT NULL,
    "runEndedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scan_runs_scan FOREIGN KEY ("scanID") REFERENCES scans("scanID") ON DELETE CASCADE
);

-- ============================================
-- Table: linkresults
-- Purpose: Stores detailed link check results
-- ============================================
CREATE TABLE IF NOT EXISTS linkresults (
    "linkID" SERIAL PRIMARY KEY,
    "runID" INTEGER NOT NULL,
    "scanID" INTEGER NOT NULL,
    "source_page" TEXT,
    "link" TEXT NOT NULL,
    "status_code" INTEGER,
    "status_text" TEXT,
    "link_type" VARCHAR(20),
    "checkedAt" TIMESTAMP,
    "modifiedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "diagnosis" TEXT,
    "redirectedToLogin" BOOLEAN DEFAULT FALSE,
    "fixGuide" TEXT,
    CONSTRAINT fk_linkresults_run FOREIGN KEY ("runID") REFERENCES scan_runs("runID") ON DELETE CASCADE,
    CONSTRAINT fk_linkresults_scan FOREIGN KEY ("scanID") REFERENCES scans("scanID") ON DELETE CASCADE
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users("email");
CREATE INDEX IF NOT EXISTS idx_users_username ON users("username");
CREATE INDEX IF NOT EXISTS idx_users_roleid ON users("RoleID");

-- Scans table indexes
CREATE INDEX IF NOT EXISTS idx_scans_userid ON scans("userID");
CREATE INDEX IF NOT EXISTS idx_scans_createdat ON scans("createdAt");

-- Scan_runs table indexes
CREATE INDEX IF NOT EXISTS idx_scan_runs_scanid ON scan_runs("scanID");
CREATE INDEX IF NOT EXISTS idx_scan_runs_startedat ON scan_runs("runStartedAt");

-- Linkresults table indexes
CREATE INDEX IF NOT EXISTS idx_linkresults_runid ON linkresults("runID");
CREATE INDEX IF NOT EXISTS idx_linkresults_scanid ON linkresults("scanID");
CREATE INDEX IF NOT EXISTS idx_linkresults_status_code ON linkresults("status_code");
CREATE INDEX IF NOT EXISTS idx_linkresults_link_type ON linkresults("link_type");

-- ============================================
-- Triggers for updating ModifiedAt timestamps
-- ============================================

-- Function to update ModifiedAt timestamp
CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."modifiedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with ModifiedAt columns
CREATE TRIGGER update_roles_modified_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_users_modified_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_scans_modified_at
    BEFORE UPDATE ON scans
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_scan_runs_modified_at
    BEFORE UPDATE ON scan_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_linkresults_modified_at
    BEFORE UPDATE ON linkresults
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at();

-- ============================================
-- Initial Data: Insert default roles
-- ============================================

-- Insert default roles if they don't exist
INSERT INTO roles ("RoleName", "Status") 
VALUES 
    ('admin', 'active'),
    ('user', 'active')
ON CONFLICT ("RoleName") DO NOTHING;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE roles IS 'Stores user role information';
COMMENT ON TABLE users IS 'Stores user account information';
COMMENT ON TABLE scans IS 'Stores scan configurations with JSON config field';
COMMENT ON TABLE scan_runs IS 'Stores individual scan execution runs';
COMMENT ON TABLE linkresults IS 'Stores detailed link check results for each scan run';

COMMENT ON COLUMN scans."config" IS 'JSON field storing scan parameters: maxDepth, timeout, excludePaths, etc.';
COMMENT ON COLUMN linkresults."redirectedToLogin" IS 'Boolean flag indicating if the link redirected to a login page';


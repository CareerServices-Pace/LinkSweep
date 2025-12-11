-- Migration: Add forcePasswordReset column to users table
-- Run this if your database doesn't have the forcePasswordReset column yet
-- Usage: psql -U postgres -d linksweep -f migration_add_forcePasswordReset.sql

-- Add forcePasswordReset column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'forcePasswordReset'
    ) THEN
        ALTER TABLE users ADD COLUMN "forcePasswordReset" BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Column forcePasswordReset added successfully';
    ELSE
        RAISE NOTICE 'Column forcePasswordReset already exists';
    END IF;
END $$;



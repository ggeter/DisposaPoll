-- Migration: Add owner_code, viewer_code, and taker_code columns to polls table
-- These columns are used for magic links authentication

ALTER TABLE polls ADD COLUMN owner_code TEXT;
ALTER TABLE polls ADD COLUMN viewer_code TEXT;
ALTER TABLE polls ADD COLUMN taker_code TEXT;

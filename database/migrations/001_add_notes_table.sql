-- Migration: 001_add_notes_table
-- Phase 6: Notes feature
-- Date: 2026-04-21
--
-- Adds the notes table for per-matter case notes with privileged flag.
-- The Note model was added to the Prisma schema in Phase 6.
-- This migration provides the raw SQL for environments where
-- Prisma migrations are not used directly.

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  matter_id TEXT NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_privileged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Index for querying notes by matter (most common access pattern)
CREATE INDEX idx_notes_matter_id ON notes(matter_id);

-- Index for querying notes by author
CREATE INDEX idx_notes_author_id ON notes(author_id);

-- Partial index for active (non-deleted) notes -- optimizes soft-delete filtering
CREATE INDEX idx_notes_deleted_at ON notes(deleted_at) WHERE deleted_at IS NULL;

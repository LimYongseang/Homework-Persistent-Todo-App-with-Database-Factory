/**
 * supabaseModels.js
 * Supabase-specific model definitions, table names, and SQL helpers.
 *
 * Since Supabase (PostgreSQL) is schema-first, the actual table is created
 * via SQL migrations rather than code. This file centralises table names,
 * column maps, and the bootstrap SQL so nothing is hard-coded across the app.
 */

// ─── Table names ─────────────────────────────────────────────────────────────

const TABLES = {
  TODOS: 'todos',
};

// ─── Column definitions (used for validation / mapping) ───────────────────────

const TODO_COLUMNS = {
  ID: 'id',
  TEXT: 'text',
  COMPLETED: 'completed',
  USER_ID: 'user_id',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
};

// ─── Bootstrap SQL ────────────────────────────────────────────────────────────
//
// Run this SQL once inside the Supabase SQL Editor to create the required table.
// The SupabaseProvider will log this SQL if the table does not yet exist,
// making it easy to copy-paste.

const BOOTSTRAP_SQL = `
-- Enable the uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text        TEXT        NOT NULL CHECK (char_length(text) <= 500),
  completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  user_id     TEXT,                          -- NULL = global todo (no auth)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient user-filtered, time-ordered queries
CREATE INDEX IF NOT EXISTS idx_todos_user_created ON todos (user_id, created_at DESC);

-- Trigger to automatically update updated_at on row changes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS todos_set_updated_at ON todos;
CREATE TRIGGER todos_set_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
`;

// ─── Row normaliser ────────────────────────────────────────────────────────────
//
// Converts a raw Supabase row (snake_case) into a camelCase object that matches
// the shape returned by MongoDBProvider, so views and routes never need to know
// which database is in use.

function normaliseRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    userId: row.user_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = { TABLES, TODO_COLUMNS, BOOTSTRAP_SQL, normaliseRow };

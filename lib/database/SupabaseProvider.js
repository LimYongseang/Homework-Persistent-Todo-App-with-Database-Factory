/**
 * SupabaseProvider.js
 * Concrete implementation of DatabaseProvider for Supabase (PostgreSQL).
 */
const { createClient } = require('@supabase/supabase-js');
const DatabaseProvider = require('./DatabaseProvider');
const { TABLES, BOOTSTRAP_SQL, normaliseRow } = require('./models/supabaseModels');

class SupabaseProvider extends DatabaseProvider {
  constructor() {
    super();
    this.name = 'Supabase';
    this.client = null;
  }

  // ─── Connection ─────────────────────────────────────────────────────────────

  async connect() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_KEY must be defined in your .env file'
      );
    }

    // createClient is synchronous – it doesn't open a connection immediately.
    this.client = createClient(url, key);

    // Verify connectivity by attempting a lightweight query.
    const { error } = await this.client
      .from(TABLES.TODOS)
      .select('id')
      .limit(1);

    if (error) {
      // Table might not exist yet – print the bootstrap SQL to help the dev.
      if (error.code === '42P01') {
        console.error(
          '❌ Supabase: The "todos" table does not exist.\n' +
          '   Run the following SQL in your Supabase SQL Editor to create it:\n\n' +
          BOOTSTRAP_SQL
        );
      } else {
        console.error('❌ Supabase connection check failed:', error.message);
      }
      throw new Error(error.message);
    }

    console.log('✅ Connected to Supabase (PostgreSQL)');
  }

  // ─── CRUD Operations ────────────────────────────────────────────────────────

  /**
   * Retrieve all todos, optionally filtered by userId.
   * Sorted newest-first.
   */
  async getTodos(userId = null) {
    let query = this.client
      .from(TABLES.TODOS)
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    this._assertNoError(error, 'getTodos');
    return (data ?? []).map(normaliseRow);
  }

  /**
   * Retrieve a single todo by its UUID.
   */
  async getTodoById(id) {
    const { data, error } = await this.client
      .from(TABLES.TODOS)
      .select('*')
      .eq('id', id)
      .single();

    this._assertNoError(error, 'getTodoById');
    return normaliseRow(data);
  }

  /**
   * Create a new todo.
   * @param {{ text: string, userId?: string|null }} todoData
   */
  async createTodo({ text, userId = null }) {
    const { data, error } = await this.client
      .from(TABLES.TODOS)
      .insert({ text, user_id: userId ?? null })
      .select()
      .single();

    this._assertNoError(error, 'createTodo');
    return normaliseRow(data);
  }

  /**
   * Update an existing todo's text and/or completed status.
   */
  async updateTodo(id, { text, completed }) {
    const updates = {};
    if (text !== undefined) updates.text = text;
    if (completed !== undefined) updates.completed = completed;

    const { data, error } = await this.client
      .from(TABLES.TODOS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    this._assertNoError(error, 'updateTodo');
    return normaliseRow(data);
  }

  /**
   * Delete a todo by its UUID.
   * @returns {boolean} true if a row was deleted.
   */
  async deleteTodo(id) {
    const { error, count } = await this.client
      .from(TABLES.TODOS)
      .delete({ count: 'exact' })
      .eq('id', id);

    this._assertNoError(error, 'deleteTodo');
    return (count ?? 0) > 0;
  }

  /**
   * Toggle the completed status of a todo.
   * Fetches the current state first, then flips it.
   */
  async toggleTodo(id) {
    // 1. Read current completed value
    const { data: current, error: fetchErr } = await this.client
      .from(TABLES.TODOS)
      .select('completed')
      .eq('id', id)
      .single();

    this._assertNoError(fetchErr, 'toggleTodo (fetch)');
    if (!current) return null;

    // 2. Flip and persist
    const { data, error: updateErr } = await this.client
      .from(TABLES.TODOS)
      .update({ completed: !current.completed })
      .eq('id', id)
      .select()
      .single();

    this._assertNoError(updateErr, 'toggleTodo (update)');
    return normaliseRow(data);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  _assertNoError(error, operation) {
    if (error) {
      throw new Error(`Supabase ${operation} failed: ${error.message}`);
    }
  }
}

module.exports = SupabaseProvider;

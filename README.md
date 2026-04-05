# Taskr — Persistent Todo App

A Node.js/Express todo application demonstrating the **Factory Design Pattern** for database abstraction. Swap between **MongoDB Atlas** and **Supabase (PostgreSQL)** with a single environment variable.

---

## Project Structure

```
todo-app/
├── app.js                          # Entry point — Express setup & bootstrap
├── routes/
│   └── todos.js                    # All CRUD routes (Create, Read, Update, Delete)
├── lib/
│   └── database/
│       ├── DatabaseProvider.js     # Abstract base class (interface contract)
│       ├── MongoDBProvider.js      # MongoDB implementation
│       ├── SupabaseProvider.js     # Supabase implementation
│       ├── createDatabaseProvider.js  # ★ Factory function
│       └── models/
│           ├── mongoModels.js      # Mongoose schemas
│           └── supabaseModels.js   # Supabase table names + SQL helpers
├── views/
│   ├── layouts/main.hbs            # Root Handlebars layout
│   ├── home.hbs                    # Todo list page
│   ├── edit.hbs                    # Edit todo page
│   └── error.hbs                   # Error page
├── public/css/style.css            # Stylesheet
├── .env.example                    # Environment variable template
└── package.json
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials (see below).

### 3. Run the app

```bash
npm start
# or for auto-reload during development:
npm run dev
```

Visit `http://localhost:3000`.

---

## Environment Variables

| Variable       | Description                                    |
|----------------|------------------------------------------------|
| `PORT`         | Server port (default `3000`)                   |
| `DB_TYPE`      | `mongodb` or `supabase`                        |
| `MONGO_URI`    | MongoDB Atlas connection string                |
| `SUPABASE_URL` | Your Supabase project URL                      |
| `SUPABASE_KEY` | Your Supabase anon/public key                  |

---

## Database Setup

### MongoDB Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Add a database user and whitelist your IP.
3. Copy the connection string into `MONGO_URI` in `.env`.
4. Set `DB_TYPE=mongodb`.

Mongoose will create the `todos` collection automatically on first write.

### Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the bootstrap SQL below (also logged to the console if the table is missing):

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS todos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text        TEXT        NOT NULL CHECK (char_length(text) <= 500),
  completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  user_id     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_set_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

3. Copy your **Project URL** and **anon key** from `Settings → API` into `.env`.
4. Set `DB_TYPE=supabase`.

---

## Factory Pattern

The key insight is that `app.js` never imports `MongoDBProvider` or `SupabaseProvider` directly:

```js
// app.js — only the factory is imported
const createDatabaseProvider = require('./lib/database/createDatabaseProvider');
const db = await createDatabaseProvider(); // returns the correct provider
app.locals.db = db;                        // inject into all routes
```

The factory reads `DB_TYPE` and returns a connected instance:

```js
// createDatabaseProvider.js
switch (dbType) {
  case 'mongodb':  return new MongoDBProvider().connect();
  case 'supabase': return new SupabaseProvider().connect();
}
```

Both providers extend `DatabaseProvider` and implement the same interface:
- `getTodos(userId?)`
- `getTodoById(id)`
- `createTodo({ text, userId? })`
- `updateTodo(id, { text?, completed? })`
- `deleteTodo(id)`
- `toggleTodo(id)`

---

## Features

- ✅ Create, read, update, delete todos
- ✅ Toggle completion status
- ✅ Server-rendered UI with Handlebars
- ✅ Factory pattern for seamless DB switching
- ✅ Clean, responsive design

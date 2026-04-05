require('dotenv').config();

const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const createDatabaseProvider = require('./lib/database/createDatabaseProvider');

const app = express();

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    formatDate(dateStr) {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric', 
        year: 'numeric',
      });
    },
    eq(a, b) { return a === b; },
    ifVal(condition, yes, no) { return condition ? yes : no; },
  },
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getDb(req) {
  return req.app.locals.db;
}

app.get('/', async (req, res) => {
  try {
    const db = getDb(req);
    const todos = await db.getTodos();
    const completed = todos.filter(t => t.completed);
    const pending = todos.filter(t => !t.completed);
    const dbType = process.env.DB_TYPE || 'unknown';
    const providerName = db.name || dbType;
    res.render('home', {
      title: 'My Todos',
      todos,
      pending,
      completed,
      totalCount: todos.length,
      pendingCount: pending.length,
      completedCount: completed.length,
      dbType,
      providerName,
    });
  } catch (err) {
    console.error('GET / error:', err);
    res.status(500).render('error', { message: err.message });
  }
});

app.post('/todos', async (req, res) => {
  try {
    const db = getDb(req);
    const text = (req.body.text || '').trim();
    if (!text) {
      return res.redirect('/?error=Todo+text+cannot+be+empty');
    }
    await db.createTodo({ text });
    res.redirect('/');
  } catch (err) {
    console.error('POST /todos error:', err);
    res.redirect(`/?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/todos/:id/toggle', async (req, res) => {
  try {
    const db = getDb(req);
    await db.toggleTodo(req.params.id);
    res.redirect('/');
  } catch (err) {
    console.error('POST /todos/:id/toggle error:', err);
    res.redirect(`/?error=${encodeURIComponent(err.message)}`);
  }
});

app.get('/todos/:id/edit', async (req, res) => {
  try {
    const db = getDb(req);
    const todo = await db.getTodoById(req.params.id);
    if (!todo) {
      return res.redirect('/?error=Todo+not+found');
    }
    res.render('edit', { title: 'Edit Todo', todo });
  } catch (err) {
    console.error('GET /todos/:id/edit error:', err);
    res.redirect(`/?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/todos/:id/edit', async (req, res) => {
  try {
    const db = getDb(req);
    const text = (req.body.text || '').trim();
    if (!text) {
      return res.redirect(`/todos/${req.params.id}/edit?error=Text+cannot+be+empty`);
    }
    await db.updateTodo(req.params.id, { text });
    res.redirect('/');
  } catch (err) {
    console.error('POST /todos/:id/edit error:', err);
    res.redirect(`/?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/todos/:id/delete', async (req, res) => {
  try {
    const db = getDb(req);
    await db.deleteTodo(req.params.id);
    res.redirect('/');
  } catch (err) {
    console.error('POST /todos/:id/delete error:', err);
    res.redirect(`/?error=${encodeURIComponent(err.message)}`);
  }
});

app.use((_req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).render('error', { message: err.message });
});

async function bootstrap() {
  try {
    const db = await createDatabaseProvider();
    app.locals.db = db;
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}`);
      console.log(`   Database: ${db.name} (DB_TYPE=${process.env.DB_TYPE})`);
    });
  } catch (err) {
    console.error(' Failed to start application:', err.message);
    process.exit(1);
  }
}

bootstrap();

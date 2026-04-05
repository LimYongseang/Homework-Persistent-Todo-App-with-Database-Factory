const mongoose = require('mongoose');
const DatabaseProvider = require('./DatabaseProvider');
const { Todo } = require('./models/mongoModels');

class MongoDBProvider extends DatabaseProvider {
  constructor() {
    super();
    this.name = 'MongoDB';
  }

  async connect() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in your .env file');
    }

    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
    } catch (err) {
      throw err;
    }
  }

  async getTodos(userId = null) {
    const filter = userId ? { userId } : {};
    const todos = await Todo.find(filter).sort({ createdAt: -1 }).lean({ virtuals: true });
    return todos.map(this._normalise);
  }

  async getTodoById(id) {
    const todo = await Todo.findById(id).lean({ virtuals: true });
    return this._normalise(todo);
  }

  async createTodo({ text, userId = null }) {
    const todo = await Todo.create({ text, userId });
    return this._normalise(todo.toObject());
  }

  async updateTodo(id, { text, completed }) {
    const updates = {};
    if (text !== undefined) updates.text = text;
    if (completed !== undefined) updates.completed = completed;

    const todo = await Todo.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean({ virtuals: true });

    return this._normalise(todo);
  }

  async deleteTodo(id) {
    const result = await Todo.findByIdAndDelete(id);
    return result !== null;
  }

  async toggleTodo(id) {
    const todo = await Todo.findById(id);
    if (!todo) return null;

    todo.completed = !todo.completed;
    await todo.save();
    return this._normalise(todo.toObject());
  }

  _normalise(doc) {
    if (!doc) return null;
    return {
      id: doc.id ?? doc._id?.toString(),
      text: doc.text,
      completed: doc.completed,
      userId: doc.userId ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

module.exports = MongoDBProvider;

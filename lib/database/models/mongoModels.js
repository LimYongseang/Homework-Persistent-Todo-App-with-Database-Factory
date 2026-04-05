/**
 * mongoModels.js
 * Defines Mongoose schemas and model instances for MongoDB.
 * These are used exclusively by MongoDBProvider.
 */
const mongoose = require('mongoose');

// ─── Todo Schema ─────────────────────────────────────────────────────────────

const todoSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Todo text is required'],
      trim: true,
      maxlength: [500, 'Todo text cannot exceed 500 characters'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    // Optional: used when authentication is implemented (bonus feature)
    userId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
    // Transform _id → id in JSON output so the API surface is consistent
    // with the Supabase provider (which uses `id` as the primary key).
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for fetching todos sorted by creation time efficiently
todoSchema.index({ createdAt: -1 });
// Compound index for user-filtered queries (bonus auth feature)
todoSchema.index({ userId: 1, createdAt: -1 });

const Todo = mongoose.model('Todo', todoSchema);

module.exports = { Todo };

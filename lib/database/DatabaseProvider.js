class DatabaseProvider {
  async connect() {
    throw new Error(`connect() must be implemented by ${this.constructor.name}`);
  }

  async getTodos(userId = null) {
    throw new Error(`getTodos() must be implemented by ${this.constructor.name}`);
  }

  async getTodoById(id) {
    throw new Error(`getTodoById() must be implemented by ${this.constructor.name}`);
  }

  async createTodo(todoData) {
    throw new Error(`createTodo() must be implemented by ${this.constructor.name}`);
  }

  async updateTodo(id, updateData) {
    throw new Error(`updateTodo() must be implemented by ${this.constructor.name}`);
  }

  async deleteTodo(id) {
    throw new Error(`deleteTodo() must be implemented by ${this.constructor.name}`);
  }

  async toggleTodo(id) {
    throw new Error(`toggleTodo() must be implemented by ${this.constructor.name}`);
  }
}

module.exports = DatabaseProvider;

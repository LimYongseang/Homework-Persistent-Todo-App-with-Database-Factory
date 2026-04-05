const MongoDBProvider = require('./MongoDBProvider');
const SupabaseProvider = require('./SupabaseProvider');

async function createDatabaseProvider() {
  const dbType = (process.env.DB_TYPE || '').toLowerCase().trim();

  let provider;

  switch (dbType) {
    case 'mongodb':
      provider = new MongoDBProvider();
      break;

    case 'supabase':
      provider = new SupabaseProvider();
      break;

    default:
      throw new Error(
        `Unknown DB_TYPE: "${dbType}". Set DB_TYPE to "mongodb" or "supabase" in your .env file.`
      );
  }

  await provider.connect();

  return provider;
}

module.exports = createDatabaseProvider;

module.exports = createDatabaseProvider;

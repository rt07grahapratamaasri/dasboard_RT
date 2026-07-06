import { Pool } from 'pg';

// Do not initialize Pool if the environment variable is missing, to prevent cold boot crash
// This allows the handler to run and return a meaningful error message
let db: Pool | null = null;

try {
  const connectionString = process.env['DATABASE_URL'] || process.env['POSTGRES_URL'];
  if (connectionString) {
    db = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
} catch (e) {
  console.error("Failed to initialize database pool", e);
}

export { db };

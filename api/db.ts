import { Pool } from '@neondatabase/serverless';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL
});

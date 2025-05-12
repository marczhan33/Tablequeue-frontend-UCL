import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "../shared/schema";

// This script will initialize the database schema
// Run with: npx tsx scripts/init-db.ts

async function main() {
  // Use the DATABASE_URL environment variable or a default for local development
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tablequeue';
  
  // Create a connection pool
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  // Create a drizzle instance
  const db = drizzle({ client: pool, schema });
  
  // Run the migrations
  console.log('Running migrations...');
  
  try {
    // Push schema changes to the database
    // This is equivalent to running 'npm run db:push'
    await db.execute(`
      -- Create tables
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'customer'
      );

      CREATE TABLE IF NOT EXISTS restaurants (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        description TEXT,
        cuisine TEXT NOT NULL,
        price_range TEXT NOT NULL,
        phone_number TEXT,
        latitude TEXT NOT NULL,
        longitude TEXT NOT NULL,
        current_wait_status TEXT NOT NULL DEFAULT 'available',
        custom_wait_time INTEGER DEFAULT 0,
        operating_hours JSONB,
        features TEXT[],
        rating TEXT,
        review_count INTEGER
      );
    `);

    console.log('Database schema initialized successfully!');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await pool.end();
  }
}

main();
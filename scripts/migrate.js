#!/usr/bin/env node
import fs from "fs";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables locally
dotenv.config();
dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

async function runMigrations() {
  if (!dbUrl) {
    console.error("[migrate] Error: No DATABASE_URL or SUPABASE_DB_URL found in the local environment.");
    console.error("[migrate] Please ensure your database connection string is configured in .env or .env.local.");
    process.exit(1);
  }

  const { Client } = pg;
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log("[migrate] Connecting to database...");
    await client.connect();

    // 1. Ensure migrations table exists and enable RLS
    await client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE _schema_migrations ENABLE ROW LEVEL SECURITY;
      REVOKE ALL ON TABLE _schema_migrations FROM anon, authenticated;
    `);

    // 2. Fetch already applied migrations
    const { rows: appliedRows } = await client.query(`
      SELECT name FROM _schema_migrations;
    `);
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    // 3. Scan migrations folder
    const migrationsDir = path.resolve(process.cwd(), "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("[migrate] No migrations directory found. Nothing to apply.");
      await client.end();
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const pending = files.filter((f) => !appliedSet.has(f));

    if (pending.length === 0) {
      console.log(`[migrate] Database is up to date (${files.length} migrations verified).`);
      await client.end();
      return;
    }

    console.log(`[migrate] Found ${pending.length} pending migration(s):`);

    // 4. Apply each pending migration in a transaction
    for (const file of pending) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`[migrate] Applying: ${file}...`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO _schema_migrations (name) VALUES ($1)",
          [file]
        );
        await client.query("COMMIT");
        console.log(`[migrate] Successfully applied: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`[migrate] ERROR applying ${file}:`, err.message);
        throw err;
      }
    }

    // 5. Notify PostgREST to reload its schema cache
    try {
      await client.query("NOTIFY pgrst, 'reload schema';");
      console.log("[migrate] PostgREST schema cache reloaded successfully.");
    } catch (e) {
      console.warn("[migrate] Warning: Could not notify PostgREST:", e.message);
    }

    console.log("[migrate] All migrations applied successfully!");
  } catch (error) {
    console.error("[migrate] Migration process failed:", error.message);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

runMigrations();
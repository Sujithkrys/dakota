import { Client } from "pg";
import fs from "fs";
import path from "path";

const password = process.env.SUPABASE_DB_PASSWORD || "Sujith@2608";
const projectRef = process.env.SUPABASE_PROJECT_REF || "gsratycwalhzhpmxnoex";

async function runMigration() {
  const schemaPath = path.resolve(__dirname, "../supabase/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  console.log("Connecting to Supabase Postgres database...");

  const client = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log("✅ Connected to Supabase DB!");

    console.log("Applying schema...");
    await client.query(sql);
    console.log("✅ Schema applied successfully!");

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("\nTables in public schema:");
    for (const row of res.rows) {
      console.log(`  - ${row.table_name}`);
    }
  } catch (err: any) {
    console.error("Migration error:", err.message);
  } finally {
    await client.end();
  }
}

runMigration();

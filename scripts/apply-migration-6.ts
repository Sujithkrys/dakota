import { Client } from "pg";
import fs from "fs";
import path from "path";

const password = process.env.SUPABASE_DB_PASSWORD || "Sujith@2608";
const projectRef = process.env.SUPABASE_PROJECT_REF || "gsratycwalhzhpmxnoex";

async function runMigration() {
  console.log("Connecting to Supabase Postgres database...");

  const client = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log("✅ Connected to Supabase DB!");

    for (const file of ["0004_add_dms_sent.sql", "0005_add_link_clicks.sql", "0006_home_activity_tracking.sql"]) {
      const schemaPath = path.resolve(__dirname, "../supabase/migrations", file);
      if (fs.existsSync(schemaPath)) {
        console.log(`Applying ${file}...`);
        let sql = fs.readFileSync(schemaPath, "utf-8");
        sql = sql.replace(/^\uFEFF/, ""); // Strip BOM
        await client.query(sql);
        console.log(`✅ ${file} applied successfully!`);
      }
    }

    console.log("Reloading schema cache...");
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log("✅ Schema cache reloaded!");

    const res = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'conversations' AND column_name = 'email_captured_at';
    `);

    console.log("\nVerification query result (conversations.email_captured_at):");
    console.log(res.rows);

  } catch (err: any) {
    console.error("Migration error:", err.message);
  } finally {
    await client.end();
  }
}

runMigration();

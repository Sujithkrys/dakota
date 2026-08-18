import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gsratycwalhzhpmxnoex.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmF0eWN3YWxoemhwbXhub2V4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA2MjczMiwiZXhwIjoyMTAyNjM4NzMyfQ._BpEkYsn-rNEqjopoi16EaiA9l0t-qaTbZXIEVY4gS0";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmF0eWN3YWxoemhwbXhub2V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNjI3MzIsImV4cCI6MjEwMjYzODczMn0.fenE6rR16nZIHBJYWs5jI1ZZTo6XQ1ijA4cTK_xPsWM";

const admin = createClient(supabaseUrl, serviceRoleKey);
const anon = createClient(supabaseUrl, anonKey);

async function checkTables() {
  console.log("Checking Supabase connection & tables...\n");
  const tables = [
    "owners",
    "users",
    "webhook_events",
    "automations",
    "conversations",
    "messages",
    "ice_breakers",
    "rewind_jobs"
  ];

  for (const t of tables) {
    const { data, error } = await admin.from(t).select("*").limit(1);
    if (error) {
      console.log(`❌ Table [${t}]: Error ${error.code} - ${error.message}`);
    } else {
      console.log(`✅ Table [${t}]: Accessible via service_role (${data.length} rows)`);
    }
  }

  console.log("\nTesting anon key RLS lockdown (should return 0 rows or error for users):");
  const anonRes = await anon.from("users").select("*");
  console.log(`Anon query users result:`, anonRes.error ? `Error: ${anonRes.error.message}` : `Rows: ${anonRes.data?.length}`);
}

checkTables();

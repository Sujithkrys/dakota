const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://gsratycwalhzhpmxnoex.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmF0eWN3YWxoemhwbXhub2V4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA2MjczMiwiZXhwIjoyMTAyNjM4NzMyfQ._BpEkYsn-rNEqjopoi16EaiA9l0t-qaTbZXIEVY4gS0";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: messages } = await supabase.from("messages").select("id").eq("direction", "outgoing").eq("send_status", "sent");
  const { data: clicks } = await supabase.from("link_click_events").select("id");
  const { data: leads } = await supabase.from("conversations").select("id").not("email_captured_at", "is", null);

  console.log("Total DMs Sent:", messages ? messages.length : 0);
  console.log("Total Link Clicks:", clicks ? clicks.length : 0);
  console.log("Total Leads Captured:", leads ? leads.length : 0);
}

run();

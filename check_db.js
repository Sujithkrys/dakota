const { createClient } = require('@supabase/supabase-js');


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Checking messages...");
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, user_id, recipient_id, direction, automation_id, created_at, automations(id, name, trigger_source)')
    .eq('direction', 'outgoing');
    
  if (error) console.error("Error fetching messages:", error);
  else {
    console.log(`Found ${messages.length} outgoing messages.`);
    messages.forEach(m => {
      console.log(`Message ${m.id}: recipient_id=${m.recipient_id}, automation_id=${m.automation_id}`);
      console.log(`  -> automations: ${JSON.stringify(m.automations)}`);
    });
  }
}

main();

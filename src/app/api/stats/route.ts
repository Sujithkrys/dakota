import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { resolveAuthedAccount } from "@/lib/session";

export async function GET(request: NextRequest) {
  const authed = await resolveAuthedAccount(request);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { accountId: userId } = authed;

  const emptyStats = {
    dms_sent: 0,
    dms_limit: 500,
    link_clicks: 0,
    ig_accounts: 1,
    ig_accounts_limit: 1,
    active_automations: 0,
    active_threads: 0,
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json(emptyStats);
  }

  try {
    const supabaseAdmin = createAdminClient();

    const { count: dmsCount } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("direction", "outgoing");

    const { count: automationsCount } = await supabaseAdmin
      .from("automations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true);

    const { count: activeThreadsCount } = await supabaseAdmin
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Sum link clicks
    const { data: linkClicksData } = await supabaseAdmin
      .from("link_clicks")
      .select("click_count")
      .eq("user_id", userId);
      
    const totalLinkClicks = linkClicksData?.reduce((acc: number, curr: any) => acc + (curr.click_count || 0), 0) || 0;

    return NextResponse.json({
      dms_sent: dmsCount || 0,
      dms_limit: 500,
      link_clicks: totalLinkClicks,
      ig_accounts: 1,
      ig_accounts_limit: 1,
      active_automations: automationsCount || 0,
      active_threads: activeThreadsCount || 0,
    });
  } catch {
    return NextResponse.json(emptyStats);
  }
}

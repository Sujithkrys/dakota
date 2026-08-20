import { NextRequest, NextResponse } from "next/server";
import { resolveAuthedAccount } from "@/lib/session";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const accountRes = await resolveAuthedAccount(request);
  if (!accountRes || !accountRes.accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = accountRes.accountId;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const supabaseAdmin = createAdminClient();
  const startOfTodayISOString = new Date(new Date().setUTCHours(0,0,0,0)).toISOString();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Stats aggregates
    let dms_sent_total = 0, dms_sent_today = 0;
    let link_clicks_total = 0, link_clicks_today = 0;
    let leads_total = 0, leads_today = 0;

    // DMs total
    const { count: dmTotalCount } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("direction", "outgoing")
      .eq("send_status", "sent");
    dms_sent_total = dmTotalCount || 0;

    // DMs today
    const { count: dmTodayCount } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("direction", "outgoing")
      .eq("send_status", "sent")
      .gte("created_at", startOfTodayISOString);
    dms_sent_today = dmTodayCount || 0;

    // Link Clicks Total
    const { data: lcAgg } = await supabaseAdmin
      .from("link_clicks")
      .select("click_count")
      .eq("user_id", userId);
    link_clicks_total = lcAgg?.reduce((sum, row) => sum + (row.click_count || 0), 0) || 0;

    // Link Clicks Today (from events table)
    const { count: lcTodayCount } = await supabaseAdmin
      .from("link_click_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfTodayISOString);
    link_clicks_today = lcTodayCount || 0;

    // Leads Total
    const { count: leadsTotalCount } = await supabaseAdmin
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("follower_email", "is", null);
    leads_total = leadsTotalCount || 0;

    // Leads Today
    const { count: leadsTodayCount } = await supabaseAdmin
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("follower_email", "is", null)
      .gte("email_captured_at", startOfTodayISOString);
    leads_today = leadsTodayCount || 0;

    // 2. Active automations
    const { count: activeCount } = await supabaseAdmin
      .from("automations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true);
    
    // 3. Failures last 24h
    const { count: failuresCount } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("send_status", "failed")
      .gte("created_at", twentyFourHoursAgo);

    // 4. Recent Activity
    let recent_activity: any[] = [];

    // Outgoing messages
    const { data: sentMsgs, error: sentError } = await supabaseAdmin
      .from("messages")
      .select("created_at, automations(name, trigger_source)")
      .eq("user_id", userId)
      .eq("direction", "outgoing")
      .eq("send_status", "sent")
      .not("automation_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(6);
    
    if (sentError) console.error("Error fetching sent messages for activity feed:", sentError);
    if (sentMsgs) {
      sentMsgs.forEach((msg: any) => {
        let label = "Direct Message Auto-Reply";
        if (msg.automations?.trigger_source === "comment") label = "Comment → Instant link DM";
        if (msg.automations?.trigger_source === "story") label = "Story Reply Auto-Responder";
        
        recent_activity.push({
          type: "sent",
          label: label,
          automation_name: msg.automations?.name || null,
          created_at: msg.created_at
        });
      });
    }

    // Failed messages
    const { data: failedMsgs, error: failedError } = await supabaseAdmin
      .from("messages")
      .select("created_at, error_detail, automations(name)")
      .eq("user_id", userId)
      .eq("send_status", "failed")
      .order("created_at", { ascending: false })
      .limit(6);
    
    if (failedError) console.error("Error fetching failed messages for activity feed:", failedError);
    if (failedMsgs) {
      failedMsgs.forEach((msg: any) => {
        recent_activity.push({
          type: "failed",
          label: msg.error_detail || "Delivery failed",
          automation_name: msg.automations?.name || null,
          created_at: msg.created_at
        });
      });
    }

    // Leads captured
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from("conversations")
      .select("email_captured_at")
      .eq("user_id", userId)
      .not("email_captured_at", "is", null)
      .order("email_captured_at", { ascending: false })
      .limit(6);

    if (leadsError) console.error("Error fetching leads for activity feed:", leadsError);
    if (leads) {
      leads.forEach((lead: any) => {
        recent_activity.push({
          type: "lead",
          label: "Lead captured via DM",
          automation_name: null,
          created_at: lead.email_captured_at
        });
      });
    }

    // Sort and limit
    recent_activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    recent_activity = recent_activity.slice(0, 6);

    return NextResponse.json({
      stats: {
        dms_sent_total,
        dms_sent_today,
        link_clicks_total,
        link_clicks_today,
        leads_total,
        leads_today,
      },
      active_automations_count: activeCount || 0,
      failures_last_24h: failuresCount || 0,
      recent_activity
    });
  } catch (error) {
    console.error("Home summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { resolveAuthedAccount } from "@/lib/session";

export async function GET(request: NextRequest) {
  const authed = await resolveAuthedAccount(request);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { accountId: userId } = authed;

  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "7d";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      deliveryTrend: [],
      funnel: { dmsSent: 0, linkClicks: 0, leads: 0 },
      topTriggers: []
    });
  }

  try {
    const supabaseAdmin = createAdminClient();

    const now = new Date();
    let startDate = new Date(0);
    if (range === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const startDateStr = startDate.toISOString();

    // 1. Delivery rate trend (daily grouping)
    let msgQuery = supabaseAdmin
      .from("messages")
      .select("id, send_status, created_at, automation_id")
      .eq("user_id", userId)
      .eq("direction", "outgoing");

    if (range !== "all") {
      msgQuery = msgQuery.gte("created_at", startDateStr);
    }
    const { data: messages } = await msgQuery;

    const dailyStats: Record<string, { sent: number; failed: number }> = {};
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    let totalDMsSent = 0;
    (messages || []).forEach((m) => {
      if (m.created_at) {
        const d = formatDate(m.created_at);
        if (!dailyStats[d]) dailyStats[d] = { sent: 0, failed: 0 };
        
        if (m.send_status === "sent") {
          dailyStats[d].sent += 1;
          totalDMsSent += 1;
        } else if (m.send_status === "failed") {
          dailyStats[d].failed += 1;
        }
      }
    });

    const deliveryTrend = Object.keys(dailyStats).map((day) => {
      const { sent, failed } = dailyStats[day];
      const total = sent + failed;
      const rate = total > 0 ? (sent / total) * 100 : 0;
      return { day, rate: Math.round(rate * 10) / 10 }; // rounded to 1 decimal
    });

    // Sort by date (we can just rely on the order if days are chronological, but let's parse and sort to be safe)
    deliveryTrend.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

    // 2. Funnel metrics
    let clicksQuery = supabaseAdmin
      .from("link_click_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    
    if (range !== "all") {
      clicksQuery = clicksQuery.gte("created_at", startDateStr);
    }
    const { count: totalClicks } = await clicksQuery;

    let leadsQuery = supabaseAdmin
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("follower_email", "is", null);
      
    if (range !== "all") {
      leadsQuery = leadsQuery.gte("email_captured_at", startDateStr);
    }
    const { count: totalLeads } = await leadsQuery;

    // 3. Best performing trigger types
    const { data: automations } = await supabaseAdmin
      .from("automations")
      .select("id, trigger_type")
      .eq("user_id", userId);

    const triggerStats: Record<string, { dms: number; clicks: number }> = {};
    (automations || []).forEach(a => {
      if (!triggerStats[a.trigger_type]) {
        triggerStats[a.trigger_type] = { dms: 0, clicks: 0 };
      }
    });

    // We already have messages, we just need to join link clicks properly or do it the simple way
    // For simplicity, fetch all clicks with automation_id
    let allClicksQuery = supabaseAdmin
      .from("link_click_events")
      .select(`link_clicks!inner(automation_id)`)
      .eq("user_id", userId);
    if (range !== "all") {
      allClicksQuery = allClicksQuery.gte("created_at", startDateStr);
    }
    const { data: allClicksData } = await allClicksQuery;

    (messages || []).forEach(m => {
      if (m.send_status === "sent" && m.automation_id) {
        const auto = automations?.find(a => a.id === m.automation_id);
        if (auto) {
          triggerStats[auto.trigger_type].dms += 1;
        }
      }
    });

    (allClicksData || []).forEach((c: any) => {
      const autoId = c.link_clicks?.automation_id;
      if (autoId) {
        const auto = automations?.find(a => a.id === autoId);
        if (auto) {
          triggerStats[auto.trigger_type].clicks += 1;
        }
      }
    });

    const topTriggers = Object.entries(triggerStats)
      .map(([type, stats]) => {
        const ctr = stats.dms > 0 ? (stats.clicks / stats.dms) * 100 : 0;
        return {
          type: type.charAt(0).toUpperCase() + type.slice(1),
          ctr: Math.round(ctr * 10) / 10
        };
      })
      .filter(t => t.ctr > 0 || Object.values(triggerStats).some(s => s.dms > 0)) // Keep if there's any data
      .sort((a, b) => b.ctr - a.ctr);

    return NextResponse.json({
      deliveryTrend,
      funnel: {
        dmsSent: totalDMsSent,
        linkClicks: totalClicks || 0,
        leads: totalLeads || 0
      },
      topTriggers
    });
  } catch (error) {
    console.error("Account performance error:", error);
    return NextResponse.json({
      deliveryTrend: [],
      funnel: { dmsSent: 0, linkClicks: 0, leads: 0 },
      topTriggers: []
    });
  }
}

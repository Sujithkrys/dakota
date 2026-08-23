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

  const emptyAnalytics = {
    range,
    metrics: { dmsSent: 0, linkClicks: 0, ctr: "0%", leadsCaptured: 0 },
    highlights: {
      bestAutomation: { name: "None", ctr: "0%", dms: 0, clicks: 0 },
      topDayForDms: { day: "N/A", dms: 0 },
      topDayForClicks: { day: "N/A", clicks: 0 },
    },
    performanceList: [],
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json(emptyAnalytics);
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

    let messagesQuery = supabaseAdmin
      .from("messages")
      .select("id, automation_id, created_at")
      .eq("user_id", userId)
      .eq("direction", "outgoing")
      .eq("send_status", "sent");
      
    if (range !== "all") {
      messagesQuery = messagesQuery.gte("created_at", startDateStr);
    }
    const { data: messages } = await messagesQuery;

    const { data: automationsList } = await supabaseAdmin
      .from("automations")
      .select("id, name, specific_media_id, created_at")
      .eq("user_id", userId);

    let clicksQuery = supabaseAdmin
      .from("link_click_events")
      .select(`id, created_at, link_clicks!inner(automation_id)`)
      .eq("user_id", userId);
      
    if (range !== "all") {
      clicksQuery = clicksQuery.gte("created_at", startDateStr);
    }
    const { data: clickEvents } = await clicksQuery;

    let leadsQuery = supabaseAdmin
      .from("conversations")
      .select("id, email_captured_at")
      .eq("user_id", userId)
      .not("email_captured_at", "is", null);

    if (range !== "all") {
      leadsQuery = leadsQuery.gte("email_captured_at", startDateStr);
    }
    const { data: leads } = await leadsQuery;

    const totalDMs = messages ? messages.length : 0;
    const totalClicks = clickEvents ? clickEvents.length : 0;
    const leadsCaptured = leads ? leads.length : 0;
    const overallCtr = totalDMs > 0 ? `${Math.round((totalClicks / totalDMs) * 100)}%` : "0%";

    let bestAutomationObj = { name: "None", ctr: "0%", dms: 0, clicks: 0 };
    let highestCtrVal = -1;

    const mappedPerformance = (automationsList || []).map((rule) => {
      const dms = (messages || []).filter((m) => m.automation_id === rule.id).length;
      const clicks = (clickEvents || []).filter((c: any) => c.link_clicks?.automation_id === rule.id).length;
      
      const ctrVal = dms > 0 ? (clicks / dms) * 100 : 0;
      const ctrString = `${Math.round(ctrVal)}%`;
      
      if (ctrVal > highestCtrVal && dms > 0) {
        highestCtrVal = ctrVal;
        bestAutomationObj = { name: rule.name, ctr: ctrString, dms, clicks };
      }
      
      return {
        id: rule.id,
        name: rule.name,
        links: "1 link",
        dmsSent: dms,
        ctr: ctrString,
      };
    });

    const dmsByDay: Record<string, number> = {};
    const clicksByDay: Record<string, number> = {};
    
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    
    (messages || []).forEach((m) => {
      if (m.created_at) {
        const d = formatDate(m.created_at);
        dmsByDay[d] = (dmsByDay[d] || 0) + 1;
      }
    });
    
    (clickEvents || []).forEach((c) => {
      if (c.created_at) {
        const d = formatDate(c.created_at);
        clicksByDay[d] = (clicksByDay[d] || 0) + 1;
      }
    });
    
    const getTopDay = (records: Record<string, number>) => {
      let topDay = "N/A";
      let maxVal = 0;
      for (const [day, count] of Object.entries(records)) {
        if (count > maxVal) {
          maxVal = count;
          topDay = day;
        }
      }
      return { day: topDay, count: maxVal };
    };

    const topDayDmsResult = getTopDay(dmsByDay);
    const topDayClicksResult = getTopDay(clicksByDay);

    if (highestCtrVal === -1) {
      if (mappedPerformance[0]) {
        bestAutomationObj = {
          name: mappedPerformance[0].name,
          ctr: mappedPerformance[0].ctr,
          dms: mappedPerformance[0].dmsSent,
          clicks: 0
        };
      }
    }

    return NextResponse.json({
      range,
      metrics: {
        dmsSent: totalDMs,
        linkClicks: totalClicks,
        ctr: overallCtr,
        leadsCaptured: leadsCaptured,
      },
      highlights: {
        bestAutomation: bestAutomationObj,
        topDayForDms: { day: topDayDmsResult.day, dms: topDayDmsResult.count },
        topDayForClicks: { day: topDayClicksResult.day, clicks: topDayClicksResult.count },
      },
      performanceList: mappedPerformance,
    });
  } catch (error) {
    return NextResponse.json(emptyAnalytics);
  }
}

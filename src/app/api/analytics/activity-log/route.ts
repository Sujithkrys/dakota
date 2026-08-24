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
  const eventType = searchParams.get("eventType") || "all"; // all, sent, failed, lead
  const automationId = searchParams.get("automationId") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ events: [], totalCount: 0 });
  }

  try {
    const supabaseAdmin = createAdminClient();

    const now = new Date();
    let startDateStr: string | null = null;
    if (range === "7d") {
      startDateStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (range === "30d") {
      startDateStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    let allEvents: any[] = [];

    // 1. Fetch Sent and Failed Messages
    if (eventType === "all" || eventType === "sent" || eventType === "failed") {
      let msgQuery = supabaseAdmin
        .from("messages")
        .select("id, send_status, error_detail, created_at, automations(id, name)")
        .eq("user_id", userId)
        .eq("direction", "outgoing");

      if (startDateStr) {
        msgQuery = msgQuery.gte("created_at", startDateStr);
      }
      if (eventType === "sent") {
        msgQuery = msgQuery.eq("send_status", "sent");
      } else if (eventType === "failed") {
        msgQuery = msgQuery.eq("send_status", "failed");
      }
      
      const { data: messages } = await msgQuery;
      
      if (messages) {
        for (const msg of messages) {
          const autoData = (msg as any).automations;
          const autoId = Array.isArray(autoData) ? autoData[0]?.id : autoData?.id;
          const autoName = (Array.isArray(autoData) ? autoData[0]?.name : autoData?.name) || "Unknown Automation";
          
          if (automationId !== "all" && autoId !== automationId) {
            continue;
          }

          if (msg.send_status === "sent") {
            allEvents.push({
              id: msg.id,
              type: "sent",
              description: `DM sent · ${autoName}`,
              created_at: msg.created_at,
            });
          } else if (msg.send_status === "failed") {
            allEvents.push({
              id: msg.id,
              type: "failed",
              description: `DM failed · ${msg.error_detail || "Delivery failed"}`,
              created_at: msg.created_at,
            });
          }
        }
      }
    }

    // 2. Fetch Leads (if applicable to the filter)
    if ((eventType === "all" || eventType === "lead") && automationId === "all") {
      let leadsQuery = supabaseAdmin
        .from("conversations")
        .select("id, follower_email, email_captured_at")
        .eq("user_id", userId)
        .not("follower_email", "is", null)
        .not("email_captured_at", "is", null);

      if (startDateStr) {
        leadsQuery = leadsQuery.gte("email_captured_at", startDateStr);
      }

      const { data: leads } = await leadsQuery;
      
      if (leads) {
        for (const lead of leads) {
          allEvents.push({
            id: lead.id,
            type: "lead",
            description: `Lead captured · ${lead.follower_email}`,
            created_at: lead.email_captured_at,
          });
        }
      }
    }

    // Sort descending
    allEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalCount = allEvents.length;
    
    // Paginate
    const startIndex = (page - 1) * pageSize;
    const paginatedEvents = allEvents.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      events: paginatedEvents,
      totalCount,
    });
  } catch (error) {
    console.error("Activity log error:", error);
    return NextResponse.json({ events: [], totalCount: 0 });
  }
}

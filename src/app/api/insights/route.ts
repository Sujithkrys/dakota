import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAuthedAccount } from "@/lib/session";

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function GET(request: NextRequest) {
  const authed = await resolveAuthedAccount(request);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { accountId: userId } = authed;

  try {
    const supabaseAdmin = createAdminClient();

    // 1. Fetch conversations for username mappings and fallback timestamps
    const { data: convs } = await supabaseAdmin
      .from("conversations")
      .select("follower_id, follower_username, updated_at")
      .eq("user_id", userId);

    // 2. Fetch outgoing messages joined with automations for exact counts
    const { data: messages } = await supabaseAdmin
      .from("messages")
      .select("recipient_id, created_at, automation_id, automations(trigger_source)")
      .eq("user_id", userId)
      .eq("direction", "outgoing");

    const followerStats: Record<string, {
      username: string;
      commentsCount: number;
      automations: Set<string>;
      lastActiveDt: Date;
    }> = {};

    // Process messages
    for (const msg of messages || []) {
      const followerId = msg.recipient_id;
      if (!followerStats[followerId]) {
        followerStats[followerId] = { username: followerId, commentsCount: 0, automations: new Set(), lastActiveDt: new Date(0) };
      }
      const stat = followerStats[followerId];
      
      const autoData = (msg as any).automations;
      const triggerSource = Array.isArray(autoData) ? autoData[0]?.trigger_source : autoData?.trigger_source;
      
      if (triggerSource === 'comment') {
        stat.commentsCount += 1;
      }
      
      if (msg.automation_id) {
        stat.automations.add(msg.automation_id);
      }
      
      const dt = new Date(msg.created_at);
      if (dt > stat.lastActiveDt) {
        stat.lastActiveDt = dt;
      }
    }

    // Process conversation mappings
    for (const c of convs || []) {
      if (followerStats[c.follower_id]) {
        followerStats[c.follower_id].username = c.follower_username || c.follower_id;
        const dt = new Date(c.updated_at);
        if (dt > followerStats[c.follower_id].lastActiveDt) {
          followerStats[c.follower_id].lastActiveDt = dt;
        }
      }
    }

    // Map to array and sort
    const rawLeaderboard = Object.values(followerStats)
      .map(stat => ({
        username: stat.username,
        commentsCount: stat.commentsCount,
        automationsTriggered: stat.automations.size,
        lastActive: formatRelativeTime(stat.lastActiveDt)
      }))
      // Only keep followers who actually triggered an automation to keep it relevant
      .filter(item => item.automationsTriggered > 0)
      .sort((a, b) => b.commentsCount - a.commentsCount || b.automationsTriggered - a.automationsTriggered);

    // Assign rank
    const leaderboard = rawLeaderboard.map((item, idx) => ({
      rank: idx + 1,
      ...item
    }));

    return NextResponse.json({
      totalComments: leaderboard.reduce((acc, item) => acc + item.commentsCount, 0),
      uniqueCommenters: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json({
      totalComments: 0,
      uniqueCommenters: 0,
      leaderboard: [],
    });
  }
}

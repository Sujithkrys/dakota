import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { fetchUserInstagramMedia } from "@/lib/instagram";
import { resolveAuthedAccount } from "@/lib/session";

export async function GET(request: NextRequest) {
  const authed = await resolveAuthedAccount(request);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { accountId: userId } = authed;

  if (userId === "17841400000000000") {
    // Return mock data for the demo account so the dashboard populates
    return NextResponse.json({
      media: [
        {
          id: "demo_media_1",
          caption: "Exciting new product launch! 🚀 #dmflow",
          media_type: "POST",
          thumbnail_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop",
          permalink: "https://instagram.com",
          like_count: 1205,
          comments_count: 84,
        },
        {
          id: "demo_media_2",
          caption: "Behind the scenes 📸",
          media_type: "REEL",
          thumbnail_url: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?q=80&w=600&auto=format&fit=crop",
          permalink: "https://instagram.com",
          like_count: 3420,
          comments_count: 215,
        },
        {
          id: "demo_media_3",
          caption: "Happy Friday! What are your weekend plans?",
          media_type: "POST",
          thumbnail_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop",
          permalink: "https://instagram.com",
          like_count: 890,
          comments_count: 42,
        },
      ]
    });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database configuration missing" }, { status: 500 });
  }

  try {
    const supabaseAdmin = createAdminClient();
    let accessToken = "";

    const { data } = await supabaseAdmin
      .from("users")
      .select("access_token")
      .eq("id", userId)
      .single();

    if (data?.access_token) {
      accessToken = data.access_token;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Couldn't load your posts: No connected Instagram access token found" },
        { status: 400 }
      );
    }

    const mediaItems = await fetchUserInstagramMedia(accessToken);

    const enrichedMedia = mediaItems.map((item: any, idx: number) => ({
      id: item.id,
      caption: item.caption || `Instagram Post #${idx + 1}`,
      media_type: item.media_type || "VIDEO",
      thumbnail_url: item.thumbnail_url || item.permalink,
      permalink: item.permalink,
      like_count: item.like_count || 0,
      comments_count: item.comments_count || 0,
    }));

    return NextResponse.json({ media: enrichedMedia });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Couldn't load your posts, check your Instagram connection";
    return NextResponse.json({ error: `Couldn't load your posts, check your Instagram connection: ${message}` }, { status: 500 });
  }
}

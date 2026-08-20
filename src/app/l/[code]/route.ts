import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const resolvedParams = await params;
  const { code } = resolvedParams;
  
  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const supabaseAdmin = createAdminClient();
    
    // Look up the code
    const { data } = await supabaseAdmin
      .from("link_clicks")
      .select("id, destination_url, click_count, user_id")
      .eq("tracking_code", code)
      .single();

    if (data) {
      // Increment clicks
      await supabaseAdmin
        .from("link_clicks")
        .update({ click_count: data.click_count + 1 })
        .eq("id", data.id);
        
      // Log event
      await supabaseAdmin
        .from("link_click_events")
        .insert({
          link_click_id: data.id,
          user_id: data.user_id,
        });
        
      return NextResponse.redirect(data.destination_url);
    }
  } catch (err) {
    console.warn("Link tracking error:", err);
  }

  // Fallback
  return NextResponse.redirect(new URL("/", request.url));
}

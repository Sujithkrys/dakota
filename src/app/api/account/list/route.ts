import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnerSession, getActiveAccountId } from "@/lib/session";

/**
 * GET /api/account/list
 * Returns all Instagram accounts belonging to the logged-in owner.
 */
export async function GET(request: NextRequest) {
  const ownerId = await getOwnerSession(request);
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized — no owner session" }, { status: 401 });
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, username, profile_pic, ig_account_id, created_at")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Failed to list accounts for owner:", error.message);
      return NextResponse.json({ accounts: [] });
    }

    const activeAccountId = await getActiveAccountId(request);

    return NextResponse.json({ accounts: data || [], activeAccountId });
  } catch {
    return NextResponse.json({ accounts: [] });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnerSession, getActiveAccountId, getSessionUser, DEMO_ACCOUNT_ID } from "@/lib/session";

/**
 * GET /api/account/list
 * Returns all Instagram accounts belonging to the logged-in owner,
 * or mock demo account for demo dashboard.
 */
export async function GET(request: NextRequest) {
  const activeAccountId = (await getActiveAccountId(request)) || (await getSessionUser(request));

  // Demo dashboard does not require owner session
  if (activeAccountId === DEMO_ACCOUNT_ID) {
    return NextResponse.json({
      accounts: [
        {
          id: DEMO_ACCOUNT_ID,
          username: "dmflow_official",
          profile_pic: null,
          ig_account_id: DEMO_ACCOUNT_ID,
        },
      ],
      activeAccountId: DEMO_ACCOUNT_ID,
    });
  }

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

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnerSession } from "@/lib/session";
import { signActiveAccountJWT } from "@/lib/session-crypto";

/**
 * POST /api/account/switch
 * Switches the active account for the logged-in owner.
 * Verifies ownership server-side before setting the cookie.
 */
export async function POST(request: NextRequest) {
  const ownerId = await getOwnerSession(request);
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized — no owner session" }, { status: 401 });
  }

  let body: { accountId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { accountId } = body;
  if (!accountId || typeof accountId !== "string") {
    return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
  }

  // Verify ownership: the account must belong to this owner
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, username")
      .eq("id", accountId)
      .eq("owner_id", ownerId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Account not found or does not belong to this owner" },
        { status: 403 }
      );
    }

    // Set the active account cookie
    const activeAccountToken = await signActiveAccountJWT({ accountId });
    const response = NextResponse.json({
      success: true,
      activeAccount: { id: data.id, username: data.username },
    });

    response.cookies.set("dmflow_active_account", activeAccountToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 24 * 60 * 60, // 60 days
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to switch account";
    console.error("Account switch error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

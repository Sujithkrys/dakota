import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAuthedAccount } from "@/lib/session";

export async function GET(request: NextRequest) {
  const authed = await resolveAuthedAccount(request);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { accountId: userId } = authed;

  const sessionCookie = request.cookies.get("dmflow_session")?.value;
  let sessionUser = null;
  if (sessionCookie) {
    const { verifySessionJWT } = await import("@/lib/session-crypto");
    sessionUser = await verifySessionJWT(sessionCookie);
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data } = await supabaseAdmin
      .from("users")
      .select("ai_api_key, ai_context, username, profile_pic")
      .eq("id", userId)
      .single();

    return NextResponse.json({
      ai_api_key: data?.ai_api_key || "",
      ai_context: data?.ai_context || "",
      username: data?.username || sessionUser?.username || "",
      profile_pic: data?.profile_pic || "",
    });
  } catch {
    return NextResponse.json({
      ai_api_key: "",
      ai_context: "",
      username: sessionUser?.username || "",
      profile_pic: "",
    });
  }
}

export async function POST(request: NextRequest) {
  const authed = await resolveAuthedAccount(request);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { accountId: userId } = authed;

  try {
    const body = await request.json();
    const { ai_api_key, ai_context } = body;

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from("users").upsert(
      {
        id: userId,
        ai_api_key,
        ai_context,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Supabase settings update warning:", error.message);
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

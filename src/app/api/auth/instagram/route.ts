import { NextRequest, NextResponse } from "next/server";
import { getInstagramAuthUrl } from "@/lib/instagram";
import {
  signSessionJWT,
  signOwnerSessionJWT,
  signActiveAccountJWT,
} from "@/lib/session-crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isDemo = searchParams.get("demo") === "true";
  const forceOAuth = searchParams.get("force_oauth") === "true";

  const appId = process.env.INSTAGRAM_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || "";
  const isPlaceholderApp = !appId || appId === "1234567890" || appId.includes("placeholder");

  // If demo requested or if Instagram App ID is a dummy placeholder (and force_oauth is not set)
  if (!forceOAuth && (isDemo || isPlaceholderApp)) {
    const baseUrl = request.nextUrl.origin;
    const response = NextResponse.redirect(`${baseUrl}/dashboard?demo_notice=true`);

    // Create or find a demo owner for demo mode
    let demoOwnerId = "demo-owner";
    try {
      const supabaseAdmin = createAdminClient();
      const { data: existingOwner } = await supabaseAdmin
        .from("owners")
        .select("id")
        .eq("display_name", "Demo Owner")
        .limit(1)
        .single();

      if (existingOwner) {
        demoOwnerId = existingOwner.id;
      } else {
        const { data: newOwner } = await supabaseAdmin
          .from("owners")
          .insert({ display_name: "Demo Owner" })
          .select("id")
          .single();
        if (newOwner) {
          demoOwnerId = newOwner.id;
        }
      }
    } catch {
      // Fallback — use a static ID for demo mode if DB isn't configured
    }

    // Sign session cookie
    const sessionToken = await signSessionJWT({
      id: "17841400000000000",
      username: "dmflow_official",
      profilePic: "",
    });

    response.cookies.set("dmflow_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 24 * 60 * 60, // 60 days
      path: "/",
    });

    // Sign owner cookie
    const ownerToken = await signOwnerSessionJWT({ ownerId: demoOwnerId });
    response.cookies.set("dmflow_owner", ownerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 24 * 60 * 60,
      path: "/",
    });

    // Sign active account cookie
    const accountToken = await signActiveAccountJWT({ accountId: "17841400000000000" });
    response.cookies.set("dmflow_active_account", accountToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  }

  const authUrl = getInstagramAuthUrl();
  return NextResponse.redirect(authUrl);
}

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

    // Sign session cookie for demo account
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

    // Sign active account cookie for demo account
    const accountToken = await signActiveAccountJWT({ accountId: "17841400000000000" });
    response.cookies.set("dmflow_active_account", accountToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 24 * 60 * 60,
      path: "/",
    });

    // Demo dashboard does not require owner login - clear any lingering owner cookie
    response.cookies.set("dmflow_owner", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  }

  const authUrl = getInstagramAuthUrl(request.nextUrl.origin);
  return NextResponse.redirect(authUrl);
}

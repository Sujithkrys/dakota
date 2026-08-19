import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  getInstagramUserProfile,
} from "@/lib/instagram";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  signSessionJWT,
  signOwnerSessionJWT,
  signActiveAccountJWT,
} from "@/lib/session-crypto";
import { verifyOwnerSessionJWT } from "@/lib/session-crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = request.nextUrl.origin;

  if (error || errorReason) {
    console.error("Instagram OAuth Error:", errorReason, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}/?auth_error=${encodeURIComponent(errorDescription || errorReason || "Authentication cancelled")}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent("Missing authorization code")}`);
  }

  try {
    // 1. Exchange OAuth code for short-lived token
    const shortLivedRes = await exchangeCodeForShortLivedToken(code);
    const shortLivedToken = shortLivedRes.access_token;

    // 2. Exchange short-lived token for long-lived 60-day token
    let accessToken = shortLivedToken;
    let expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const longLivedRes = await exchangeForLongLivedToken(shortLivedToken);
      accessToken = longLivedRes.access_token;
      if (longLivedRes.expires_in) {
        expiresAt = new Date(Date.now() + longLivedRes.expires_in * 1000).toISOString();
      }
    } catch (llError) {
      console.warn("Could not obtain long-lived token, falling back to short-lived token:", llError);
    }

    // 3. Call graph.instagram.com/v24.0/me?fields=user_id,username,profile_picture_url
    const userProfile = await getInstagramUserProfile(accessToken);
    const igAccountId = userProfile.user_id;
    const username = userProfile.username;
    const profilePic = userProfile.profile_picture_url || "";

    let ownerId: string | null = null;

    // 4. Upsert `users` table in Supabase
    // Table fields: id, username, access_token, token_expires_at, ig_account_id, profile_pic
    try {
      const supabaseAdmin = createAdminClient();

      // Check if an owner is logged in — if so, attach owner_id to the account
      const ownerCookie = request.cookies.get("dmflow_owner")?.value;
      if (ownerCookie) {
        const ownerPayload = await verifyOwnerSessionJWT(ownerCookie);
        if (ownerPayload) {
          ownerId = ownerPayload.ownerId;
        }
      }

      const upsertData: Record<string, unknown> = {
        id: igAccountId,
        username: username,
        access_token: accessToken,
        token_expires_at: expiresAt,
        ig_account_id: igAccountId,
        profile_pic: profilePic,
        updated_at: new Date().toISOString(),
      };

      if (ownerId) {
        upsertData.owner_id = ownerId;
      }

      const { error: dbError } = await supabaseAdmin.from("users").upsert(
        upsertData,
        { onConflict: "id" }
      );

      if (dbError) {
        console.error("Supabase user upsert error:", dbError.message);
        return NextResponse.redirect(
          `${baseUrl}/?auth_error=${encodeURIComponent(`Failed to save user account to database: ${dbError.message}`)}`
        );
      }
    } catch (dbEx: unknown) {
      const msg = dbEx instanceof Error ? dbEx.message : "Database connection failure";
      console.error("Database operation failed:", msg);
      return NextResponse.redirect(
        `${baseUrl}/?auth_error=${encodeURIComponent(`Database error during user save: ${msg}`)}`
      );
    }

    // 5. Set signed session cookie and redirect appropriately
    const redirectPath = ownerId ? "/dashboard" : "/login";
    const response = NextResponse.redirect(`${baseUrl}${redirectPath}`);

    const sessionToken = await signSessionJWT({
      id: igAccountId,
      username,
      profilePic,
    });

    response.cookies.set("dmflow_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 24 * 60 * 60, // 60 days
      path: "/",
    });

    // Also set the active account cookie to the newly-connected account
    const activeAccountToken = await signActiveAccountJWT({ accountId: igAccountId });
    response.cookies.set("dmflow_active_account", activeAccountToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OAuth callback process failed";
    console.error("Auth callback error:", message);

    const appId = process.env.INSTAGRAM_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || "";
    if (!appId || appId === "1234567890" || appId.includes("placeholder")) {
      const response = NextResponse.redirect(`${baseUrl}/dashboard?demo_notice=true`);

      const sessionToken = await signSessionJWT({
        id: "17841400000000000",
        username: "dmflow_official",
        profilePic: "",
      });

      response.cookies.set("dmflow_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }

    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(message)}`);
  }
}

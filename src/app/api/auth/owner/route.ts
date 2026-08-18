import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { signOwnerSessionJWT, signActiveAccountJWT } from "@/lib/session-crypto";

// In-memory rate limiting map: ip -> { count: number, resetTime: number }
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetTime) {
    return true; // Not rate limited
  }

  return record.count < MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
  } else {
    record.count += 1;
  }
}

function resetAttempts(ip: string) {
  loginAttempts.delete(ip);
}

/**
 * POST /api/auth/owner
 * Authenticates an owner via passphrase (env var OWNER_PASSPHRASE).
 * Features:
 * - Rate limiting / lockout: 5 failed attempts per 15 min per IP.
 * - Constant-time comparison to prevent timing attacks.
 * - Auto-backfill: Claims any orphaned `users` rows (owner_id IS NULL).
 * - Sets signed `dmflow_owner` cookie and sets active account if available.
 */
export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: "Too many failed login attempts. Please try again in 15 minutes." },
      { status: 429 }
    );
  }

  const passphrase = process.env.OWNER_PASSPHRASE;
  if (!passphrase || passphrase.trim().length === 0) {
    return NextResponse.json(
      { error: "Owner authentication is not configured (OWNER_PASSPHRASE env var is missing)" },
      { status: 500 }
    );
  }

  let body: { passphrase?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const suppliedPassphrase = body.passphrase;
  if (!suppliedPassphrase || typeof suppliedPassphrase !== "string") {
    return NextResponse.json({ error: "Missing passphrase" }, { status: 400 });
  }

  // Constant-time comparison to prevent timing attacks
  const expected = Buffer.from(passphrase);
  const supplied = Buffer.from(suppliedPassphrase);

  const isValid =
    expected.length === supplied.length &&
    crypto.timingSafeEqual(expected, supplied);

  if (!isValid) {
    recordFailedAttempt(clientIp);
    return NextResponse.json({ error: "Invalid passphrase" }, { status: 401 });
  }

  // Successful auth: reset rate limit attempts
  resetAttempts(clientIp);

  // Find or create the owner record
  try {
    const supabaseAdmin = createAdminClient();

    let ownerId: string;

    const { data: existingOwners } = await supabaseAdmin
      .from("owners")
      .select("id")
      .limit(1);

    if (existingOwners && existingOwners.length > 0) {
      ownerId = existingOwners[0].id;
    } else {
      const { data: newOwner, error: insertErr } = await supabaseAdmin
        .from("owners")
        .insert({ display_name: "Primary Owner" })
        .select("id")
        .single();

      if (insertErr || !newOwner) {
        console.error("Failed to create owner:", insertErr?.message);
        return NextResponse.json(
          { error: "Failed to create owner record" },
          { status: 500 }
        );
      }
      ownerId = newOwner.id;
    }

    // Auto-backfill: Claim any existing accounts that don't have an owner_id attached yet
    try {
      const { error: backfillErr } = await supabaseAdmin
        .from("users")
        .update({ owner_id: ownerId })
        .is("owner_id", null);

      if (backfillErr) {
        console.warn("Auto-backfill warning:", backfillErr.message);
      }
    } catch (backfillEx) {
      console.warn("Auto-backfill exception:", backfillEx);
    }

    // Fetch accounts belonging to this owner to set initial active account if available
    const { data: ownedAccounts } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("owner_id", ownerId)
      .limit(1);

    // Sign and set the owner cookie
    const ownerToken = await signOwnerSessionJWT({ ownerId });
    const response = NextResponse.json({ success: true, ownerId });

    response.cookies.set("dmflow_owner", ownerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 24 * 60 * 60, // 60 days
      path: "/",
    });

    if (ownedAccounts && ownedAccounts.length > 0) {
      const activeAccountToken = await signActiveAccountJWT({ accountId: ownedAccounts[0].id });
      response.cookies.set("dmflow_active_account", activeAccountToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Owner auth failed";
    console.error("Owner auth error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

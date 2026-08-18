import { NextRequest } from "next/server";
import {
  verifySessionJWT,
  verifyOwnerSessionJWT,
  verifyActiveAccountJWT,
} from "@/lib/session-crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SessionUser {
  id: string;
  username?: string;
  profilePic?: string;
}

/**
 * Reads and verifies the signed `dmflow_session` JWT cookie.
 * Returns the account's user ID, or null if the cookie is missing / invalid / expired.
 */
export async function getSessionUser(request: NextRequest): Promise<string | null> {
  try {
    const cookieValue = request.cookies.get("dmflow_session")?.value;
    if (!cookieValue) return null;

    const payload = await verifySessionJWT(cookieValue);
    if (payload && typeof payload.id === "string" && payload.id.trim().length > 0) {
      return payload.id;
    }
    return null;
  } catch (err) {
    console.warn("Failed to verify dmflow_session cookie:", err);
    return null;
  }
}

/**
 * Reads and verifies the signed `dmflow_owner` JWT cookie.
 * Returns the owner UUID, or null if the cookie is missing / invalid / expired.
 */
export async function getOwnerSession(request: NextRequest): Promise<string | null> {
  try {
    const cookieValue = request.cookies.get("dmflow_owner")?.value;
    if (!cookieValue) return null;

    const payload = await verifyOwnerSessionJWT(cookieValue);
    return payload?.ownerId ?? null;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the signed `dmflow_active_account` JWT cookie.
 * Returns the active account ID, or null if the cookie is missing / invalid / expired.
 */
export async function getActiveAccountId(request: NextRequest): Promise<string | null> {
  try {
    const cookieValue = request.cookies.get("dmflow_active_account")?.value;
    if (!cookieValue) return null;

    const payload = await verifyActiveAccountJWT(cookieValue);
    return payload?.accountId ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolves the fully-authenticated context for an API request.
 *
 * 1. Reads and verifies the owner session from `dmflow_owner`.
 * 2. Reads and verifies the active account from `dmflow_active_account`.
 * 3. **Verifies server-side** that the active account belongs to the owner
 *    (checks `users.owner_id = ownerId` in Supabase).
 *
 * Hard-cut: No legacy fallback. Strict owner authentication is required.
 * Returns `{ ownerId, accountId }` on success, or `null` on any failure.
 */
export async function resolveAuthedAccount(
  request: NextRequest
): Promise<{ ownerId: string; accountId: string } | null> {
  const ownerId = await getOwnerSession(request);
  if (!ownerId) {
    return null;
  }

  const accountId = await getActiveAccountId(request);
  if (!accountId) {
    return null;
  }

  // Verify ownership: the active account must belong to this owner
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", accountId)
      .eq("owner_id", ownerId)
      .single();

    if (error || !data) {
      console.warn(
        `Ownership check failed: account ${accountId} does not belong to owner ${ownerId}`
      );
      return null;
    }
  } catch (err) {
    console.warn("Ownership verification DB error:", err);
    return null;
  }

  return { ownerId, accountId };
}

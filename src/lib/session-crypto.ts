import { SignJWT, jwtVerify } from "jose";

// ---------------------------------------------------------------------------
// SESSION_SECRET — fail-fast if missing at first use (not at import time,
// since Next.js loads modules during build).
// ---------------------------------------------------------------------------

let _secretKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array {
  if (_secretKey) return _secretKey;
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.trim().length === 0) {
    throw new Error(
      "SESSION_SECRET environment variable is required but not set. " +
        "Generate one with: openssl rand -base64 32"
    );
  }
  _secretKey = new TextEncoder().encode(raw);
  return _secretKey;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionPayload {
  id: string;
  username: string;
  profilePic: string;
}

export interface OwnerSessionPayload {
  ownerId: string;
}

export interface ActiveAccountPayload {
  accountId: string;
}

// ---------------------------------------------------------------------------
// Per-account session JWT  (cookie: dmflow_session)
// ---------------------------------------------------------------------------

const SESSION_EXPIRY = "60d";

export async function signSessionJWT(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .setSubject("session")
    .sign(getSecretKey());
}

export async function verifySessionJWT(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      subject: "session",
    });
    if (
      typeof payload.id === "string" &&
      payload.id.trim().length > 0
    ) {
      return {
        id: payload.id as string,
        username: (payload.username as string) ?? "",
        profilePic: (payload.profilePic as string) ?? "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Owner session JWT  (cookie: dmflow_owner)
// ---------------------------------------------------------------------------

const OWNER_EXPIRY = "60d";

export async function signOwnerSessionJWT(
  payload: OwnerSessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(OWNER_EXPIRY)
    .setSubject("owner")
    .sign(getSecretKey());
}

export async function verifyOwnerSessionJWT(
  token: string
): Promise<OwnerSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      subject: "owner",
    });
    if (typeof payload.ownerId === "string" && payload.ownerId.trim().length > 0) {
      return { ownerId: payload.ownerId as string };
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Active account JWT  (cookie: dmflow_active_account)
// ---------------------------------------------------------------------------

const ACCOUNT_EXPIRY = "60d";

export async function signActiveAccountJWT(
  payload: ActiveAccountPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCOUNT_EXPIRY)
    .setSubject("active_account")
    .sign(getSecretKey());
}

export async function verifyActiveAccountJWT(
  token: string
): Promise<ActiveAccountPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      subject: "active_account",
    });
    if (
      typeof payload.accountId === "string" &&
      payload.accountId.trim().length > 0
    ) {
      return { accountId: payload.accountId as string };
    }
    return null;
  } catch {
    return null;
  }
}

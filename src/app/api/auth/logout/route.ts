import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: "dmflow_owner",
    value: "",
    maxAge: 0,
    path: "/",
  });
  response.cookies.set({
    name: "dmflow_active_account",
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
}

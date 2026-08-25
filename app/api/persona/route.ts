import { NextResponse } from "next/server";

import { DEMO_ROLE_COOKIE, normalizeDemoRole } from "../../../src/persona";

export async function POST(request: Request) {
  const body = (await request.json()) as { role?: unknown };
  if (body.role !== "field-tech" && body.role !== "fleet-engineer") {
    return Response.json({ error: "Unknown demo persona." }, { status: 400 });
  }

  const role = normalizeDemoRole(body.role);
  const response = NextResponse.json({ role });
  response.cookies.set(DEMO_ROLE_COOKIE, role, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
  });
  return response;
}

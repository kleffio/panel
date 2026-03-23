import { NextRequest, NextResponse } from "next/server";

const ADMIN_URL = process.env.ADMIN_URL!;

export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("consent_challenge");
  if (!challenge) {
    return NextResponse.json({ error: "missing consent_challenge" }, { status: 400 });
  }

  // Fetch the consent request to get requested scopes/audience
  const consentRes = await fetch(
    `${ADMIN_URL}/admin/oauth2/auth/requests/consent?consent_challenge=${challenge}`
  );
  if (!consentRes.ok) {
    return NextResponse.json({ error: "failed to fetch consent request" }, { status: 502 });
  }
  const consent = await consentRes.json();

  // Auto-accept with all requested scopes (first-party app — no user interaction needed)
  const acceptRes = await fetch(
    `${ADMIN_URL}/admin/oauth2/auth/requests/consent/accept?consent_challenge=${challenge}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_scope: consent.requested_scope,
        grant_access_token_audience: consent.requested_access_token_audience,
        remember: true,
        remember_for: 3600,
        session: {},
      }),
    }
  );
  if (!acceptRes.ok) {
    return NextResponse.json({ error: "failed to accept consent" }, { status: 502 });
  }
  const accepted = await acceptRes.json();

  return NextResponse.redirect(accepted.redirect_to);
}

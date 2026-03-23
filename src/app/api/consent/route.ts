import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const ADMIN_URL = process.env.ADMIN_URL!;

export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("consent_challenge");
  if (!challenge) {
    return NextResponse.json({ error: "missing consent_challenge" }, { status: 400 });
  }

  // Fetch the consent request to get requested scopes/audience
  const { data: consent } = await axios.get(
    `${ADMIN_URL}/admin/oauth2/auth/requests/consent`,
    { params: { consent_challenge: challenge } }
  );

  // Auto-accept with all requested scopes (first-party app — no user interaction needed)
  const { data: accepted } = await axios.put(
    `${ADMIN_URL}/admin/oauth2/auth/requests/consent/accept`,
    {
      grant_scope: consent.requested_scope,
      grant_access_token_audience: consent.requested_access_token_audience,
      remember: true,
      remember_for: 3600,
      session: {},
    },
    { params: { consent_challenge: challenge } }
  );

  return NextResponse.redirect(accepted.redirect_to);
}

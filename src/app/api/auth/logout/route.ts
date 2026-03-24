import { NextRequest, NextResponse } from "next/server";

const PUBLIC_URL = process.env.PUBLIC_URL!;

// Invalidates the Kratos session server-side so the browser cookie is cleared
// without redirecting the user through the Kratos logout UI flow.
export async function GET(req: NextRequest) {
  try {
    // Get the logout URL for this session from Kratos
    const initRes = await fetch(`${PUBLIC_URL}/self-service/logout/browser`, {
      headers: {
        cookie: req.headers.get("cookie") ?? "",
        origin: PUBLIC_URL,
      },
      redirect: "manual",
    });

    if (!initRes.ok) {
      return NextResponse.json({ error: "failed to initiate logout" }, { status: initRes.status });
    }

    const { logout_url } = await initRes.json();

    // Complete the logout server-side — Kratos invalidates the session.
    // We do not follow the redirect to the UI URL.
    await fetch(logout_url, { redirect: "manual" });

    // Clear the Kratos session cookie in the browser response
    const res = NextResponse.json({ success: true });
    const cookies = req.headers.get("cookie") ?? "";
    const kratosSession = cookies.match(/ory_kratos_session=[^;]+/)?.[0];
    if (kratosSession) {
      res.cookies.set("ory_kratos_session", "", { maxAge: 0, path: "/" });
    }

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

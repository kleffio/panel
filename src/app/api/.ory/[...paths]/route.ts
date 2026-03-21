import { NextRequest } from "next/server";

export async function GET(req: NextRequest) { return proxy(req); }
export async function POST(req: NextRequest) { return proxy(req); }
export async function PUT(req: NextRequest) { return proxy(req); }
export async function DELETE(req: NextRequest) { return proxy(req); }
export async function PATCH(req: NextRequest) { return proxy(req); }

async function proxy(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const targetPath = url.pathname.replace("/api/.ory", "");
    const targetUrl = new URL("https://auth.kleff.io" + targetPath + url.search);
    
    const headers = new Headers();
    const allowedHeaders = ['accept', 'accept-language', 'content-type', 'cookie', 'user-agent'];
    req.headers.forEach((value, key) => {
      if (allowedHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Spoof origin so Kratos believes the request is 100% internal and native
    headers.set("origin", "https://auth.kleff.io");
    headers.set("referer", "https://auth.kleff.io/");

    // Graceful body reading that fixes the 500 TypeError crashes in Next.js
    let bodyText = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      bodyText = await req.text();
      if (!bodyText) bodyText = undefined;
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: bodyText,
      redirect: "manual",
    });

    const responseHeaders = new Headers(response.headers);
    // Explicitly delete headers that crash Next.js Response constructors
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");

    // CRITICAL: Kratos sets cookies for `auth.kleff.io` or `.kleff.io`.
    // Chrome on `localhost:3000` will silently REJECT them.
    // We perfectly rewrite the Set-Cookie headers to drop the Domain lock!
    const setCookies = responseHeaders.getSetCookie();
    responseHeaders.delete("set-cookie");
    setCookies.forEach((cookieData) => {
      const localizedCookie = cookieData.replace(/Domain=[^;]+;?/gi, "");
      responseHeaders.append("set-cookie", localizedCookie);
    });

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
    
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

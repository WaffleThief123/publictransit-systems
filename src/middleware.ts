import { NextResponse, type NextRequest } from "next/server";

const UMAMI_URL = "https://beholder.slowest.network/api/send";
const UMAMI_WEBSITE_ID = "4ab2ac93-f051-47fd-a807-83a1e3cfee53";

export function middleware(request: NextRequest) {
  const { nextUrl, headers } = request;

  // Skip tracking for static assets and internal Next.js routes
  const ua = headers.get("user-agent") || "";
  const referrer = headers.get("referer") || "";
  const language = headers.get("accept-language")?.split(",")[0] || "";

  // Build screen resolution hint from client hints if available
  const screenWidth = headers.get("sec-ch-viewport-width") || "";
  const screenHeight = headers.get("sec-ch-viewport-height") || "";
  const screen = screenWidth && screenHeight ? `${screenWidth}x${screenHeight}` : "";

  // Fire and forget — don't block the response
  fetch(UMAMI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": ua,
      // Forward real client IP so Umami can do anonymous geo lookup
      ...(headers.get("x-forwarded-for") && {
        "X-Forwarded-For": headers.get("x-forwarded-for")!,
      }),
      ...(headers.get("cf-connecting-ip") && {
        "X-Forwarded-For": headers.get("cf-connecting-ip")!,
      }),
    },
    body: JSON.stringify({
      type: "event",
      payload: {
        website: UMAMI_WEBSITE_ID,
        url: nextUrl.pathname + (nextUrl.search || ""),
        referrer,
        hostname: "publictransit.systems",
        language,
        ...(screen && { screen }),
      },
    }),
  }).catch(() => {});

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Static asset extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf)$).*)",
  ],
};

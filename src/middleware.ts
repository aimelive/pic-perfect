import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function unauthorizedResponse(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area", charset="UTF-8"',
    },
  });
}

export function middleware(request: NextRequest) {
  const username = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  // Only enforce auth when credentials are configured
  if (!username || !password) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return unauthorizedResponse();
  }

  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return unauthorizedResponse();
  }

  try {
    const decoded = atob(encoded);
    const [user, pass] = decoded.split(":");
    if (user === username && pass === password) {
      return NextResponse.next();
    }
  } catch {
    // fall through to unauthorized
  }

  return unauthorizedResponse();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

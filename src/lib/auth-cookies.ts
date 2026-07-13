import type { NextRequest } from "next/server";

const STALE_AUTH_COOKIE_PREFIXES = [
  "authjs.session-token",
  "authjs.callback-url",
  "next-auth.session-token",
  "next-auth.callback-url",
  "__Secure-authjs.session-token",
  "__Secure-next-auth.session-token",
];

export function hasAuthSessionCookie(req: NextRequest): boolean {
  return req.cookies.getAll().some((cookie) =>
    STALE_AUTH_COOKIE_PREFIXES.some((prefix) => cookie.name.startsWith(prefix)),
  );
}

export function clearAuthSessionCookies(
  req: NextRequest,
  response: { cookies: { set: (name: string, value: string, options?: { maxAge?: number; path?: string }) => void } },
) {
  for (const cookie of req.cookies.getAll()) {
    const shouldClear = STALE_AUTH_COOKIE_PREFIXES.some((prefix) =>
      cookie.name.startsWith(prefix),
    );

    if (shouldClear) {
      response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
    }
  }
}

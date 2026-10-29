import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = await createSupabaseMiddlewareClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si no hay sesión y no está en login, redirigir a login
  if (!session && !request.nextUrl.pathname.startsWith("/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Si hay sesión y está en login, redirigir a dashboard
  if (session && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};

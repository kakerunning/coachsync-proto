import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const protectedPaths = ["/athlete", "/coach", "/settings"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const role = user.user_metadata?.role as string | undefined;

    // Role-based cross-access redirects
    if (pathname.startsWith("/coach") && role === "ATHLETE") {
      return NextResponse.redirect(new URL("/athlete", request.url));
    }
    if (pathname.startsWith("/athlete") && role === "COACH") {
      return NextResponse.redirect(new URL("/coach", request.url));
    }

    // Redirect logged-in users away from /login and /signup to their dashboard
    if (pathname === "/login" || pathname === "/signup") {
      const dest = role === "COACH" ? "/coach" : "/athlete";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

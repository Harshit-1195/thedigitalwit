import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthConfigured, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Keeps the Supabase session cookie fresh on page requests. Does nothing until
// credentials are configured. Pages never depend on this for access control;
// saved items are protected by row-level security in the database.
export async function proxy(request: NextRequest) {
  if (!isAuthConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/context|api/doohsight-market|api/ai-fill|icon.svg|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif)$).*)"],
};

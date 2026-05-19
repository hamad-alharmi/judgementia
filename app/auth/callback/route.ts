import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/lib/env/public";

export const dynamic = "force-dynamic";

function redirectUrl(request: Request, path: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}${path}`;
  }
  const origin = new URL(request.url).origin;
  return `${origin}${path}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(redirectUrl(request, "/?auth_error=missing_code"));
  }

  const supabase = createClient(
    getPublicSupabaseUrl(),
    getPublicSupabaseAnonKey(),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      redirectUrl(request, `/?auth_error=${encodeURIComponent(error.message)}`),
    );
  }

  return NextResponse.redirect(redirectUrl(request, `${next}?confirmed=1`));
}

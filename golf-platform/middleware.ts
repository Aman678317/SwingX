import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect /dashboard/* and /admin/* routes
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

  if ((isDashboard || isAdminRoute) && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // Check admin role for /admin/* routes
  if (isAdminRoute && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Phase 4: Enforce active subscription on /dashboard routes
  // (We'll add this check here but skip redirecting if going to /subscribe or /onboarding)
  if (isDashboard && session && !req.nextUrl.pathname.startsWith('/dashboard/subscribe')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', session.user.id)
      .single();
      
    if (profile?.subscription_status !== 'active') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/onboarding';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};

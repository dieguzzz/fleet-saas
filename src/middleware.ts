import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/invite'];

// Routes that require super_admin
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/invite/')
  );

  // If no user and route is protected, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // If user exists and trying to access login/signup, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    // Get user's first organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization:organizations(slug)')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const url = request.nextUrl.clone();
    if (membership?.organization) {
      const org = membership.organization as unknown as { slug: string };
      url.pathname = `/${org.slug}`;
    } else {
      url.pathname = '/onboarding';
    }
    return NextResponse.redirect(url);
  }

  // Check super admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Check organization routes
  const orgRouteMatch = pathname.match(/^\/([^\/]+)/);
  if (
    orgRouteMatch &&
    !isPublicRoute &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/onboarding') &&
    !pathname.startsWith('/unauthorized')
  ) {
    const orgSlug = orgRouteMatch[1];

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select(`
        role,
        organization:organizations!inner(id, slug)
      `)
      .eq('user_id', user!.id)
      .eq('organizations.slug', orgSlug)
      .single();

    if (!membership) {
      // Check if impersonating (super admin)
      const impersonatingOrg = request.cookies.get('impersonating_org')?.value;
      if (impersonatingOrg !== orgSlug) {
        // return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // Add org context to headers for downstream use
    if (membership) {
      const org = membership.organization as unknown as { id: string };
      supabaseResponse.headers.set('x-org-id', org.id);
      supabaseResponse.headers.set('x-org-role', membership.role);
      supabaseResponse.headers.set('x-org-slug', orgSlug);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

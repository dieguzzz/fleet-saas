import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/invite', '/forgot-password', '/reset-password', '/select-org', '/login-empresa'];

export async function middleware(request: NextRequest) {
  // Headers reenviados al request para que los Server Components los lean vía headers().
  // Se limpian los x-org-* entrantes para evitar spoofing desde el cliente.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-org-id');
  requestHeaders.delete('x-org-role');
  requestHeaders.delete('x-org-slug');
  requestHeaders.delete('x-org-type');

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

  // If user exists and trying to access login/signup/login-empresa, redirect to dashboard
  if (user && (pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/login-empresa')) {
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('organization:organizations(slug)')
      .eq('user_id', user.id);

    const url = request.nextUrl.clone();
    type MembershipOrg = { organization: { slug: string } | { slug: string }[] | null };
    const slugs = ((memberships ?? []) as MembershipOrg[]).flatMap((m) => {
      const org = Array.isArray(m.organization) ? m.organization[0] : m.organization;
      return org?.slug ? [org.slug] : [];
    }) as string[];

    if (slugs.length === 1) {
      url.pathname = `/${slugs[0]}`;
    } else if (slugs.length > 1) {
      url.pathname = '/select-org';
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
        organization:organizations!inner(id, slug, org_type)
      `)
      .eq('user_id', user!.id)
      .eq('organizations.slug', orgSlug)
      .single();

    if (!membership) {
      // Impersonation is only valid for super admins — verify before allowing access
      const impersonatingOrg = request.cookies.get('impersonating_org')?.value;
      if (impersonatingOrg === orgSlug) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_super_admin')
          .eq('id', user!.id)
          .single();
        if (!profile?.is_super_admin) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        // Set org context headers for impersonated session
        const impersonatingOrgId = request.cookies.get('impersonating_org_id')?.value;
        if (impersonatingOrgId) {
          const { data: impOrg } = await supabase
            .from('organizations')
            .select('id, slug, org_type')
            .eq('slug', orgSlug)
            .single();
          if (impOrg) {
            const orgType = (impOrg as { org_type?: string }).org_type || 'fleet';
            requestHeaders.set('x-org-id', impOrg.id);
            requestHeaders.set('x-org-role', 'owner');
            requestHeaders.set('x-org-slug', orgSlug);
            requestHeaders.set('x-org-type', orgType);

            const fleetOnlySegments = new Set(['vehicles', 'trips', 'maintenance', 'employees', 'fuel', 'terreno']);
            const kitchenOnlySegments = new Set(['products']);
            const secondSegment = pathname.split('/')[2];

            if (secondSegment && fleetOnlySegments.has(secondSegment) && orgType !== 'fleet') {
              return NextResponse.redirect(new URL(`/${orgSlug}`, request.url));
            }
            if (secondSegment && kitchenOnlySegments.has(secondSegment) && orgType !== 'kitchen') {
              return NextResponse.redirect(new URL(`/${orgSlug}`, request.url));
            }
          }
        }
      } else {
        // Super admin without impersonation cookie — auto-start impersonation
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_super_admin')
          .eq('id', user!.id)
          .single();
        if (profile?.is_super_admin) {
          // Allow access but without cookie — layout will handle setting up impersonation state
          const { data: directOrg } = await supabase
            .from('organizations')
            .select('id, slug, org_type')
            .eq('slug', orgSlug)
            .single();
          if (directOrg) {
            const orgType = (directOrg as { org_type?: string }).org_type || 'fleet';
            requestHeaders.set('x-org-id', directOrg.id);
            requestHeaders.set('x-org-role', 'owner');
            requestHeaders.set('x-org-slug', orgSlug);
            requestHeaders.set('x-org-type', orgType);
          } else {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
          }
        } else {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
    }

    // Add org context to headers for downstream use
    if (membership) {
      const org = membership.organization as unknown as { id: string; org_type?: string };
      const orgType = org.org_type || 'fleet';
      requestHeaders.set('x-org-id', org.id);
      requestHeaders.set('x-org-role', membership.role);
      requestHeaders.set('x-org-slug', orgSlug);
      requestHeaders.set('x-org-type', orgType);

      const fleetOnlySegments = new Set(['vehicles', 'trips', 'maintenance', 'employees', 'fuel', 'terreno']);
      const kitchenOnlySegments = new Set(['products']);
      const secondSegment = pathname.split('/')[2];

      if (secondSegment && fleetOnlySegments.has(secondSegment) && orgType !== 'fleet') {
        return NextResponse.redirect(new URL(`/${orgSlug}`, request.url));
      }
      if (secondSegment && kitchenOnlySegments.has(secondSegment) && orgType !== 'kitchen') {
        return NextResponse.redirect(new URL(`/${orgSlug}`, request.url));
      }
    }
  }

  // Reenviar los headers x-org-* al request para que los Server Components los lean,
  // preservando las cookies de sesión que Supabase pudo haber refrescado.
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mjs|js|css|map|woff|woff2|ttf|otf|ico|json|txt|xml|webmanifest)$).*)',
  ],
};

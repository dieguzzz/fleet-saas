import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_BUCKET_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Validar que la URL sea del bucket de Supabase del proyecto
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  if (ALLOWED_BUCKET_HOST && parsed.hostname !== ALLOWED_BUCKET_HOST) {
    return new NextResponse('URL not allowed', { status: 403 });
  }

  if (!parsed.pathname.includes('/storage/v1/object/public/invoice-attachments/')) {
    return new NextResponse('URL not allowed', { status: 403 });
  }

  try {
    const upstream = await fetch(url, { cache: 'no-store' });

    if (!upstream.ok) {
      return new NextResponse('Failed to fetch file', { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/pdf';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=3600',
        // Mismo origin → no hay X-Frame-Options que bloquee
      },
    });
  } catch {
    return new NextResponse('Error fetching file', { status: 500 });
  }
}

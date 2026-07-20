import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/services/supabase/server';

const BUCKET = 'invoice-attachments';

// Extrae el path dentro del bucket a partir de:
//  - un path directo: "<orgId>/invoices/<id>.pdf"
//  - una URL legacy pública/firmada: ".../object/(public|sign)/invoice-attachments/<path>"
function extractPath(input: string): string | null {
  if (!input.includes('://')) {
    return input.replace(/^\/+/, '');
  }
  try {
    const u = new URL(input);
    const marker = `/${BUCKET}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(u.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const raw = searchParams.get('path') ?? searchParams.get('url');

  if (!raw) {
    return new NextResponse('Missing path parameter', { status: 400 });
  }

  const path = extractPath(raw);
  // Anti path-traversal: sin '..', sin path absoluto, y con la forma <org>/...
  if (!path || path.includes('..') || path.startsWith('/') || !path.includes('/')) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  // Descarga con la sesión del usuario: la RLS org-scoped del bucket privado
  // garantiza que solo un miembro de la organización pueda leer el archivo.
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(path);

  if (error || !data) {
    return new NextResponse('No encontrado o sin autorización', { status: 404 });
  }

  const buffer = await data.arrayBuffer();
  const contentType = data.type || 'application/octet-stream';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

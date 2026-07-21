import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/services/supabase/server';

// Buckets privados servidos por este proxy autenticado (descarga con la sesión
// del usuario → la RLS org-scoped de cada bucket controla el acceso).
const ALLOWED_BUCKETS = new Set([
  'invoice-attachments',
  'trip-documents',
  'terrain-receipts',
]);

// Extrae el path dentro del bucket a partir de:
//  - un path directo: "<orgId>/.../archivo.ext"
//  - una URL legacy pública/firmada: ".../object/(public|sign)/<bucket>/<path>"
function extractPath(input: string, bucket: string): string | null {
  if (!input.includes('://')) {
    return input.replace(/^\/+/, '');
  }
  try {
    const u = new URL(input);
    const marker = `/${bucket}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(u.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bucket = searchParams.get('bucket') ?? 'invoice-attachments';
  const raw = searchParams.get('path') ?? searchParams.get('url');

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return new NextResponse('Bucket no permitido', { status: 400 });
  }
  if (!raw) {
    return new NextResponse('Missing path parameter', { status: 400 });
  }

  const path = extractPath(raw, bucket);
  // Anti path-traversal: sin '..', sin path absoluto, y con la forma <org>/...
  if (!path || path.includes('..') || path.startsWith('/') || !path.includes('/')) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  // Descarga con la sesión del usuario: la RLS org-scoped del bucket privado
  // garantiza que solo un miembro de la organización pueda leer el archivo.
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).download(path);

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

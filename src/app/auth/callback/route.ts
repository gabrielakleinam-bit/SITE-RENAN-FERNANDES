import { NextResponse, type NextRequest } from 'next/server';
import { clienteSessao } from '@/lib/supabase/servidor';

/* Volta do e-mail de confirmação, do Google e do link de nova senha. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';
  const destino = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  if (code) {
    const sb = await clienteSessao();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL('/entrar?erro=link', url.origin));
  }
  return NextResponse.redirect(new URL(destino, url.origin));
}

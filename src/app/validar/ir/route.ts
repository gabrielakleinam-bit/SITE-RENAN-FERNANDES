import { NextResponse } from 'next/server';

export function GET(req: Request) {
  const u = new URL(req.url);
  const c = (u.searchParams.get('c') || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return NextResponse.redirect(new URL(c ? `/validar/${c}` : '/validar', u.origin));
}

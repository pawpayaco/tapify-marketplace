import { NextResponse } from 'next/server';

export function middleware(req) {
  const url = new URL(req.url);
  if (url.pathname === '/t') {
    url.pathname = '/api/uid-redirect';
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/t'] };

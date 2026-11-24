import { NextRequest, NextResponse } from 'next/server';

function getUpstreamBase(): string {
  if (process.env.API_INTERNAL_URL) {
    return process.env.API_INTERNAL_URL.replace(/\/+$/, '');
  }
  if (process.env.API_HOSTPORT) {
    const hp = process.env.API_HOSTPORT.startsWith('http')
      ? process.env.API_HOSTPORT
      : `http://${process.env.API_HOSTPORT}`;
    return `${hp.replace(/\/+$/, '')}/api/v1`;
  }
  return 'http://127.0.0.1:4000/api/v1';
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;
  const search = request.nextUrl.search;
  const targetUrl = `${getUpstreamBase()}/${path.join('/')}${search}`;

  const forwardHeaders = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) forwardHeaders.set('content-type', contentType);
  const cookie = request.headers.get('cookie');
  if (cookie) forwardHeaders.set('cookie', cookie);
  const auth = request.headers.get('authorization');
  if (auth) forwardHeaders.set('authorization', auth);

  const method = request.method;
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();

  const upstreamRes = await fetch(targetUrl, {
    method,
    headers: forwardHeaders,
    body,
    redirect: 'manual',
  });

  const resHeaders = new Headers();
  const resCt = upstreamRes.headers.get('content-type');
  if (resCt) resHeaders.set('content-type', resCt);

  const setCookies =
    typeof upstreamRes.headers.getSetCookie === 'function'
      ? upstreamRes.headers.getSetCookie()
      : [];
  for (const c of setCookies) {
    resHeaders.append('set-cookie', c);
  }
  if (setCookies.length === 0) {
    const singleCookie = upstreamRes.headers.get('set-cookie');
    if (singleCookie) resHeaders.append('set-cookie', singleCookie);
  }

  const resBody = await upstreamRes.arrayBuffer();
  return new NextResponse(resBody, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx);
}

/**
 * Catch-all edge proxy Route Handler.
 *
 * Forwards client-side requests from /api/proxy/* to the Django backend
 * at BACKEND_URL, passing only Authorization, Content-Type, and Accept headers.
 *
 * Example:
 *   Client: GET /api/proxy/api/tickers/AAPL/detail
 *   Backend: GET https://cashtrend-core.onrender.com/api/tickers/AAPL/detail
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const FORWARDED_HEADERS = ['authorization', 'content-type', 'accept']

function buildBackendUrl(path: string[], search: string): string {
  const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'
  const joined = path.join('/')
  return search ? `${backendUrl}/${joined}${search}` : `${backendUrl}/${joined}`
}

function pickHeaders(incoming: Headers): HeadersInit {
  const out: Record<string, string> = {}
  for (const key of FORWARDED_HEADERS) {
    const value = incoming.get(key)
    if (value) out[key] = value
  }
  return out
}

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>
): Promise<NextResponse> {
  const { path } = await params
  const backendUrl = buildBackendUrl(path, request.nextUrl.search)
  const headers = pickHeaders(request.headers)

  let body: BodyInit | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.arrayBuffer()
  }

  let response: Response
  try {
    response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
    })
  } catch {
    return NextResponse.json({ detail: 'Backend unreachable' }, { status: 503 })
  }

  const responseBody = await response.arrayBuffer()
  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  })
}

export function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params)
}

export function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params)
}

export function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params)
}

export function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params)
}

export function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params)
}

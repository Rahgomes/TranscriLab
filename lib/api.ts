import { NextResponse } from 'next/server'

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function notFoundResponse(resource = 'Recurso') {
  return NextResponse.json({ error: `${resource} nao encontrado` }, { status: 404 })
}

export function dbUnavailableResponse() {
  return NextResponse.json(
    { error: 'Banco de dados nao configurado. Usando modo offline.' },
    { status: 503 }
  )
}

export function parseSearchParams(searchParams: URLSearchParams) {
  return {
    search: searchParams.get('search') || undefined,
    categoryId: searchParams.get('categoryId') || undefined,
    sortBy: (searchParams.get('sortBy') as 'date' | 'name' | 'size') || 'date',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    cursor: searchParams.get('cursor') || undefined,
    limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100),
  }
}

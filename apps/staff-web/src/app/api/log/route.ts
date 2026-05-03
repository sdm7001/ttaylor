/**
 * POST /api/log
 * Client-side error reporting endpoint.
 * Accepts structured log entries from the browser and writes them to the
 * server-side log file at /home/aiciv/logs/ttaylor/YYYY-MM-DD.log
 * so client errors survive alongside server errors in one place.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@ttaylor/shared'

const log = createLogger('client-error')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { level = 'error', msg, ...ctx } = body

    const entry = {
      ...ctx,
      source: 'client',
      userAgent: req.headers.get('user-agent') ?? undefined,
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
    }

    if (level === 'warn') log.warn(entry, msg)
    else log.error(entry, msg)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

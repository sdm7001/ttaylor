/**
 * POST /api/log
 * Client-side error reporting endpoint.
 * Accepts structured log entries from the browser and writes them to the
 * server-side log file at /home/aiciv/logs/ttaylor/YYYY-MM-DD.log
 * so client errors survive alongside server errors in one place.
 *
 * Security: requires Clerk authentication; body capped at 10 KB.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createLogger } from '@ttaylor/shared'

const log = createLogger('client-error')
const MAX_BODY_BYTES = 10 * 1024 // 10 KB

export async function POST(req: NextRequest) {
  // Require authentication — anonymous callers cannot write to the log
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Cap body size to prevent log flooding
  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 })
  }

  try {
    const body = await req.json()
    const { level = 'error', msg, ...ctx } = body

    const entry = {
      ...ctx,
      source: 'client',
      clerkUserId: userId,
    }

    if (level === 'warn') log.warn(entry, msg)
    else log.error(entry, msg)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

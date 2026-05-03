/**
 * Client-side logger for ttaylor staff-web.
 *
 * - In development: structured console.group output with full context
 * - In production: sends errors to /api/log for server-side persistence
 *   so broken client flows appear alongside server logs in one dated file
 *
 * Usage:
 *   import { clientLogger } from '@/lib/client-logger'
 *   clientLogger.error({ userId, page: 'documents' }, 'Failed to load document list')
 *   clientLogger.warn({ documentId }, 'Document upload taking longer than expected')
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogCtx {
  userId?: string
  page?: string
  action?: string
  [key: string]: unknown
}

const IS_DEV = process.env.NODE_ENV === 'development'

function send(level: LogLevel, ctx: LogCtx, msg: string): void {
  const entry = {
    time: new Date().toISOString(),
    level,
    msg,
    url: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...ctx,
  }

  if (IS_DEV) {
    const style = level === 'error' ? 'color:red;font-weight:bold'
      : level === 'warn'  ? 'color:orange'
      : 'color:gray'
    console.groupCollapsed(`%c[${level.toUpperCase()}] ${msg}`, style)
    console.log(entry)
    console.groupEnd()
    return
  }

  // Production: fire-and-forget to server log endpoint
  if (level === 'warn' || level === 'error') {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      keepalive: true, // survives page unload
    }).catch(() => {}) // never throws — logging must never break the app
  }
}

export const clientLogger = {
  debug: (ctx: LogCtx | string, msg?: string) =>
    typeof ctx === 'string' ? send('debug', {}, ctx) : send('debug', ctx, msg ?? ''),
  info:  (ctx: LogCtx | string, msg?: string) =>
    typeof ctx === 'string' ? send('info', {}, ctx)  : send('info',  ctx, msg ?? ''),
  warn:  (ctx: LogCtx | string, msg?: string) =>
    typeof ctx === 'string' ? send('warn', {}, ctx)  : send('warn',  ctx, msg ?? ''),
  error: (ctx: LogCtx | string, msg?: string) =>
    typeof ctx === 'string' ? send('error', {}, ctx) : send('error', ctx, msg ?? ''),
}

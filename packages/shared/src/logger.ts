/**
 * @ttaylor/shared — Structured logger
 *
 * Writes JSON log lines to /home/aiciv/logs/ttaylor/YYYY-MM-DD.log
 * AND to stdout. Each line is a self-contained JSON object for easy grep/jq.
 *
 * Usage:
 *   import { createLogger } from '@ttaylor/shared'
 *   const log = createLogger('documents-service')
 *   log.info({ userId, documentId }, 'Document signed')
 *   log.error({ err, requestId }, 'Failed to process workflow')
 */

import { appendFileSync, mkdirSync } from 'fs'
import { join } from 'path'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  time: string
  level: LogLevel
  service: string
  msg: string
  requestId?: string
  userId?: string
  [key: string]: unknown
}

const LOG_DIR = process.env.LOG_DIR ?? '/home/aiciv/logs/ttaylor'
const LOG_LEVEL = (process.env.LOG_LEVEL ?? 'info') as LogLevel
const IS_DEV = process.env.NODE_ENV !== 'production'

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

try { mkdirSync(LOG_DIR, { recursive: true }) } catch {}

function getLogFile(): string {
  return join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.log`)
}

function write(entry: LogEntry): void {
  const line = JSON.stringify(entry) + '\n'

  // Write to file (survives process restart — this is the audit trail)
  try { appendFileSync(getLogFile(), line) } catch {}

  // Also write to stdout
  if (IS_DEV) {
    const prefix = entry.level === 'error' ? '🔴' : entry.level === 'warn' ? '🟡' : '🟢'
    const ctx = Object.fromEntries(
      Object.entries(entry).filter(([k]) => !['time', 'level', 'service', 'msg'].includes(k))
    )
    console.log(
      `${prefix} [${entry.time}] [${entry.service}] ${entry.msg}`,
      Object.keys(ctx).length ? ctx : ''
    )
  } else {
    process.stdout.write(line)
  }
}

export function createLogger(service: string) {
  const minRank = LEVEL_RANK[LOG_LEVEL]

  const log = (level: LogLevel, ctx: Record<string, unknown> | string, msg?: string) => {
    if (LEVEL_RANK[level] < minRank) return

    const entry: LogEntry =
      typeof ctx === 'string'
        ? { time: new Date().toISOString(), level, service, msg: ctx }
        : { time: new Date().toISOString(), level, service, msg: msg ?? '', ...ctx }

    write(entry)
  }

  return {
    debug: (ctx: Record<string, unknown> | string, msg?: string) => log('debug', ctx, msg),
    info:  (ctx: Record<string, unknown> | string, msg?: string) => log('info',  ctx, msg),
    warn:  (ctx: Record<string, unknown> | string, msg?: string) => log('warn',  ctx, msg),
    error: (ctx: Record<string, unknown> | string, msg?: string) => log('error', ctx, msg),
    /** Returns a child logger with a bound requestId for tracing a single request */
    child: (bindings: Record<string, unknown>) => createLogger(service)._withBindings({ ...bindings }),
    _withBindings: (bindings: Record<string, unknown>) => ({
      debug: (ctx: Record<string, unknown> | string, msg?: string) =>
        log('debug', typeof ctx === 'string' ? { ...bindings, msg: ctx } : { ...bindings, ...ctx }, msg),
      info:  (ctx: Record<string, unknown> | string, msg?: string) =>
        log('info',  typeof ctx === 'string' ? { ...bindings, msg: ctx } : { ...bindings, ...ctx }, msg),
      warn:  (ctx: Record<string, unknown> | string, msg?: string) =>
        log('warn',  typeof ctx === 'string' ? { ...bindings, msg: ctx } : { ...bindings, ...ctx }, msg),
      error: (ctx: Record<string, unknown> | string, msg?: string) =>
        log('error', typeof ctx === 'string' ? { ...bindings, msg: ctx } : { ...bindings, ...ctx }, msg),
    }),
  }
}

export type AppLogger = ReturnType<typeof createLogger>

'use client'
/**
 * ErrorBoundary — catches React render errors and logs them server-side.
 * Wrap any section of the app where you want crash protection + logging.
 *
 * Usage:
 *   <ErrorBoundary section="documents-list">
 *     <DocumentsList />
 *   </ErrorBoundary>
 */
import React from 'react'
import { clientLogger } from '@/lib/client-logger'

interface Props {
  children: React.ReactNode
  section?: string
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  errorId: string | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorId: null }
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true, errorId: crypto.randomUUID() }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const errorId = this.state.errorId ?? crypto.randomUUID()
    clientLogger.error(
      {
        errorId,
        section: this.props.section ?? 'unknown',
        errorName: error.name,
        errorMessage: error.message,
        componentStack: info.componentStack?.slice(0, 500),
      },
      `React render error in "${this.props.section ?? 'unknown'}"`
    )
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Something went wrong.</p>
          {this.state.errorId && (
            <p className="mt-1 font-mono text-xs text-red-400">
              Error ID: {this.state.errorId}
            </p>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

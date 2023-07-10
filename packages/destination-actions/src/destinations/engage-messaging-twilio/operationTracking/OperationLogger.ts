/* eslint-disable @typescript-eslint/no-explicit-any */
import { OperationTrackHooks } from './OperationTrackHooks'
import { TrackedError } from './TrackedError'
import { OperationContext } from './OperationContext'
import { getOperationsStack } from './getOperationsStack'

declare module './OperationContext' {
  interface OperationContext {
    /**
     * log messages collected during the operation that will be logged at the end of the operation
     */
    logs: string[]
  }
}

declare module './OperationTracker' {
  interface TrackArgs {
    /**
     * should the method execution be logged at current ctx.state (try/finally)?
     * False by default and true for Finally state
     */
    shouldLog?: (ctx: OperationContext) => boolean | void
  }
}

export abstract class OperationLogger implements OperationTrackHooks {
  abstract logInfo(msg: string, metadata?: object): void

  abstract logError(msg: string, metadata?: object): void

  beforeOperationTry(ctx: OperationContext) {
    ctx.logs = []
  }

  afterOperationTry(ctx: OperationContext) {
    const shouldLog = ctx.trackArgs?.shouldLog ? ctx.trackArgs?.shouldLog(ctx) : this.shouldLogDefault(ctx)
    if (shouldLog !== false) {
      const fullLogMessage = this.extractLogMessages(ctx)?.join('. ')
      this.logInfo(fullLogMessage)
    }
  }

  /**
   * Defines if logging should happen for operation state by default when it's not explicitly specified in TrackArgs.
   * By default implementation it returns true (log on each state of the operation)
   * @param _ctx operation context
   * @returns
   */
  shouldLogDefault(_ctx: OperationContext): boolean {
    return true
  }
  /**
   * Extracts all log messages for the operation log message on operation states (try|finally only)
   * @param ctx operation context
   * @returns list of log messages (will be concatenated with '. ' in the result log message)
   */
  extractLogMessages(ctx: OperationContext): string[] {
    const res: string[] = []
    switch (ctx.state) {
      case 'try':
        res.push(this.getOperationTryMessage(ctx))
        break
      case 'finally':
        res.push(this.getOperationCompletedMessage(ctx))
        if (ctx.error) {
          const error = ctx.error as TrackedError
          res.push(...(this.getOperationErrorDetails(error, ctx) || []))
        }
        break
      default:
        break
    }
    return res
  }

  /**
   * Gets the log message of the operation attempt
   * @param ctx operation
   * @returns
   */
  getOperationTryMessage(ctx: OperationContext): string {
    const fullOperationName = getOperationsStack(ctx)
      .map((op) => op.operation)
      .join(' > ')
    return `${fullOperationName} starting...`
  }

  /**
   * Gets the first part of the operation's completion log message.
   * Should describe the name/path of operation, duration and whether it succeeded or failed.
   * It should not contain the details of failure, as it's covered by extractLogMessagesFromError
   * @param ctx operation context
   * @returns
   */
  getOperationCompletedMessage(ctx: OperationContext): string {
    const hasError = !!ctx.error
    const fullOperationName = getOperationsStack(ctx)
      .map((op) => op.operation)
      .join(' > ')
    return `${fullOperationName} ${hasError ? 'failed' : 'succeeded'} after ${ctx.duration} ms`
  }

  /**
   * Called by extractLogMessages to extract log messages from the error as well as its Underlying Error
   * The error may have happened on the child operation (in this case error.trackedContext != ctx)
   * @param error error to get log messages from
   * @param ctx current operation context (may be different from the error.trackedContext)
   * @returns list of log messages (will be concatenated with '. ' in the result log message)
   */
  getOperationErrorDetails(error: TrackedError, ctx: OperationContext): string[] {
    const errorContext = error.trackedContext
    const logMessages: string[] = []
    logMessages.push(this.getErrorMessage(error, ctx))
    if (errorContext == ctx && error.underlyingError) {
      logMessages.push(`Underlying error: ${this.getErrorMessage(error.underlyingError, ctx)}`)
    }
    return logMessages
  }

  /**
   * Error parsing function. Override to customize error message for different error types
   * @param error error to get message from
   * @param _ctx current operation context
   * @returns
   */
  getErrorMessage(error: unknown, _ctx?: OperationContext): string {
    if (error instanceof Error) {
      const trError = error as TrackedError
      const errorClass = trError?.constructor?.name
      return `${errorClass || '[undefined]'}: ${trError.message}`
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return (error as any)?.toString?.() || 'unknown error'
  }

  beforeOperationFinally(ctx: OperationContext): void {
    ctx.logs.push(...(this.extractLogMessages(ctx) || []))
  }

  afterOperationFinally(ctx: OperationContext) {
    const shouldLog = ctx.trackArgs?.shouldLog ? ctx.trackArgs?.shouldLog(ctx) : this.shouldLogDefault(ctx)
    if (shouldLog !== false) {
      const fullLogMessage = (ctx.logs?.filter((t) => t) || []).join('. ')
      if (ctx.error) this.logError(fullLogMessage, ctx.error)
      else this.logInfo(fullLogMessage)
    }
  }
}

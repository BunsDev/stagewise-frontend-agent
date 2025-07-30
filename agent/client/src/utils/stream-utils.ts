import type { AgentServer } from '@stagewise/agent-interface/agent';
import { AgentStateType } from '@stagewise/agent-interface/agent';
import { ErrorDescriptions, formatErrorDescription } from './error-utils.js';

/**
 * Creates a timeout promise that rejects after the specified duration
 */
export function createTimeoutPromise(
  timeout: number,
  errorMessage?: string,
): Promise<never> {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage || `Timeout after ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Consumes the agent stream and updates the UI with text deltas
 */
export async function consumeAgentStream(
  fullStream: AsyncIterable<{ type: string; textDelta?: string }>,
  server: AgentServer,
  onError?: (error: unknown) => void,
): Promise<void> {
  try {
    for await (const chunk of fullStream) {
      if (chunk.type === 'text-delta' && chunk.textDelta) {
        server.interface.messaging.updatePart(
          {
            type: 'text',
            text: chunk.textDelta,
          },
          0,
          'append',
        );
      }
    }
  } catch (streamError) {
    console.error('[Agent]: Error consuming stream:', streamError);
    if (onError) {
      onError(streamError);
    }
    throw streamError;
  }
}

/**
 * Races a promise against a timeout, returning whichever resolves first
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  timeoutMessage?: string,
): Promise<T> {
  return Promise.race([promise, createTimeoutPromise(timeout, timeoutMessage)]);
}

/**
 * Manages timeout cleanup with proper cancellation
 */
export class TimeoutManager {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Sets a timeout with a specific key
   */
  set(key: string, callback: () => void, duration: number): void {
    // Clear existing timeout if any
    this.clear(key);

    const timeout = setTimeout(callback, duration);
    this.timeouts.set(key, timeout);
  }

  /**
   * Clears a specific timeout
   */
  clear(key: string): void {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  /**
   * Clears all timeouts
   */
  clearAll(): void {
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
  }

  /**
   * Checks if a timeout exists
   */
  has(key: string): boolean {
    return this.timeouts.has(key);
  }
}

/**
 * Consumes stream with timeout protection
 */
export async function consumeStreamWithTimeout(
  fullStream: AsyncIterable<{ type: string; textDelta?: string }>,
  server: AgentServer,
  timeout: number,
  setAgentState: (state: AgentStateType, description?: string) => void,
): Promise<void> {
  const streamPromise = consumeAgentStream(fullStream, server, (error) => {
    const errorDesc = formatErrorDescription('Stream processing error', error, {
      operation: 'consumeAgentStream',
    });
    setAgentState(AgentStateType.FAILED, errorDesc);
  });

  try {
    await withTimeout(
      streamPromise,
      timeout,
      `Stream timeout after ${timeout}ms`,
    );
  } catch (error) {
    const errorDesc = ErrorDescriptions.streamTimeout(
      timeout,
      'consumeStreamWithTimeout',
    );
    console.error('[Agent]:', errorDesc);
    setAgentState(AgentStateType.FAILED, errorDesc);
    throw error;
  }
}

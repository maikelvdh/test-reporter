import * as core from '@actions/core'

const sleep = async (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
const retryDelays = [1000, 2000, 4000, 8000]

/**
 * Retries `fn` while it fails with HTTP 404.
 * Only meant for calls on a resource this run just created, where a 404 means GitHub has not caught up yet (#866).
 * Any other error, or a 404 after the last delay, is rethrown.
 */
export async function retryOnNotFound<T>(
  fn: () => Promise<T>,
  wait: (ms: number) => Promise<void> = sleep
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if ((error as {status?: number}).status !== 404 || attempt >= retryDelays.length) {
        throw error
      }
      core.info(
        `Got 404, retrying in ${retryDelays[attempt] / 1000}s (attempt ${attempt + 1} of ${retryDelays.length})`
      )
      await wait(retryDelays[attempt])
    }
  }
}

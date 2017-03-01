import { createHash } from 'crypto'

/**
 * Calculate the sha256 digest of a string. On Node.js, this will use the native module, in the browser, it will fall back to a pure javascript implementation.
 *
 * ### Example (es imports)
 * ```js
 * import { sha256 } from 'typescript-starter'
 * sha256('test')
 * // => '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
 * ```
 *
 * @returns sha256 message digest
 */
export function sha256 (message: string) {
  return createHash('sha256').update(message).digest('hex')
}

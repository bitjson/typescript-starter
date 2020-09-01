import { createHash } from 'crypto';

import { binToHex, instantiateSha256, utf8ToBin } from '@bitauth/libauth';

/**
 * Calculate the sha256 digest of a string.
 *
 * ### Example (es imports)
 * ```js
 * import { sha256 } from 'typescript-starter'
 *
 * (async () => {
 *   console.log(await sha256('test'));
 *   // => '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
 * });
 * ```
 *
 * @param message - the string to hash
 * @returns sha256 message digest
 */
export const sha256 = async (message: string) => {
  const sha256 = await instantiateSha256();
  return binToHex(sha256.hash(utf8ToBin(message)));
};

/**
 * A synchronous implementation of `sha256` which uses the native Node.js
 * module. (Browser consumers should use the `sha256` method.)
 *
 * ### Example (es imports)
 * ```js
 * import { sha256Native as sha256 } from 'typescript-starter'
 * console.log(sha256('test'));
 * // => '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
 * ```
 * @param message - the string to hash
 * @returns sha256 message digest
 */
export const sha256Native = (message: string) => {
  return createHash('sha256').update(message).digest('hex');
};

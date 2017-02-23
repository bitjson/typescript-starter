// Must first be built by browserify.
// https://github.com/rollup/rollup-plugin-commonjs/issues/105#issuecomment-281917166
import hash from 'hash.js'

export function createHash (algorithm: 'sha256') {
  console.log(hash)
  return hash.sha256()
}

/**
 * A sample async function (to demo Typescript's es7 async/await downleveling).
 *
 * ### Example (es imports)
 * ```js
 * import { asyncABC } from 'typescript-starter'
 * console.log(await asyncABC())
 * // => ['a','b','c']
 * ```
 *
 * ### Example (commonjs)
 * ```js
 * var double = require('typescript-starter').asyncABC;
 * asyncABC().then(console.log);
 * // => ['a','b','c']
 * ```
 *
 * @returns       a Promise which should contain `['a','b','c']`
 */
export async function asyncABC () {
  function somethingSlow (index: 0 | 1 | 2) {
    let storage = 'abc'.charAt(index)
    return new Promise<string>(resolve => {
      // here we pretend to wait on the network
      setTimeout(() => resolve(storage), 0)
    })
  }
  let a = await somethingSlow(0)
  let b = await somethingSlow(1)
  let c = await somethingSlow(2)
  return [a, b, c]
}

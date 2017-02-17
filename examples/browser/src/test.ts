// Note: we're not using the double method, so it should be excluded from the bundle
import { power, asyncABC } from 'typescript-starter'

let output = ''

function log (str: string) {
  console.log(str)
  output += str + '\n'
}

function logAndAlert (data: string[]) {
  log('✔ asyncABC returned: ' + data)
  window.alert(output)
}

log('Output:')

if (power(3,4) === 81) {
  log('✔ power(3,4) === 81')
} else {
  log('The "power" method seems to be broken.')
}

asyncABC().then( abc => logAndAlert(abc) )

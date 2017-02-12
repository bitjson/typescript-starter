// Note: we're not using the double method, so it should be excluded from the bundle
import { power, asyncABC } from '../../../'

if (power(3,4) === 81) {
  console.log('✔ power(3,4) === 81')
} else {
  console.error('The "power" method seems to be broken.')
}

asyncABC().then( abc => console.log('✔ asyncABC returned:', abc) )

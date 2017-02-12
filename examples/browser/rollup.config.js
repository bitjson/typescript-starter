// rollup.config.js
import typescript from 'rollup-plugin-typescript';
import nodeResolve from 'rollup-plugin-node-resolve';

const pkg = require('./package');

export default {
  entry: 'src/test.ts',
    moduleId: pkg.name,
    moduleName: 'BrowserTest',
  //   entry: 'dist/es/index.js',
    dest: 'build/test.js',
    format: 'iife',
    sourceMap: true,
  plugins: [
    typescript({
      typescript: require('typescript') // use local version
    }),
    nodeResolve({
      module: true,
      jsnext: true,
      browser: true,
      extensions: [ '.js', '.json' ],
      preferBuiltins: false
    })
  ]
}

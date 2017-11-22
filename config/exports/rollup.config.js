// rollup.config.js
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import alias from 'rollup-plugin-alias';
import json from 'rollup-plugin-json';

const substituteModulePaths = {
    'crypto': 'build/module/adapters/crypto.browser.js',
    'hash.js': 'build/temp/hash.js'
}

export default {
    entry: 'build/module/index.js',
    sourceMap: true,
    plugins: [
        alias(substituteModulePaths),
        nodeResolve({
            browser: true
        }),
        commonjs(),
        json()
    ]
}

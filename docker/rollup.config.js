// Import rollup plugins
import html from '@web/rollup-plugin-html';
import {copy} from '@web/rollup-plugin-copy';
import resolve from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import summary from 'rollup-plugin-summary';
import postcss from 'rollup-plugin-postcss'
import postcssImport from 'postcss-import';

export default {
  plugins: [
    // Resolve bare module specifiers to relative paths
    resolve(),
    postcss({
      // module: false,
      // extract: true,
      // inject: true,
      plugins: [postcssImport()],
    }),
    // Entry point for application build; can specify a glob to build multiple
    // HTML files for non-SPA app
    html({
      input: 'src/*.html',
    }),
    // Minify HTML template literals
    minifyHTML(),
    // Minify JS
    terser({
      ecma: 2020,
      module: true,
      warnings: true,
    }),
    // Print bundle summary
    summary(),
    // Optional: copy any static assets to build directory
    copy({
      patterns: ['images/**/*'],
    }),
  ],
  output: {
    dir: 'dist',
  },
  preserveEntrySignatures: 'strict',
};
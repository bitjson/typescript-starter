#!/usr/bin/env node
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/**
 * This file needs the 'x' permission to be spawned by tests. Since TypeScript
 * doesn't currently offer a way to set permissions of generated files
 * (https://github.com/Microsoft/TypeScript/issues/16667), we track this file
 * with Git, and simply require the generated CLI.
 */
import(path.resolve(__dirname, '../build/main/cli/cli.js'));

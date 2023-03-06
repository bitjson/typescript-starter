import meow from 'meow';
import UpdateNotifier, { Package } from 'update-notifier';

import { Runner, TypescriptStarterArgsOptions, validateName } from './utils.js';

export async function checkArgs(): Promise<TypescriptStarterArgsOptions> {
  const cli = meow(
    `
	Usage
	  $ npx typescript-starter

  Non-Interactive Usage
    $ npx typescript-starter <project-name> [options]

	Options
    --appveyor          include Appveyor for Windows CI
    --description, -d   package.json description
    --dom               include DOM type definitions
    --node              include node.js type definitions
    --strict            enable stricter type-checking
    --travis            include Travis CI configuration
    --yarn              use yarn (default: npm)
    --pnpm              use pnpm (default: npm)

    --no-circleci       don't include CircleCI
    --no-cspell         don't include cspell
    --no-editorconfig   don't include .editorconfig
    --no-functional     don't enable eslint-plugin-functional
    --no-install        skip pnpm/yarn/npm install
    --no-vscode         don't include VS Code debugging config

    Non-Interactive Example
	  $ npx typescript-starter my-library -d 'do something, better'
    `,
    {
      importMeta: import.meta,
      flags: {
        appveyor: {
          default: false,
          type: 'boolean',
        },
        circleci: {
          default: true,
          type: 'boolean',
        },
        cspell: {
          default: true,
          type: 'boolean',
        },
        description: {
          alias: 'd',
          default: 'a typescript-starter.js project',
          type: 'string',
        },
        dom: {
          default: false,
          type: 'boolean',
        },
        editorconfig: {
          default: true,
          type: 'boolean',
        },
        functional: {
          default: true,
          type: 'boolean',
        },
        install: {
          default: true,
          type: 'boolean',
        },
        node: {
          default: false,
          type: 'boolean',
        },
        strict: {
          default: false,
          type: 'boolean',
        },
        travis: {
          default: false,
          type: 'boolean',
        },
        vscode: {
          default: true,
          type: 'boolean',
        },
        yarn: {
          default: false,
          type: 'boolean',
        },
        pnpm: {
          default: false,
          type: 'boolean',
        },
      }
    }
  );

  const info = await UpdateNotifier({
    pkg: cli.pkg as Package,
  }).fetchInfo();
  if (info.type !== 'latest') {
    // eslint-disable-next-line functional/no-throw-statement
    throw new Error(`
      Your version of typescript-starter is outdated.
      Consider using 'npx typescript-starter' to always get the latest version.
      `);
  }

  const version = cli.pkg.version as string;

  const input = cli.input[0];
  if (!input) {
    /**
     * No project-name provided, return to collect options in interactive mode.
     * Note: we always return `install`, so --no-install always works
     * (important for test performance).
     */
    return {
      install: cli.flags.install,
      starterVersion: version,
    };
  }
  const validOrMsg = validateName(input);
  if (typeof validOrMsg === 'string') {
    // eslint-disable-next-line functional/no-throw-statement
    throw new Error(validOrMsg);
  }

  const runner = cli.flags.pnpm
    ? Runner.Pnpm
    : cli.flags.yarn
    ? Runner.Yarn
    : Runner.Npm;

  return {
    appveyor: cli.flags.appveyor,
    circleci: cli.flags.circleci,
    cspell: cli.flags.cspell,
    description: cli.flags.description,
    domDefinitions: cli.flags.dom,
    editorconfig: cli.flags.editorconfig,
    functional: cli.flags.functional,
    install: cli.flags.install,
    nodeDefinitions: cli.flags.node,
    projectName: input,
    runner,
    starterVersion: version,
    strict: cli.flags.strict,
    travis: cli.flags.travis,
    vscode: cli.flags.vscode,
  };
}

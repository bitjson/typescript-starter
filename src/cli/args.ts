// tslint:disable:no-console no-if-statement no-expression-statement

import meow from 'meow';
import { Package, UpdateInfo, UpdateNotifier } from 'update-notifier';
import { Runner, TypescriptStarterArgsOptions, validateName } from './utils';

export async function checkArgs(): Promise<TypescriptStarterArgsOptions> {
  const cli = meow(
    `
	Usage
	  $ npx typescript-starter

  Non-Interactive Usage
    $ npx typescript-starter <project-name> [options]
  
	Options
    --description, -d   package.json description
    --yarn              use yarn (default: npm)
    --node              include node.js type definitions
    --dom               include DOM type definitions
    --no-install        skip yarn/npm install
    --strict            Enable stricter type-checking
    --no-immutable      Don't enable tslint-immutable
    --no-vscode         Don't include VS Code debugging config

    Non-Interactive Example
	  $ npx typescript-starter my-library -d 'do something, better'
    `,
    {
      flags: {
        description: {
          alias: 'd',
          default: 'a typescript-starter project',
          type: 'string'
        },
        dom: {
          default: false,
          type: 'boolean'
        },
        immutable: {
          default: true,
          type: 'boolean'
        },
        install: {
          default: true,
          type: 'boolean'
        },
        node: {
          default: false,
          type: 'boolean'
        },
        strict: {
          default: false,
          type: 'boolean'
        },
        vscode: {
          default: true,
          type: 'boolean'
        },
        yarn: {
          default: false,
          type: 'boolean'
        }
      }
    }
  );

  // immediately check for updates every time we run typescript-starter
  const updateInfo = await new Promise<UpdateInfo>((resolve, reject) => {
    const notifier = new UpdateNotifier({
      callback: (error, update) => {
        error ? reject(error) : resolve(update);
      },
      pkg: cli.pkg as Package
    });
    notifier.check();
  });
  if (updateInfo.type !== 'latest') {
    throw new Error(`
    Your version of typescript-starter is outdated.
    Consider using 'npx typescript-starter' to always get the latest version.
    `);
  }

  const input = cli.input[0];
  if (!input) {
    // no project-name provided, return to collect options in interactive mode
    // note: we always return `install`, so --no-install always works
    // (important for test performance)
    return {
      install: cli.flags.install,
      starterVersion: cli.pkg.version
    };
  }
  const validOrMsg = await validateName(input);
  if (typeof validOrMsg === 'string') {
    throw new Error(validOrMsg);
  }

  return {
    description: cli.flags.description,
    domDefinitions: cli.flags.dom,
    immutable: cli.flags.immutable,
    install: cli.flags.install,
    nodeDefinitions: cli.flags.node,
    projectName: input,
    runner: cli.flags.yarn ? Runner.Yarn : Runner.Npm,
    starterVersion: cli.pkg.version,
    strict: cli.flags.strict,
    vscode: cli.flags.vscode
  };
}

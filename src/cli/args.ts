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
    --appveyor          include Appveyor for Windows CI
    --description, -d   package.json description
    --dom               include DOM type definitions
    --node              include node.js type definitions
    --strict            enable stricter type-checking
    --travis            include Travis CI configuration
    --yarn              use yarn (default: npm)

    --no-circleci       don't include CircleCI 
    --no-immutable      don't enable tslint-immutable
    --no-install        skip yarn/npm install
    --no-vscode         don't include VS Code debugging config

    Non-Interactive Example
	  $ npx typescript-starter my-library -d 'do something, better'
    `,
    {
      flags: {
        appveyor: {
          default: false,
          type: 'boolean'
        },
        circleci: {
          default: true,
          type: 'boolean'
        },
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
        travis: {
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
    appveyor: cli.flags.appveyor,
    circleci: cli.flags.circleci,
    description: cli.flags.description,
    domDefinitions: cli.flags.dom,
    immutable: cli.flags.immutable,
    install: cli.flags.install,
    nodeDefinitions: cli.flags.node,
    projectName: input,
    runner: cli.flags.yarn ? Runner.Yarn : Runner.Npm,
    starterVersion: cli.pkg.version,
    strict: cli.flags.strict,
    travis: cli.flags.travis,
    vscode: cli.flags.vscode
  };
}

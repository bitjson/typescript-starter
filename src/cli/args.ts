import meow from 'meow';
import { Package, UpdateInfo, UpdateNotifier } from 'update-notifier';
import { Runner, TypescriptStarterOptions, validateName } from './primitives';

export async function checkArgs(): Promise<
  TypescriptStarterOptions | undefined
> {
  const cli = meow(
    `
	Usage
	  $ typescript-starter

  Non-Interactive Usage
    $ typescript-starter <project-name> [options]
  
	Options
    --description, -d   package.json description
    --yarn              use yarn (default: npm)
    --node              include node.js type definitions
    --dom               include DOM type definitions
    --noinstall         skip yarn/npm install

    Non-Interactive Example
	  $ typescript-starter my-library -d 'do something, better'
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
        node: {
          default: false,
          type: 'boolean'
        },
        noinstall: {
          default: false,
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
        // tslint:disable-next-line:no-expression-statement
        error ? reject(error) : resolve(update);
      },
      pkg: cli.pkg as Package
    });
    // tslint:disable-next-line:no-expression-statement
    notifier.check();
  });
  // tslint:disable-next-line:no-if-statement
  if (updateInfo.type !== 'latest') {
    throw new Error(`
    Your version of typescript-starter is outdated.
    Consider using 'npx typescript-starter' to always get the latest version.
    `);
  }

  const input = cli.input[0];
  // tslint:disable-next-line:no-if-statement
  if (!input) {
    // no project-name provided, return to collect options in interactive mode
    return undefined;
  }
  const validOrMsg = await validateName(input);
  // tslint:disable-next-line:no-if-statement
  if (typeof validOrMsg === 'string') {
    throw new Error(validOrMsg);
  }

  return {
    description: cli.flags.description,
    domDefinitions: cli.flags.dom,
    install: !cli.flags.noinstall,
    name: input,
    nodeDefinitions: cli.flags.node,
    runner: cli.flags.yarn ? Runner.Yarn : Runner.Npm
  };
}

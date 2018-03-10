// tslint:disable:no-expression-statement no-console
import chalk from 'chalk';
import { checkArgs } from './args';
import { inquire } from './inquire';
import { getIntro } from './primitives';
import { LiveTasks } from './tasks';
import { typescriptStarter } from './typescript-starter';

(async () => {
  const cliOptions = await checkArgs();
  const options = cliOptions
    ? cliOptions
    : await (async () => {
        console.log(getIntro(process.stdout.columns));
        return inquire();
      })();
  return typescriptStarter(options, LiveTasks);
})().catch((err: Error) => {
  console.error(`
  ${chalk.red(err.message)}
`);
  process.exit(1);
});

// tslint:disable:no-expression-statement no-console
import chalk from 'chalk';
import { checkArgs } from './args';
import { inquire } from './inquire';
import { getInferredOptions, LiveTasks } from './tasks';
import { typescriptStarter } from './typescript-starter';
import { getIntro, TypescriptStarterUserOptions } from './utils';

(async () => {
  const cliOptions = await checkArgs();
  const userOptions = cliOptions.projectName
    ? (cliOptions as TypescriptStarterUserOptions)
    : {
        ...(await (async () => {
          console.log(getIntro(process.stdout.columns));
          return inquire();
        })()),
        ...cliOptions // merge in cliOptions.install
      };
  const inferredOptions = await getInferredOptions();
  return typescriptStarter({ ...inferredOptions, ...userOptions }, LiveTasks);
})().catch((err: Error) => {
  console.error(`
  ${chalk.red(err.message)}
`);
  process.exit(1);
});

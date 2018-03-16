// tslint:disable:no-expression-statement no-console
import chalk from 'chalk';
import { checkArgs } from './args';
import { inquire } from './inquire';
import { addInferredOptions, LiveTasks } from './tasks';
import { typescriptStarter } from './typescript-starter';
import { getIntro, hasCLIOptions, TypescriptStarterUserOptions } from './utils';

(async () => {
  const argInfo = await checkArgs();
  const userOptions: TypescriptStarterUserOptions = hasCLIOptions(argInfo)
    ? argInfo
    : {
        ...(await (async () => {
          console.log(getIntro(process.stdout.columns));
          return inquire();
        })()),
        ...argInfo
      };
  const options = await addInferredOptions(userOptions);
  return typescriptStarter(options, LiveTasks);
})().catch((err: Error) => {
  console.error(`
  ${chalk.red(err.message)}
`);
  process.exit(1);
});

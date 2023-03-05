import chalk from 'chalk';

import { checkArgs } from './args.js';
import { inquire } from './inquire.js';
import { addInferredOptions, LiveTasks } from './tasks.js';
import { typescriptStarter } from './typescript-starter.js';
import { getIntro, hasCLIOptions, TypescriptStarterUserOptions } from './utils.js';

(async () => {
  const argInfo = await checkArgs();
  const userOptions: TypescriptStarterUserOptions = hasCLIOptions(argInfo)
    ? argInfo
    : {
        ...(await (async () => {
          console.log(getIntro(process.stdout.columns));
          return inquire();
        })()),
        ...argInfo,
      };
  const options = await addInferredOptions(userOptions);
  return typescriptStarter(options, LiveTasks);
})().catch((err: Error) => {
  console.error(`
  ${chalk.red(err.message)}
`);
  process.exit(1);
});

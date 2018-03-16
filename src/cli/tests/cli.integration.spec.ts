/**
 * Tests in this file actually run the CLI and attempt to validate its behavior.
 * Git must be installed on the PATH of the testing machine.
 *
 * We hash every file in the directories after each test, and compare the hashes
 * to the "approved" hashes in this file.
 *
 * When making a change to this project, run the tests and note which files have
 * been modified. After manually reviewing the file for accuracy, simply update
 * the relevant hash below. You may find it helpful to view the differences
 * between a certain file in each test project. E.g.:
 *
 * `diff build/test-one/package.json build/test-two/package.json`
 */

// tslint:disable:no-expression-statement
import test, { ExecutionContext } from 'ava';
import del from 'del';
import execa from 'execa';
import globby from 'globby';
import md5File from 'md5-file';
import meow from 'meow';
import { join, normalize, relative } from 'path';
import { cloneRepo, Placeholders, Tasks } from '../tasks';
import { typescriptStarter } from '../typescript-starter';
import { Runner } from '../utils';

/**
 * NOTE: many of the tests below validate file modification. The filesystem is
 * not mocked, and these tests make real changes. Proceed with caution.
 *
 * Filesystem changes made by these tests should be contained in the `build`
 * directory for easier clean up.
 */

const branch = execa.sync('git', [
  'rev-parse',
  '--symbolic-full-name',
  '--abbrev-ref',
  'HEAD'
]).stdout;
const repoInfo = {
  branch: branch === 'HEAD' ? 'master' : branch,
  repo: process.cwd()
};
const buildDir = join(process.cwd(), 'build');
const env = {
  TYPESCRIPT_STARTER_REPO_BRANCH: repoInfo.branch,
  TYPESCRIPT_STARTER_REPO_URL: repoInfo.repo
};

enum TestDirectories {
  one = 'test-1',
  two = 'test-2',
  three = 'test-3',
  four = 'test-4',
  five = 'test-5',
  six = 'test-6'
}

// If the tests all pass, the TestDirectories will automatically be cleaned up.
test.after(async () => {
  await del([
    `./build/${TestDirectories.one}`,
    `./build/${TestDirectories.two}`,
    `./build/${TestDirectories.three}`,
    `./build/${TestDirectories.four}`,
    `./build/${TestDirectories.five}`,
    `./build/${TestDirectories.six}`
  ]);
});

test('returns version', async t => {
  const expected = meow('').pkg.version;
  t.truthy(typeof expected === 'string');
  const { stdout } = await execa(`./bin/typescript-starter`, ['--version']);
  t.is(stdout, expected);
});

test('returns help/usage', async t => {
  const { stdout } = await execa(`./bin/typescript-starter`, ['--help']);
  t.regex(stdout, /Usage/);
});

test('errors if project name collides with an existing path', async t => {
  const existingDir = 'build';
  const error = await t.throws(
    execa(`./bin/typescript-starter`, [existingDir])
  );
  t.regex(error.stderr, /"build" path already exists/);
});

test('errors if project name is not in kebab-case', async t => {
  const error = await t.throws(
    execa(`./bin/typescript-starter`, ['name with spaces'])
  );
  t.regex(error.stderr, /should be in-kebab-case/);
});

async function hashAllTheThings(
  projectName: string,
  sandboxed = false
): Promise<{ readonly [filename: string]: string }> {
  const projectDir = join(buildDir, projectName);
  const rawFilePaths: ReadonlyArray<string> = await globby(
    [projectDir, `!${projectDir}/.git`],
    {
      dot: true
    }
  );
  const filePaths = sandboxed
    ? rawFilePaths
    : rawFilePaths.filter(
        path =>
          // When not sandboxed, these files will change based on git config
          !['LICENSE', 'package.json'].includes(relative(projectDir, path))
      );
  const hashAll = filePaths.map<Promise<string>>(
    path =>
      new Promise<string>((resolve, reject) => {
        md5File(path, (err: Error, result: string) => {
          err ? reject(err) : resolve(result);
        });
      })
  );
  const hashes = await Promise.all(hashAll);
  return hashes.reduce<{ readonly [filename: string]: string }>(
    (acc, hash, i) => {
      const trimmedNormalizedFilePath = normalize(
        relative(buildDir, filePaths[i])
      )
        // On Windows, normalize returns "\\" as the path separator.
        // Normalize with POSIX:
        .replace(/\\/g, '/');
      return {
        ...acc,
        [trimmedNormalizedFilePath]: hash
      };
    },
    {}
  );
}

test(`${
  TestDirectories.one
}: parses CLI arguments, handles default options`, async t => {
  const description = 'example description 1';
  const { stdout } = await execa(
    `../bin/typescript-starter`,
    [
      `${TestDirectories.one}`,
      // (user entered `-d='example description 1'`)
      `-d=${description}`,
      '--no-install'
    ],
    {
      cwd: buildDir,
      env
    }
  );
  t.regex(stdout, new RegExp(`Created ${TestDirectories.one} 🎉`));
  const map = await hashAllTheThings(TestDirectories.one);
  t.deepEqual(map, {
    'test-1/.circleci/config.yml': '30cc59229facf29bfca712fc6e2ddade',
    'test-1/.github/CONTRIBUTING.md': '5f0dfa7fdf9bf828e3a3aa8fcaeece08',
    'test-1/.github/ISSUE_TEMPLATE.md': '82d1b99b29f32d851627b317195e73d2',
    'test-1/.github/PULL_REQUEST_TEMPLATE.md':
      '710eb5973a8cda83fc568cb1bbe7c026',
    'test-1/.gitignore': '71f7e4ca0e9977a8815c0290c9ddbb1a',
    'test-1/.npmignore': 'd32d96087924f360f31b0438bb69d17e',
    'test-1/.prettierignore': '1da1ce4fdb868f0939608fafd38f9683',
    'test-1/.vscode/launch.json': '17407a15e4276d088a9bbe9ae886fa65',
    'test-1/.vscode/settings.json': '10c634c5fef6ecd298b6e41bf159f2cc',
    'test-1/README.md': '7a9f4efa9213266c3800f3cc82a53ba7',
    'test-1/bin/typescript-starter': 'df05a2c6c849f47761f0e24230359d3e',
    'test-1/src/index.ts': '5991bedc40ac87a01d880c6db16fe349',
    'test-1/src/lib/number.spec.ts': '40ebb014eb7871d1f810c618aba1d589',
    'test-1/src/lib/number.ts': '43756f90e6ac0b1c4ee6c81d8ab969c7',
    'test-1/src/types/example.d.ts': '4221812f6f0434eec77ccb1fba1e3759',
    'test-1/tsconfig.json': '0e04adfce2f26c6473f079f6dabd108a',
    'test-1/tsconfig.module.json': '2fda4c8760c6cfa3462b40df0645850d',
    'test-1/tslint.json': '7ac167ffbcb724a6c270e8dc4e747067'
  });
});

test(`${
  TestDirectories.two
}: parses CLI arguments, handles all options`, async t => {
  const description = 'example description 2';
  const { stdout } = await execa(
    `../bin/typescript-starter`,
    [
      `${TestDirectories.two}`,
      // (user entered `--description 'example description 2'`)
      `--description`,
      `${description}`,
      '--yarn',
      '--node',
      '--dom',
      '--no-install'
    ],
    {
      cwd: buildDir,
      env
    }
  );
  t.regex(stdout, new RegExp(`Created ${TestDirectories.two} 🎉`));
  const map = await hashAllTheThings(TestDirectories.two);
  t.deepEqual(map, {
    'test-2/.circleci/config.yml': '30cc59229facf29bfca712fc6e2ddade',
    'test-2/.github/CONTRIBUTING.md': '5f0dfa7fdf9bf828e3a3aa8fcaeece08',
    'test-2/.github/ISSUE_TEMPLATE.md': '82d1b99b29f32d851627b317195e73d2',
    'test-2/.github/PULL_REQUEST_TEMPLATE.md':
      '710eb5973a8cda83fc568cb1bbe7c026',
    'test-2/.gitignore': 'a5d12062173e075833f8ca6f754d6d43',
    'test-2/.npmignore': 'd32d96087924f360f31b0438bb69d17e',
    'test-2/.prettierignore': '1da1ce4fdb868f0939608fafd38f9683',
    'test-2/.vscode/launch.json': '17407a15e4276d088a9bbe9ae886fa65',
    'test-2/.vscode/settings.json': '10c634c5fef6ecd298b6e41bf159f2cc',
    'test-2/README.md': 'ddaf27da4cc4ca5225785f0ac8f4da58',
    'test-2/bin/typescript-starter': 'df05a2c6c849f47761f0e24230359d3e',
    'test-2/src/index.ts': 'fbc67c2cbf3a7d37e4e02583bf06eec9',
    'test-2/src/lib/async.spec.ts': '1e83b84de3f3b068244885219acb42bd',
    'test-2/src/lib/async.ts': '9012c267bb25fa98ad2561929de3d4e2',
    'test-2/src/lib/hash.spec.ts': '87bfca3c0116fd86a353750fcf585ecf',
    'test-2/src/lib/hash.ts': 'a4c552897f25da5963f410e375264bd1',
    'test-2/src/lib/number.spec.ts': '40ebb014eb7871d1f810c618aba1d589',
    'test-2/src/lib/number.ts': '43756f90e6ac0b1c4ee6c81d8ab969c7',
    'test-2/src/types/example.d.ts': '4221812f6f0434eec77ccb1fba1e3759',
    'test-2/tsconfig.json': '8a55379f60e4e6d4fad1f0b2318b74c4',
    'test-2/tsconfig.module.json': '2fda4c8760c6cfa3462b40df0645850d',
    'test-2/tslint.json': '7ac167ffbcb724a6c270e8dc4e747067'
  });
});

const down = '\x1B\x5B\x42';
const up = '\x1B\x5B\x41';
const enter = '\x0D';
const ms = (milliseconds: number) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds));

async function testInteractive(
  t: ExecutionContext<{}>,
  projectName: string,
  entry: ReadonlyArray<string | ReadonlyArray<string>>
): Promise<execa.ExecaReturns> {
  const typeDefs = entry[3] !== '';
  const proc = execa(`../bin/typescript-starter`, ['--no-install'], {
    cwd: buildDir,
    env
  });

  // TODO: missing in Node.js type definition's ChildProcess.stdin?
  // https://nodejs.org/api/process.html#process_process_stdin
  // proc.stdin.setEncoding('utf8');

  // tslint:disable-next-line:prefer-const no-let
  let buffer = '';
  const checkBuffer = (regex: RegExp) => t.regex(buffer, regex);
  const type = (input: string) => proc.stdin.write(input);
  const clearBuffer = () => (buffer = '');
  proc.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
  });

  // wait for first chunk to be emitted
  await new Promise(resolve => {
    proc.stdout.once('data', resolve);
  });
  await ms(200);
  checkBuffer(
    new RegExp(`typescript-starter[\\s\\S]*Enter the new package name`)
  );
  clearBuffer();
  type(`${projectName}${enter}`);
  await ms(200);
  checkBuffer(new RegExp(`${projectName}[\\s\\S]*What are you making?`));
  clearBuffer();
  type(`${entry[0][0]}${enter}`);
  await ms(200);
  checkBuffer(
    new RegExp(`${entry[0][1]}[\\s\\S]*Enter the package description`)
  );
  clearBuffer();
  type(`${entry[1]}${enter}`);
  await ms(200);
  checkBuffer(new RegExp(`${entry[1]}[\\s\\S]*npm or yarn\\?`));
  clearBuffer();
  type(`${entry[2][0]}${enter}`);
  await ms(200);
  const search = `\\? ${entry[2][1]}`;
  const exp = typeDefs
    ? new RegExp(`${search}`) // should match
    : new RegExp(`(?!${search})`); // should not match
  checkBuffer(exp);
  // tslint:disable-next-line:no-if-statement
  if (typeDefs) {
    clearBuffer();
    type(`${entry[3][0]}${enter}`);
    await ms(200);
    checkBuffer(new RegExp(`${entry[3][1]}[\\s\\S]*More fun stuff`));
  }
  clearBuffer();
  type(`${entry[4][0]}${enter}`);
  await ms(200);
  checkBuffer(new RegExp(`${entry[4][1]}`));
  return proc;
}

test(`${
  TestDirectories.three
}: interactive mode: javascript library`, async t => {
  t.plan(8);
  const proc = await testInteractive(t, `${TestDirectories.three}`, [
    [`${down}${up}${down}`, `Javascript library`],
    `integration test 3 description`,
    [`${down}${up}${down}${enter}`, `yarn`],
    [`${down}${down}${down}${enter}`, `Both Node.js and DOM`],
    [' ', 'stricter type-checking[\\s\\S]*tslint-immutable[\\s\\S]*VS Code']
  ]);
  await proc;
  const map = await hashAllTheThings(TestDirectories.three);
  t.deepEqual(map, {
    'test-3/.circleci/config.yml': '30cc59229facf29bfca712fc6e2ddade',
    'test-3/.github/CONTRIBUTING.md': '5f0dfa7fdf9bf828e3a3aa8fcaeece08',
    'test-3/.github/ISSUE_TEMPLATE.md': '82d1b99b29f32d851627b317195e73d2',
    'test-3/.github/PULL_REQUEST_TEMPLATE.md':
      '710eb5973a8cda83fc568cb1bbe7c026',
    'test-3/.gitignore': 'a5d12062173e075833f8ca6f754d6d43',
    'test-3/.npmignore': 'd32d96087924f360f31b0438bb69d17e',
    'test-3/.prettierignore': '1da1ce4fdb868f0939608fafd38f9683',
    'test-3/.vscode/launch.json': '17407a15e4276d088a9bbe9ae886fa65',
    'test-3/.vscode/settings.json': '10c634c5fef6ecd298b6e41bf159f2cc',
    'test-3/README.md': 'c52631ebf78f6b030af9a109b769b647',
    'test-3/bin/typescript-starter': 'df05a2c6c849f47761f0e24230359d3e',
    'test-3/src/index.ts': 'fbc67c2cbf3a7d37e4e02583bf06eec9',
    'test-3/src/lib/async.spec.ts': '1e83b84de3f3b068244885219acb42bd',
    'test-3/src/lib/async.ts': '9012c267bb25fa98ad2561929de3d4e2',
    'test-3/src/lib/hash.spec.ts': '87bfca3c0116fd86a353750fcf585ecf',
    'test-3/src/lib/hash.ts': 'a4c552897f25da5963f410e375264bd1',
    'test-3/src/lib/number.spec.ts': '40ebb014eb7871d1f810c618aba1d589',
    'test-3/src/lib/number.ts': '43756f90e6ac0b1c4ee6c81d8ab969c7',
    'test-3/src/types/example.d.ts': '4221812f6f0434eec77ccb1fba1e3759',
    'test-3/tsconfig.json': '43817952d399db9e44977b3703edd7cf',
    'test-3/tsconfig.module.json': '2fda4c8760c6cfa3462b40df0645850d',
    'test-3/tslint.json': '7ac167ffbcb724a6c270e8dc4e747067'
  });
});

test(`${
  TestDirectories.four
}: interactive mode: node.js application`, async t => {
  t.plan(7);
  const proc = await testInteractive(t, `${TestDirectories.four}`, [
    [`${down}${up}`, `Node.js application`],
    `integration test 4 description`,
    [`${down}${up}${enter}`, `npm`],
    '',
    [`${down} `, 'VS Code']
  ]);
  await proc;
  const map = await hashAllTheThings(TestDirectories.four);
  t.deepEqual(map, {
    'test-4/.circleci/config.yml': '30cc59229facf29bfca712fc6e2ddade',
    'test-4/.github/CONTRIBUTING.md': '5f0dfa7fdf9bf828e3a3aa8fcaeece08',
    'test-4/.github/ISSUE_TEMPLATE.md': '82d1b99b29f32d851627b317195e73d2',
    'test-4/.github/PULL_REQUEST_TEMPLATE.md':
      '710eb5973a8cda83fc568cb1bbe7c026',
    'test-4/.gitignore': '71f7e4ca0e9977a8815c0290c9ddbb1a',
    'test-4/.npmignore': 'd32d96087924f360f31b0438bb69d17e',
    'test-4/.prettierignore': '1da1ce4fdb868f0939608fafd38f9683',
    'test-4/.vscode/launch.json': '17407a15e4276d088a9bbe9ae886fa65',
    'test-4/.vscode/settings.json': '10c634c5fef6ecd298b6e41bf159f2cc',
    'test-4/README.md': 'a3e0699b39498df4843c9dde95f1e000',
    'test-4/bin/typescript-starter': 'df05a2c6c849f47761f0e24230359d3e',
    'test-4/src/index.ts': 'fbc67c2cbf3a7d37e4e02583bf06eec9',
    'test-4/src/lib/async.spec.ts': '1e83b84de3f3b068244885219acb42bd',
    'test-4/src/lib/async.ts': '9012c267bb25fa98ad2561929de3d4e2',
    'test-4/src/lib/hash.spec.ts': '87bfca3c0116fd86a353750fcf585ecf',
    'test-4/src/lib/hash.ts': 'a4c552897f25da5963f410e375264bd1',
    'test-4/src/lib/number.spec.ts': '40ebb014eb7871d1f810c618aba1d589',
    'test-4/src/lib/number.ts': '43756f90e6ac0b1c4ee6c81d8ab969c7',
    'test-4/src/types/example.d.ts': '4221812f6f0434eec77ccb1fba1e3759',
    'test-4/tsconfig.json': 'e41d08f0aca16cb05430b61e4b6286db',
    'test-4/tsconfig.module.json': '2fda4c8760c6cfa3462b40df0645850d',
    'test-4/tslint.json': '99f6f8fa763bfc2a32377739b3e5dd5c'
  });
});

const sandboxTasks = (
  t: ExecutionContext<{}>,
  commit: boolean,
  install: boolean
): Tasks => {
  return {
    cloneRepo: cloneRepo(execa, true),
    initialCommit: async () => {
      commit ? t.pass() : t.fail();
    },
    install: async () => {
      install ? t.pass() : t.fail();
    }
  };
};

const sandboxOptions = {
  description: 'this is an example description',
  githubUsername: 'SOME_GITHUB_USERNAME',
  repoInfo,
  workingDirectory: buildDir
};

const silenceConsole = (console: any) => {
  // tslint:disable-next-line:no-object-mutation
  console.log = () => {
    // mock console.log to silence it
    return;
  };
};

test(`${
  TestDirectories.five
}: Sandboxed: npm install, initial commit`, async t => {
  t.plan(3);
  const options = {
    ...sandboxOptions,
    domDefinitions: false,
    email: 'email@example.com',
    fullName: 'Satoshi Nakamoto',
    immutable: true,
    install: true,
    nodeDefinitions: false,
    projectName: TestDirectories.five,
    runner: Runner.Npm,
    strict: true,
    vscode: false
  };
  silenceConsole(console);
  await typescriptStarter(options, sandboxTasks(t, true, true));
  const map = await hashAllTheThings(TestDirectories.five, true);
  t.deepEqual(map, {
    'test-5/.circleci/config.yml': '30cc59229facf29bfca712fc6e2ddade',
    'test-5/.github/CONTRIBUTING.md': '5f0dfa7fdf9bf828e3a3aa8fcaeece08',
    'test-5/.github/ISSUE_TEMPLATE.md': '82d1b99b29f32d851627b317195e73d2',
    'test-5/.github/PULL_REQUEST_TEMPLATE.md':
      '710eb5973a8cda83fc568cb1bbe7c026',
    'test-5/.gitignore': '71f7e4ca0e9977a8815c0290c9ddbb1a',
    'test-5/.npmignore': 'd32d96087924f360f31b0438bb69d17e',
    'test-5/.prettierignore': '1da1ce4fdb868f0939608fafd38f9683',
    'test-5/LICENSE': 'd11b4dba04062af8bd80b052066daf1c',
    'test-5/README.md': '8fc7ecb21d7d47289e4b2469eea4db39',
    'test-5/bin/typescript-starter': 'df05a2c6c849f47761f0e24230359d3e',
    'test-5/package.json': '187446ae1d92fddaa89b859d3adc6527',
    'test-5/src/index.ts': '5991bedc40ac87a01d880c6db16fe349',
    'test-5/src/lib/number.spec.ts': '40ebb014eb7871d1f810c618aba1d589',
    'test-5/src/lib/number.ts': '43756f90e6ac0b1c4ee6c81d8ab969c7',
    'test-5/src/types/example.d.ts': '4221812f6f0434eec77ccb1fba1e3759',
    'test-5/tsconfig.json': 'f36dc6407fc898f41a23cb620b2f4884',
    'test-5/tsconfig.module.json': '2fda4c8760c6cfa3462b40df0645850d',
    'test-5/tslint.json': '7ac167ffbcb724a6c270e8dc4e747067'
  });
});

test(`${TestDirectories.six}: Sandboxed: yarn, no initial commit`, async t => {
  t.plan(2);
  const options = {
    ...sandboxOptions,
    domDefinitions: true,
    email: Placeholders.email,
    fullName: Placeholders.name,
    immutable: true,
    install: true,
    nodeDefinitions: true,
    projectName: TestDirectories.six,
    runner: Runner.Yarn,
    strict: false,
    vscode: true
  };
  silenceConsole(console);
  await typescriptStarter(options, sandboxTasks(t, false, true));
  const map = await hashAllTheThings(TestDirectories.six, true);
  t.deepEqual(map, {
    'test-6/.circleci/config.yml': '30cc59229facf29bfca712fc6e2ddade',
    'test-6/.github/CONTRIBUTING.md': '5f0dfa7fdf9bf828e3a3aa8fcaeece08',
    'test-6/.github/ISSUE_TEMPLATE.md': '82d1b99b29f32d851627b317195e73d2',
    'test-6/.github/PULL_REQUEST_TEMPLATE.md':
      '710eb5973a8cda83fc568cb1bbe7c026',
    'test-6/.gitignore': 'a5d12062173e075833f8ca6f754d6d43',
    'test-6/.npmignore': 'd32d96087924f360f31b0438bb69d17e',
    'test-6/.prettierignore': '1da1ce4fdb868f0939608fafd38f9683',
    'test-6/.vscode/launch.json': '17407a15e4276d088a9bbe9ae886fa65',
    'test-6/.vscode/settings.json': '10c634c5fef6ecd298b6e41bf159f2cc',
    'test-6/LICENSE': '1dfe8c78c6af40fc14ea3b40133f1fa5',
    'test-6/README.md': 'd809bcbf240f44b51b575a3d49936232',
    'test-6/bin/typescript-starter': 'df05a2c6c849f47761f0e24230359d3e',
    'test-6/package.json': 'a7a94f6c500a05c90e475049103ba26e',
    'test-6/src/index.ts': 'fbc67c2cbf3a7d37e4e02583bf06eec9',
    'test-6/src/lib/async.spec.ts': '1e83b84de3f3b068244885219acb42bd',
    'test-6/src/lib/async.ts': '9012c267bb25fa98ad2561929de3d4e2',
    'test-6/src/lib/hash.spec.ts': '87bfca3c0116fd86a353750fcf585ecf',
    'test-6/src/lib/hash.ts': 'a4c552897f25da5963f410e375264bd1',
    'test-6/src/lib/number.spec.ts': '40ebb014eb7871d1f810c618aba1d589',
    'test-6/src/lib/number.ts': '43756f90e6ac0b1c4ee6c81d8ab969c7',
    'test-6/src/types/example.d.ts': '4221812f6f0434eec77ccb1fba1e3759',
    'test-6/tsconfig.json': '8a55379f60e4e6d4fad1f0b2318b74c4',
    'test-6/tsconfig.module.json': '2fda4c8760c6cfa3462b40df0645850d',
    'test-6/tslint.json': '7ac167ffbcb724a6c270e8dc4e747067'
  });
});

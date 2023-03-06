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

import { existsSync, mkdirSync } from 'fs';
import { join, relative } from 'path';

import test, { ExecutionContext } from 'ava';
import { deleteSync } from 'del';
import { execa, ExecaError, ExecaReturnValue, execaSync } from 'execa';
import { globby } from 'globby';
import md5File from 'md5-file';
import meow from 'meow';

import { cloneRepo, Placeholders, Tasks } from '../tasks.js';
import { typescriptStarter } from '../typescript-starter.js';
import { normalizePath, Runner } from '../utils.js';

/**
 * NOTE: many of the tests below validate file modification. The filesystem is
 * not mocked, and these tests make real changes. Proceed with caution.
 *
 * Filesystem changes made by these tests should be contained in the `build`
 * directory for easier clean up.
 */

const branch = execaSync('git', [
  'rev-parse',
  '--symbolic-full-name',
  '--abbrev-ref',
  'HEAD',
]).stdout;
const repoInfo = {
  // if local repo is in a detached HEAD state, providing --branch to `git clone` will fail.
  branch: branch === 'HEAD' ? '.' : branch,
  repo: process.cwd(),
};
const testDir = join(process.cwd(), 'test');
if (existsSync(testDir)) {
  deleteSync(testDir);
}
mkdirSync(testDir);
const env = {
  TYPESCRIPT_STARTER_REPO_BRANCH: repoInfo.branch,
  TYPESCRIPT_STARTER_REPO_URL: repoInfo.repo,
};

enum TestDirectories {
  one = 'test-1',
  two = 'test-2',
  three = 'test-3',
  four = 'test-4',
  five = 'test-5',
  six = 'test-6',
}

test('returns version', async (t) => {
  const expected: any = meow('', {
    importMeta: import.meta,
  }).pkg.version;
  t.truthy(typeof expected === 'string');
  const { stdout } = await execa(`./bin/typescript-starter.js`, ['--version']);
  t.is(stdout, expected);
});

test('returns help/usage', async (t) => {
  const { stdout } = await execa(`./bin/typescript-starter.js`, ['--help']);
  t.regex(stdout, /Usage/);
});

test('errors if project name collides with an existing path', async (t) => {
  const existingDir = 'build';
  const error = await t.throwsAsync<ExecaError>(
    execa(`./bin/typescript-starter.js`, [existingDir])
  );
  if (error) t.regex(error.stderr, /"build" path already exists/);
});

test('errors if project name is not in kebab-case', async (t) => {
  const error = await t.throwsAsync<ExecaError>(
    execa(`./bin/typescript-starter.js`, ['name with spaces'])
  );
  if (error) t.regex(error.stderr, /should be in-kebab-case/);
});

async function hashAllTheThings(
  projectName: string,
  sandboxed = false
): Promise<{ readonly [filename: string]: string }> {
  const projectDir = normalizePath(join(testDir, projectName));
  const rawFilePaths: ReadonlyArray<string> = await globby(
    [projectDir, `!${projectDir}/.git`],
    {
      dot: true,
    }
  );
  const filePaths = sandboxed
    ? rawFilePaths
    : rawFilePaths.filter(
        (path) =>
          // When not sandboxed, these files will change based on git config
          !['LICENSE', 'package.json'].includes(relative(projectDir, path))
      );
  const hashAll = filePaths.map<Promise<string>>((path) => md5File(path));
  const hashes = await Promise.all(hashAll);
  return hashes.reduce<{ readonly [filename: string]: string }>(
    (acc, hash, i) => {
      const trimmedNormalizedFilePath = normalizePath(
        relative(testDir, filePaths[i])
      );
      return {
        ...acc,
        [trimmedNormalizedFilePath]: hash,
      };
    },
    {}
  );
}

/**
 * Since we're using Dependabot to keep dependencies fresh, including
 * `package.json` in these file fingerprint tests guarantees that every
 * Dependabot PR will trigger a false-positive test failure.
 *
 * Here we trade complete assurance that `package.json` is correct for much less
 * noisy build results.
 */
const ignorePackageJson = (map: { readonly [file: string]: string }) =>
  Object.entries(map)
    .filter((entry) => !entry[0].includes('package.json'))
    .reduce((ret, [path, hash]) => ({ ...ret, [path]: hash }), {});

test(`${TestDirectories.one}: parses CLI arguments, handles default options`, async (t) => {
  const description = 'example description 1';
  const { stdout } = await execa(
    `../bin/typescript-starter.js`,
    [
      `${TestDirectories.one}`,
      // (user entered `-d='example description 1'`)
      `-d=${description}`,
      '--no-install',
    ],
    {
      cwd: testDir,
      env,
    }
  );
  t.regex(stdout, new RegExp(`Created ${TestDirectories.one} 🎉`));
  const map = await hashAllTheThings(TestDirectories.one);
  t.deepEqual(map, {
    'test-1/.circleci/config.yml': '44d2fd424c93d381d41030f789efabba',
    'test-1/.cspell.json': '6ec7789d9a99ff99bd30d09b48864064',
    'test-1/.editorconfig': '44a3e6c69d9267b0f756986fd970a8f4',
    'test-1/.eslintrc.json': '4e74756d24eaccb7f28d4999e4bd6f0d',
    'test-1/.github/CONTRIBUTING.md': '5f0dfa7fdf9bf828e3a3aa8fcaeece08',
    'test-1/.github/ISSUE_TEMPLATE.md': 'e70a0b70402765682b1a961af855040e',
    'test-1/.github/PULL_REQUEST_TEMPLATE.md':
      '70f4b97f3914e2f399bcc5868e072c29',
    'test-1/.gitignore': '0c488f2c5c62824d42330541d3390a2d',
    'test-1/.prettierignore': '1da1ce4fdb868f0939608fafd38f9683',
    'test-1/.vscode/extensions.json': '2d26a716ba181656faac4cd2d38ec139',
    'test-1/.vscode/launch.json': '140e17d591e03b8850c456ade3aefb1f',
    'test-1/.vscode/settings.json': '1671948882faee285f18d7491f0fc913',
    'test-1/README.md': '7a9f4efa9213266c3800f3cc82a53ba7',
    'test-1/appveyor.yml': '70a91379874bffbf5b27ecbd2fb52ead',
    'test-1/src/index.ts': '5025093b4dc30524d349fd1cc465ed30',
    'test-1/src/lib/number.spec.ts': '0592001d71aa3b3e6bf72f4cd95dc1b9',
    'test-1/src/lib/number.ts': '8e34ca866fa05b31b8b7104295427e2d',
    'test-1/src/types/example.d.ts': '76642861732b16754b0110fb1de49823',
    'test-1/tsconfig.json': 'f6f7fe748d198c1aafd326c0fa837e7e',
    'test-1/tsconfig.module.json': '2d09cbcd671c2e7b0c611cfad9a549e8',
  });
});

test(`${TestDirectories.two}: parses CLI arguments, handles all options`, async (t) => {
  const description = 'example description 2';
  const { stdout } = await execa(
    `../bin/typescript-starter.js`,
    [
      `${TestDirectories.two}`,
      // (user entered `--description 'example description 2'`)
      `--description`,
      `${description}`,
      '--yarn',
      '--node',
      '--dom',
      '--no-install',
    ],
    {
      cwd: testDir,
      env,
    }
  );
  t.regex(stdout, new RegExp(`Created ${TestDirectories.two} 🎉`));
  const map = await hashAllTheThings(TestDirectories.two);
  t.deepEqual(map, {
    'test-2/.circleci/config.yml': '44d2fd424c93d381d41030f789efabba',
    'test-2/.cspell.json': '6ec7789d9a99ff99bd30d09b48864064',
    'test-2/.editorconfig': '44a3e6c69d9267b0f756986fd970a8f4',
    'test-2/.eslintrc.json': '4e74756d24eaccb7f28d4999e4bd6f0d',
    'test-2/.github/CONTRIBUTING.md': '5f0dfa7fdf9bf828e3a3aa8fcaeece08',
    'test-2/.github/ISSUE_TEMPLATE.md': 'e70a0b70402765682b1a961af855040e',
    'test-2/.github/PULL_REQUEST_TEMPLATE.md':
      '70f4b97f3914e2f399bcc5868e072c29',
    'test-2/.gitignore': '5b1097e234aee733c062f84adc7fdccc',
    'test-2/.prettierignore': '1da1ce4fdb868f0939608fafd38f9683',
    'test-2/.vscode/extensions.json': '2d26a716ba181656faac4cd2d38ec139',
    'test-2/.vscode/launch.json': '140e17d591e03b8850c456ade3aefb1f',
    'test-2/.vscode/settings.json': '1671948882faee285f18d7491f0fc913',
    'test-2/README.md': 'ddaf27da4cc4ca5225785f0ac8f4da58',
    'test-2/appveyor.yml': '70a91379874bffbf5b27ecbd2fb52ead',
    'test-2/src/index.ts': 'fbc67c2cbf3a7d37e4e02583bf06eec9',
    'test-2/src/lib/async.spec.ts': '65b10546885ebad41c098318b896f23c',
    'test-2/src/lib/async.ts': 'b74598b1b54d503ad80db470e4ce7b56',
    'test-2/src/lib/hash.spec.ts': '06f6bfc1b03f893a16448bb6d6806ea2',
    'test-2/src/lib/hash.ts': '390d91dc01dd109b134d05cf11bd796e',
    'test-2/src/lib/number.spec.ts': '0592001d71aa3b3e6bf72f4cd95dc1b9',
    'test-2/src/lib/number.ts': '8e34ca866fa05b31b8b7104295427e2d',
    'test-2/src/types/example.d.ts': '76642861732b16754b0110fb1de49823',
    'test-2/tsconfig.json': 'c8881f0890818959c290515e7640023c',
    'test-2/tsconfig.module.json': '2d09cbcd671c2e7b0c611cfad9a549e8',
  });
});

const down = '\x1B\x5B\x42';
const up = '\x1B\x5B\x41';
const enter = '\x0D';
const ms = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function testInteractive(
  projectName: string,
  entry: ReadonlyArray<string | ReadonlyArray<string>>
): Promise<ExecaReturnValue<string>> {
  const typeDefs = entry[3] !== '';
  const proc = execa(`../bin/typescript-starter.js`, ['--no-install'], {
    cwd: testDir,
    env,
  });

  // TODO: missing in Node.js type definition's ChildProcess.stdin?
  // https://nodejs.org/api/process.html#process_process_stdin
  // proc.stdin.setEncoding('utf8');

  const type = (input: string) => proc.stdin?.write(input);

  // wait for first chunk to be emitted
  // eslint-disable-next-line functional/no-return-void
  await new Promise((resolve) => {
    proc.stdout?.once('data', resolve);
  });
  await ms(200);
  type(`${projectName}${enter}`);
  await ms(200);
  type(`${entry[0][0]}${enter}`);
  await ms(200);
  type(`${entry[1]}${enter}`);
  await ms(200);
  type(`${entry[2][0]}${enter}`);
  await ms(200);
  if (typeDefs) {
    type(`${entry[3][0]}${enter}`);
    await ms(200);
  }
  type(`${entry[4][0]}${enter}`);
  await ms(200);
  return proc;
}

test(`${TestDirectories.three}: interactive mode: javascript library`, async (t) => {
  const proc = await testInteractive(`${TestDirectories.three}`, [
    [`${down}${up}${down}`, `Javascript library`],
    `integration test 3 description`,
    [`${down}${up}${down}${enter}`, `yarn`],
    [`${down}${down}${down}${enter}`, `Both Node.js and DOM`],
    [
      ' ',
      'stricter type-checking[\\s\\S]*eslint-plugin-functional[\\s\\S]*VS Code',
    ],
  ]);
  await proc;
  const map = await hashAllTheThings(TestDirectories.three);
  t.deepEqual(map, {
    'test-3/.circleci/config.yml': '44d2fd424c93d381d41030f789efabba',
    'test-3/.cspell.json': '6ec7789d9a99ff99bd30d09b48864064',
    'test-3/.editorconfig': '44a3e6c69d9267b0f756986fd970a8f4',
    'test-3/.eslintrc.json': '4e74756d24eaccb7f28d4999e4bd6f0d',
    'test-3/.github/CONTRIBUTING.md': '5f0dfa7fdf9bf828e3a3aa8fcaeece08',
    'test-3/.github/ISSUE_TEMPLATE.md': 'e70a0b70402765682b1a961af855040e',
    'test-3/.github/PULL_REQUEST_TEMPLATE.md':
      '70f4b97f3914e2f399bcc5868e072c29',
    'test-3/.gitignore': '5b1097e234aee733c062f84adc7fdccc',
    'test-3/.prettierignore': '1da1ce4fdb868f0939608fafd38f9683',
    'test-3/.vscode/extensions.json': '2d26a716ba181656faac4cd2d38ec139',
    'test-3/.vscode/launch.json': '140e17d591e03b8850c456ade3aefb1f',
    'test-3/.vscode/settings.json': '1671948882faee285f18d7491f0fc913',
    'test-3/README.md': 'c52631ebf78f6b030af9a109b769b647',
    'test-3/appveyor.yml': '70a91379874bffbf5b27ecbd2fb52ead',
    'test-3/src/index.ts': 'fbc67c2cbf3a7d37e4e02583bf06eec9',
    'test-3/src/lib/async.spec.ts': '65b10546885ebad41c098318b896f23c',
    'test-3/src/lib/async.ts': 'b74598b1b54d503ad80db470e4ce7b56',
    'test-3/src/lib/hash.spec.ts': '06f6bfc1b03f893a16448bb6d6806ea2',
    'test-3/src/lib/hash.ts': '390d91dc01dd109b134d05cf11bd796e',
    'test-3/src/lib/number.spec.ts': '0592001d71aa3b3e6bf72f4cd95dc1b9',
    'test-3/src/lib/number.ts': '8e34ca866fa05b31b8b7104295427e2d',
    'test-3/src/types/example.d.ts': '76642861732b16754b0110fb1de49823',
    'test-3/tsconfig.json': '1184f3c0851cd2f83b621ace4ce54d6f',
    'test-3/tsconfig.module.json': '2d09cbcd671c2e7b0c611cfad9a549e8',
  });
});

test(`${TestDirectories.four}: interactive mode: node.js application`, async (t) => {
  const proc = await testInteractive(`${TestDirectories.four}`, [
    [`${down}${up}`, `Node.js application`],
    `integration test 4 description`,
    [`${down}${up}${enter}`, `npm`],
    '',
    [`${down} `, 'VS Code'],
  ]);
  await proc;
  const map = await hashAllTheThings(TestDirectories.four);
  t.deepEqual(map, {
    'test-4/.circleci/config.yml': '44d2fd424c93d381d41030f789efabba',
    'test-4/.cspell.json': '6ec7789d9a99ff99bd30d09b48864064',
    'test-4/.editorconfig': '44a3e6c69d9267b0f756986fd970a8f4',
    'test-4/.eslintrc.json': '941448b089cd055bbe476a84c8f96cfe',
    'test-4/.github/CONTRIBUTING.md': '5f0dfa7fdf9bf828e3a3aa8fcaeece08',
    'test-4/.github/ISSUE_TEMPLATE.md': 'e70a0b70402765682b1a961af855040e',
    'test-4/.github/PULL_REQUEST_TEMPLATE.md':
      '70f4b97f3914e2f399bcc5868e072c29',
    'test-4/.gitignore': '0c488f2c5c62824d42330541d3390a2d',
    'test-4/.prettierignore': '1da1ce4fdb868f0939608fafd38f9683',
    'test-4/.vscode/extensions.json': '2d26a716ba181656faac4cd2d38ec139',
    'test-4/.vscode/launch.json': '140e17d591e03b8850c456ade3aefb1f',
    'test-4/.vscode/settings.json': '1671948882faee285f18d7491f0fc913',
    'test-4/README.md': 'a3e0699b39498df4843c9dde95f1e000',
    'test-4/appveyor.yml': '70a91379874bffbf5b27ecbd2fb52ead',
    'test-4/src/index.ts': '5991bedc40ac87a01d880c6db16fe349',
    'test-4/src/lib/async.spec.ts': '65b10546885ebad41c098318b896f23c',
    'test-4/src/lib/async.ts': 'b74598b1b54d503ad80db470e4ce7b56',
    'test-4/src/lib/number.spec.ts': '0592001d71aa3b3e6bf72f4cd95dc1b9',
    'test-4/src/lib/number.ts': '8e34ca866fa05b31b8b7104295427e2d',
    'test-4/src/types/example.d.ts': '76642861732b16754b0110fb1de49823',
    'test-4/tsconfig.json': '839ab9a1c586359718c58591a4f10890',
    'test-4/tsconfig.module.json': '2d09cbcd671c2e7b0c611cfad9a549e8',
  });
});

const sandboxTasks = (
  t: Readonly<ExecutionContext<unknown>>,
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
    },
  };
};

const sandboxOptions = {
  description: 'this is an example description',
  githubUsername: 'SOME_GITHUB_USERNAME',
  repoInfo,
  workingDirectory: testDir,
};

// eslint-disable-next-line functional/no-return-void
const silenceConsole = (console: any) => {
  // eslint-disable-next-line functional/no-return-void,functional/immutable-data
  console.log = () => {
    // mock console.log to silence it
    return;
  };
};

test(`${TestDirectories.five}: Sandboxed: npm install, initial commit`, async (t) => {
  t.plan(3);
  const options = {
    ...sandboxOptions,
    appveyor: false,
    circleci: false,
    cspell: false,
    domDefinitions: false,
    editorconfig: false,
    email: 'email@example.com',
    // cspell: disable-next-line
    fullName: 'Satoshi Nakamoto',
    functional: true,
    install: true,
    nodeDefinitions: false,
    projectName: TestDirectories.five,
    runner: Runner.Npm,
    strict: true,
    travis: false,
    vscode: false,
  };
  silenceConsole(console);
  await typescriptStarter(options, sandboxTasks(t, true, true));
  const map = await hashAllTheThings(TestDirectories.five, true);
  t.deepEqual(ignorePackageJson(map), {
    'test-5/.eslintrc.json': '4e74756d24eaccb7f28d4999e4bd6f0d',
    'test-5/.github/CONTRIBUTING.md': '5f0dfa7fdf9bf828e3a3aa8fcaeece08',
    'test-5/.github/ISSUE_TEMPLATE.md': 'e70a0b70402765682b1a961af855040e',
    'test-5/.github/PULL_REQUEST_TEMPLATE.md':
      '70f4b97f3914e2f399bcc5868e072c29',
    'test-5/.gitignore': '0c488f2c5c62824d42330541d3390a2d',
    'test-5/.prettierignore': '1da1ce4fdb868f0939608fafd38f9683',
    'test-5/LICENSE': '317693126d229a3cdd19725a624a56fc',
    'test-5/README.md': '8fc7ecb21d7d47289e4b2469eea4db39',
    'test-5/appveyor.yml': '70a91379874bffbf5b27ecbd2fb52ead',
    'test-5/src/index.ts': '5025093b4dc30524d349fd1cc465ed30',
    'test-5/src/lib/number.spec.ts': '0592001d71aa3b3e6bf72f4cd95dc1b9',
    'test-5/src/lib/number.ts': '8e34ca866fa05b31b8b7104295427e2d',
    'test-5/src/types/example.d.ts': '76642861732b16754b0110fb1de49823',
    'test-5/tsconfig.json': '6a8f30fa12273069a46ccae2abfe8a17',
    'test-5/tsconfig.module.json': '2d09cbcd671c2e7b0c611cfad9a549e8',
  });
});

test(`${TestDirectories.six}: Sandboxed: yarn, no initial commit`, async (t) => {
  t.plan(2);
  const options = {
    ...sandboxOptions,
    appveyor: true,
    circleci: true,
    cspell: false,
    domDefinitions: true,
    editorconfig: true,
    email: Placeholders.email,
    fullName: Placeholders.name,
    functional: true,
    install: true,
    nodeDefinitions: true,
    projectName: TestDirectories.six,
    runner: Runner.Yarn,
    strict: false,
    travis: true,
    vscode: true,
  };
  silenceConsole(console);
  await typescriptStarter(options, sandboxTasks(t, false, true));
  const map = await hashAllTheThings(TestDirectories.six, true);
  t.deepEqual(ignorePackageJson(map), {
    'test-6/.circleci/config.yml': '44d2fd424c93d381d41030f789efabba',
    'test-6/.editorconfig': '44a3e6c69d9267b0f756986fd970a8f4',
    'test-6/.eslintrc.json': '4e74756d24eaccb7f28d4999e4bd6f0d',
    'test-6/.github/CONTRIBUTING.md': '5f0dfa7fdf9bf828e3a3aa8fcaeece08',
    'test-6/.github/ISSUE_TEMPLATE.md': 'e70a0b70402765682b1a961af855040e',
    'test-6/.github/PULL_REQUEST_TEMPLATE.md':
      '70f4b97f3914e2f399bcc5868e072c29',
    'test-6/.gitignore': '5b1097e234aee733c062f84adc7fdccc',
    'test-6/.prettierignore': '1da1ce4fdb868f0939608fafd38f9683',
    'test-6/.travis.yml': '91976af7b86cffb6960db8c35b27b7d0',
    'test-6/.vscode/extensions.json': '2d26a716ba181656faac4cd2d38ec139',
    'test-6/.vscode/launch.json': '140e17d591e03b8850c456ade3aefb1f',
    'test-6/.vscode/settings.json': 'f70eb64341e74d24d901055a26dc8242',
    'test-6/LICENSE': '03ffa741a4f7e356b69353efa4937d2b',
    'test-6/README.md': 'd809bcbf240f44b51b575a3d49936232',
    'test-6/appveyor.yml': '70a91379874bffbf5b27ecbd2fb52ead',
    'test-6/src/index.ts': 'fbc67c2cbf3a7d37e4e02583bf06eec9',
    'test-6/src/lib/async.spec.ts': '65b10546885ebad41c098318b896f23c',
    'test-6/src/lib/async.ts': 'b74598b1b54d503ad80db470e4ce7b56',
    'test-6/src/lib/hash.spec.ts': '06f6bfc1b03f893a16448bb6d6806ea2',
    'test-6/src/lib/hash.ts': '390d91dc01dd109b134d05cf11bd796e',
    'test-6/src/lib/number.spec.ts': '0592001d71aa3b3e6bf72f4cd95dc1b9',
    'test-6/src/lib/number.ts': '8e34ca866fa05b31b8b7104295427e2d',
    'test-6/src/types/example.d.ts': '76642861732b16754b0110fb1de49823',
    'test-6/tsconfig.json': 'c8881f0890818959c290515e7640023c',
    'test-6/tsconfig.module.json': '2d09cbcd671c2e7b0c611cfad9a549e8',
  });
});

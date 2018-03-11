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
import { join, relative } from 'path';
import { cloneRepo, Placeholders, Tasks } from '../tasks';
import { typescriptStarter } from '../typescript-starter';
import { Runner } from '../utils';
// import { Runner, TypescriptStarterOptions } from '../primitives';

/**
 * NOTE: many of the tests below validate file modification. The filesystem is
 * not mocked, and these tests make real changes. Proceed with caution.
 *
 * Filesystem changes made by these tests should be contained in the `build`
 * directory for easier clean up.
 */

const repoURL = process.cwd();
const buildDir = join(process.cwd(), 'build');

enum TestDirectories {
  one = 'test-one',
  two = 'test-two',
  three = 'test-three',
  four = 'test-four',
  five = 'test-five'
}

// If the tests all pass, the TestDirectories will automatically be cleaned up.
test.after(async () => {
  await del([
    `./build/${TestDirectories.one}`,
    `./build/${TestDirectories.two}`,
    `./build/${TestDirectories.three}`,
    `./build/${TestDirectories.four}`,
    `./build/${TestDirectories.five}`
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
  projectName: string
): Promise<{ readonly [filename: string]: string }> {
  const projectDir = join(buildDir, projectName);
  const filePaths: ReadonlyArray<string> = await globby(projectDir);
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
      const trimmedFilePath = relative(buildDir, filePaths[i]);
      return {
        ...acc,
        [trimmedFilePath]: hash
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
    [`${TestDirectories.one}`, `-description "${description}"`, '--noinstall'],
    {
      cwd: buildDir,
      env: {
        TYPESCRIPT_STARTER_REPO_URL: repoURL
      }
    }
  );
  t.regex(stdout, new RegExp(`Created ${TestDirectories.one} 🎉`));
  const map = await hashAllTheThings(TestDirectories.one);
  t.deepEqual(map, {
    'test-one/LICENSE': 'd814c164ff6999405ccc7bf14dcdb50a',
    'test-one/README.md': '2ab1b6b3e434be0cef6c2b947954198e',
    'test-one/bin/typescript-starter': 'a4ad3923f37f50df986b43b1adb9f6b3',
    'test-one/package.json': 'f8eb20e261b3af91e122f85d8abc6b8d',
    'test-one/src/index.ts': '5991bedc40ac87a01d880c6db16fe349',
    'test-one/src/lib/number.spec.ts': '40ebb014eb7871d1f810c618aba1d589',
    'test-one/src/lib/number.ts': '43756f90e6ac0b1c4ee6c81d8ab969c7',
    'test-one/src/types/example.d.ts': '4221812f6f0434eec77ccb1fba1e3759',
    'test-one/tsconfig.json': 'f36dc6407fc898f41a23cb620b2f4884',
    'test-one/tsconfig.module.json': 'e452fd6ff2580347077ae3fff2443e34',
    'test-one/tslint.json': '7ac167ffbcb724a6c270e8dc4e747067'
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
      `-description "${description}"`,
      '--yarn',
      '--node',
      '--dom',
      '--noinstall'
    ],
    {
      cwd: buildDir,
      env: {
        TYPESCRIPT_STARTER_REPO_URL: repoURL
      }
    }
  );
  t.regex(stdout, new RegExp(`Created ${TestDirectories.two} 🎉`));
  const map = await hashAllTheThings(TestDirectories.two);
  t.deepEqual(map, {
    'test-two/LICENSE': 'd814c164ff6999405ccc7bf14dcdb50a',
    'test-two/README.md': '90745077106bf0554dd02bc967e7e80a',
    'test-two/bin/typescript-starter': 'a4ad3923f37f50df986b43b1adb9f6b3',
    'test-two/package.json': 'e0c7654aa5edcf1ee7a998df3f0f672f',
    'test-two/src/index.ts': 'fbc67c2cbf3a7d37e4e02583bf06eec9',
    'test-two/src/lib/async.spec.ts': '1e83b84de3f3b068244885219acb42bd',
    'test-two/src/lib/async.ts': '9012c267bb25fa98ad2561929de3d4e2',
    'test-two/src/lib/hash.spec.ts': '87bfca3c0116fd86a353750fcf585ecf',
    'test-two/src/lib/hash.ts': 'a4c552897f25da5963f410e375264bd1',
    'test-two/src/lib/number.spec.ts': '40ebb014eb7871d1f810c618aba1d589',
    'test-two/src/lib/number.ts': '43756f90e6ac0b1c4ee6c81d8ab969c7',
    'test-two/src/types/example.d.ts': '4221812f6f0434eec77ccb1fba1e3759',
    'test-two/tsconfig.json': '43817952d399db9e44977b3703edd7cf',
    'test-two/tsconfig.module.json': 'e452fd6ff2580347077ae3fff2443e34',
    'test-two/tslint.json': '7ac167ffbcb724a6c270e8dc4e747067'
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
  const lastCheck = entry[3] !== undefined;
  const proc = execa(`../bin/typescript-starter`, ['--noinstall'], {
    cwd: buildDir,
    env: {
      TYPESCRIPT_STARTER_REPO_URL: repoURL
    }
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
  checkBuffer(new RegExp(`typescript-starter.|s*Enter the new package name`));
  clearBuffer();
  type(`${projectName}${enter}`);
  await ms(200);
  checkBuffer(new RegExp(`${projectName}.|s*What are you making?`));
  clearBuffer();
  type(`${entry[0][0]}${enter}`);
  await ms(200);
  checkBuffer(new RegExp(`${entry[0][1]}.|s*Enter the package description`));
  clearBuffer();
  type(`${entry[1]}${enter}`);
  await ms(200);
  checkBuffer(new RegExp(`${entry[1]}.|s*npm or yarn?`));
  clearBuffer();
  type(`${entry[2][0]}${enter}`);
  await ms(200);
  const search = `${entry[2][1]}.|s*global type definitions`;
  const exp = lastCheck
    ? new RegExp(`${search}`) // should match
    : new RegExp(`(?!${search})`); // should not match
  checkBuffer(exp);
  // tslint:disable-next-line:no-if-statement
  if (lastCheck) {
    clearBuffer();
    type(`${entry[3][0]}${enter}`);
    await ms(200);
    checkBuffer(new RegExp(`${entry[3][1]}`));
  }
  return proc;
}

test(`${
  TestDirectories.three
}: interactive mode: javascript library`, async t => {
  t.plan(7);
  const proc = await testInteractive(t, `${TestDirectories.three}`, [
    [`${down}${up}${down}`, `Javascript library`],
    `integration test 3 description${enter}`,
    [`${down}${up}${down}${enter}`, `yarn`],
    [`${down}${down}${down}${enter}`, `Both Node.js and DOM`]
  ]);
  await proc;
  const map = await hashAllTheThings(TestDirectories.three);
  t.deepEqual(map, {
    'test-three/LICENSE': 'd814c164ff6999405ccc7bf14dcdb50a',
    'test-three/README.md': 'cd140f7a5ea693fd265807374efab219',
    'test-three/bin/typescript-starter': 'a4ad3923f37f50df986b43b1adb9f6b3',
    'test-three/package.json': 'b86d8c4e9827a2c72597a36ea5e1a2d6',
    'test-three/src/index.ts': '5991bedc40ac87a01d880c6db16fe349',
    'test-three/src/lib/number.spec.ts': '40ebb014eb7871d1f810c618aba1d589',
    'test-three/src/lib/number.ts': '43756f90e6ac0b1c4ee6c81d8ab969c7',
    'test-three/src/types/example.d.ts': '4221812f6f0434eec77ccb1fba1e3759',
    'test-three/tsconfig.json': 'f36dc6407fc898f41a23cb620b2f4884',
    'test-three/tsconfig.module.json': 'e452fd6ff2580347077ae3fff2443e34',
    'test-three/tslint.json': '7ac167ffbcb724a6c270e8dc4e747067'
  });
});

test(`${
  TestDirectories.four
}: interactive mode: node.js application`, async t => {
  t.plan(6);
  const proc = await testInteractive(t, `${TestDirectories.four}`, [
    [`${down}${up}`, `Node.js application`],
    `integration test 4 description${enter}`,
    [`${down}${up}${enter}`, `npm`]
  ]);
  await proc;
  const map = await hashAllTheThings(TestDirectories.four);
  t.deepEqual(map, {
    'test-four/LICENSE': 'd814c164ff6999405ccc7bf14dcdb50a',
    'test-four/README.md': 'c321a7d2ad331e74ce394c819181a96e',
    'test-four/bin/typescript-starter': 'a4ad3923f37f50df986b43b1adb9f6b3',
    'test-four/package.json': '01393ce262160df70dc2610cd8ff0a81',
    'test-four/src/index.ts': '5991bedc40ac87a01d880c6db16fe349',
    'test-four/src/lib/number.spec.ts': '40ebb014eb7871d1f810c618aba1d589',
    'test-four/src/lib/number.ts': '43756f90e6ac0b1c4ee6c81d8ab969c7',
    'test-four/src/types/example.d.ts': '4221812f6f0434eec77ccb1fba1e3759',
    'test-four/tsconfig.json': 'f36dc6407fc898f41a23cb620b2f4884',
    'test-four/tsconfig.module.json': 'e452fd6ff2580347077ae3fff2443e34',
    'test-four/tslint.json': '7ac167ffbcb724a6c270e8dc4e747067'
  });
});

test(`${
  TestDirectories.five
}: Bare API: pretend to npm install, should never commit`, async t => {
  t.plan(2);
  const tasks: Tasks = {
    cloneRepo: cloneRepo(execa, true),
    initialCommit: async () => {
      t.fail();
    },
    install: async () => {
      t.pass();
    }
  };
  const options = {
    description: 'this is an example description',
    domDefinitions: false,
    email: Placeholders.email,
    fullName: Placeholders.name,
    githubUsername: 'REDACTED',
    install: true,
    nodeDefinitions: false,
    projectName: TestDirectories.five,
    repoURL,
    runner: Runner.Npm,
    workingDirectory: buildDir
  };

  const log = console.log;
  // tslint:disable-next-line:no-object-mutation
  console.log = () => {
    // mock console.log to silence it
    return;
  };
  await typescriptStarter(options, tasks);
  // tslint:disable-next-line:no-object-mutation
  console.log = log; // and put it back
  const map = await hashAllTheThings(TestDirectories.five);
  t.deepEqual(map, {
    'test-five/LICENSE': '1dfe8c78c6af40fc14ea3b40133f1fa5',
    'test-five/README.md': '07783e7d4d30b9d57a907854700f1e59',
    'test-five/bin/typescript-starter': 'a4ad3923f37f50df986b43b1adb9f6b3',
    'test-five/package.json': '3d7a95598a98ba956e47ccfde8590689',
    'test-five/src/index.ts': '5991bedc40ac87a01d880c6db16fe349',
    'test-five/src/lib/number.spec.ts': '40ebb014eb7871d1f810c618aba1d589',
    'test-five/src/lib/number.ts': '43756f90e6ac0b1c4ee6c81d8ab969c7',
    'test-five/src/types/example.d.ts': '4221812f6f0434eec77ccb1fba1e3759',
    'test-five/tsconfig.json': 'f36dc6407fc898f41a23cb620b2f4884',
    'test-five/tsconfig.module.json': 'e452fd6ff2580347077ae3fff2443e34',
    'test-five/tslint.json': '7ac167ffbcb724a6c270e8dc4e747067'
  });
});

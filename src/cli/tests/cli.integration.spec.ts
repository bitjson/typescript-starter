// Tests in this file actually run the CLI and attempt to validate its behavior.
// Git must be installed on the PATH of the testing machine.

// tslint:disable:no-expression-statement
import test, { ExecutionContext } from 'ava';
import del from 'del';
import execa from 'execa';
import meow from 'meow';
import { join } from 'path';

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

/**
 * NOTE: many of the tests below validate file modification. The filesystem is
 * not mocked, and these tests make real changes. Proceed with caution.
 *
 * TODO: mock the filesystem - https://github.com/avajs/ava/issues/665
 *
 * Until the filesystem is mocked, filesystem changes made by these tests should
 * be contained in the `build` directory for easier clean up.
 */

enum testDirectories {
  one = 'test-one',
  two = 'test-two',
  three = 'test-three',
  four = 'test-four'
}

test.after(async () => {
  await del([
    `./build/${testDirectories.one}`,
    `./build/${testDirectories.two}`,
    `./build/${testDirectories.three}`,
    `./build/${testDirectories.four}`
  ]);
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

test('integration test 1: parses CLI arguments, handles options properly', async t => {
  const { stdout } = await execa(
    `../bin/typescript-starter`,
    [
      `${testDirectories.one}`,
      '-description "example description 1"',
      '--noinstall'
    ],
    {
      cwd: join(process.cwd(), 'build'),
      env: {
        TYPESCRIPT_STARTER_REPO_URL: process.cwd()
      }
    }
  );
  t.regex(stdout, new RegExp(`Created ${testDirectories.one} 🎉`));
  // TODO: validate contents of testDirectories.one
});

test('integration test 2: parses CLI arguments, handles options properly', async t => {
  const { stdout } = await execa(
    `../bin/typescript-starter`,
    [
      `${testDirectories.two}`,
      '-description "example description 2"',
      '--yarn',
      '--node',
      '--dom',
      '--noinstall'
    ],
    {
      cwd: join(process.cwd(), 'build'),
      env: {
        TYPESCRIPT_STARTER_REPO_URL: process.cwd()
      }
    }
  );
  t.regex(stdout, new RegExp(`Created ${testDirectories.two} 🎉`));
  // TODO: validate contents of testDirectories.two
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
): Promise<void> {
  const lastCheck = entry[3] !== undefined;
  t.plan(lastCheck ? 6 : 5);

  const proc = execa(`../bin/typescript-starter`, {
    cwd: join(process.cwd(), 'build'),
    env: {
      TYPESCRIPT_STARTER_REPO_URL: process.cwd()
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
}

test('integration test 3: interactive mode, javascript library', async t => {
  await testInteractive(t, `${testDirectories.three}`, [
    [`${down}${up}${down}`, `Javascript library`],
    `integration test 3 description${enter}`,
    [`${down}${up}${down}${enter}`, `yarn`],
    [`${down}${down}${down}${enter}`, `Both Node.js and DOM`]
  ]);
});

test('integration test 4: interactive mode, node.js application', async t => {
  await testInteractive(t, `${testDirectories.four}`, [
    [`${down}${up}`, `Node.js application`],
    `integration test 4 description${enter}`,
    [`${down}${up}${enter}`, `npm`]
  ]);
});

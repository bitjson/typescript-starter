// tslint:disable:no-expression-statement
import test from 'ava';
import { ExecaStatic } from 'execa';
import meow from 'meow';
import nock from 'nock';
import { checkArgs } from '../args';
import { getIntro, Runner } from '../primitives';
import {
  cloneRepo,
  getGithubUsername,
  getUserInfo,
  initialCommit,
  install,
  Placeholders
} from '../tasks';

test('errors if outdated', async t => {
  nock.disableNetConnect();
  nock('https://registry.npmjs.org:443')
    .get('/typescript-starter')
    .reply(200, {
      'dist-tags': { latest: '9000.0.1' },
      name: 'typescript-starter',
      versions: {
        '9000.0.1': {
          version: '9000.0.1'
        }
      }
    });
  const error = await t.throws(checkArgs);
  t.regex(error.message, /is outdated/);
});

test(`doesn't error if not outdated`, async t => {
  const currentVersion = meow('').pkg.version;
  t.truthy(typeof currentVersion === 'string');
  nock.disableNetConnect();
  nock('https://registry.npmjs.org:443')
    .get('/typescript-starter')
    .reply(200, {
      'dist-tags': { latest: currentVersion },
      name: 'typescript-starter',
      versions: {
        [currentVersion]: {
          version: currentVersion
        }
      }
    });
  await t.notThrows(checkArgs);
});

test(`errors if update-notifier fails`, async t => {
  nock.disableNetConnect();
  nock('https://registry.npmjs.org:443')
    .get('/typescript-starter')
    .reply(404, {});
  const error = await t.throws(checkArgs);
  t.regex(error.message, /doesn\'t exist/);
});

test('ascii art shows if stdout has 85+ columns', async t => {
  const jumbo = getIntro(100);
  const snippet = `| __| | | | '_ \\ / _ \\/ __|/ __| '__| | '_ \\|`;
  t.regex(jumbo, new RegExp(snippet));
});

const mockErr = (code?: string | number) =>
  ((() => {
    const err = new Error();
    // tslint:disable-next-line:no-object-mutation
    (err as any).code = code;
    throw err;
  }) as any) as ExecaStatic;

test('cloneRepo: errors when Git is not installed on PATH', async t => {
  const error = await t.throws(cloneRepo(mockErr('ENOENT'))('fail'));
  t.regex(error.message, /Git is not installed on your PATH/);
});

test('cloneRepo: throws when clone fails', async t => {
  const error = await t.throws(cloneRepo(mockErr(128))('fail'));
  t.regex(error.message, /Git clone failed./);
});

test('cloneRepo: throws when rev-parse fails', async t => {
  // tslint:disable-next-line:prefer-const no-let
  let calls = 0;
  const mock = () => {
    calls++;
    return calls === 1 ? {} : (mockErr(128) as any)();
  };
  const error = await t.throws(cloneRepo((mock as any) as ExecaStatic)('fail'));
  t.regex(error.message, /Git rev-parse failed./);
});

test('getGithubUsername: returns found users', async t => {
  const mockFetcher = async (email: string) => email.split('@')[0];
  const username: string = await getGithubUsername(mockFetcher)(
    'bitjson@github.com'
  );
  t.is(username, 'bitjson');
});

test('getGithubUsername: returns placeholder if not found', async t => {
  const mockFetcher = async () => {
    throw new Error();
  };
  const username: string = await getGithubUsername(mockFetcher)(
    'bitjson@github.com'
  );
  t.is(username, Placeholders.username);
});

test('getUserInfo: suppresses errors and returns empty strings', async t => {
  const result = await getUserInfo(mockErr(1))();
  t.deepEqual(result, {
    gitEmail: Placeholders.email,
    gitName: Placeholders.name
  });
});

test('initialCommit: throws generated errors', async t => {
  const error = await t.throws(
    initialCommit(mockErr(1))('deadbeef', 'fail', 'name', 'bitjson@github.com')
  );
  t.is(error.code, 1);
});

test("initialCommit: don't attempt to commit if user.name/email is not set", async t => {
  // tslint:disable-next-line:no-let
  let calls = 0;
  const errorIf3 = ((() => {
    calls++;
    calls === 1 ? t.pass() : calls === 2 ? t.pass() : t.fail();
  }) as any) as ExecaStatic;
  t.false(
    await initialCommit(errorIf3)(
      'deadbeef',
      'fail',
      Placeholders.name,
      Placeholders.email
    )
  );
});

test('install: uses the correct runner', async t => {
  const mock = (((runner: Runner) => {
    runner === Runner.Yarn ? t.pass() : t.fail();
  }) as any) as ExecaStatic;
  await install(mock)(true, Runner.Yarn, 'pass');
});

test('install: throws pretty error on failure', async t => {
  const error = await t.throws(install(mockErr())(true, Runner.Npm, 'fail'));
  t.is(error.message, "Installation failed. You'll need to install manually.");
});

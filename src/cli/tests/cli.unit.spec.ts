import test from 'ava';
import { execa, ExecaError } from 'execa';
import meow from 'meow';
import nock from 'nock';

import { checkArgs } from '../args.js';
import {
  cloneRepo,
  getGithubUsername,
  getRepoInfo,
  getUserInfo,
  initialCommit,
  install,
  Placeholders,
} from '../tasks.js';
import { getIntro, Runner, validateName } from '../utils.js';

test('errors if outdated', async (t) => {
  nock.disableNetConnect();
  nock('https://registry.npmjs.org:443')
    .get('/typescript-starter')
    .reply(200, {
      'dist-tags': { latest: '9000.0.1' },
      name: 'typescript-starter',
      versions: {
        '9000.0.1': {
          version: '9000.0.1',
        },
      },
    });
  const error = await t.throwsAsync(checkArgs);
  if (error) t.regex(error.message, /is outdated/);
});

// eslint-disable-next-line functional/no-return-void
const pretendLatestVersionIs = (version: string) => {
  nock.disableNetConnect();
  nock('https://registry.npmjs.org:443')
    .get('/typescript-starter')
    .reply(200, {
      'dist-tags': { latest: version },
      name: 'typescript-starter',
      versions: {
        [version]: {
          version,
        },
      },
    });
};

test("doesn't error if not outdated", async (t) => {
  const currentVersion = meow('', {
    importMeta: import.meta,
  }).pkg.version as string;
  t.truthy(typeof currentVersion === 'string');
  pretendLatestVersionIs(currentVersion);
  await t.notThrows(checkArgs);
});

test('errors if update-notifier fails', async (t) => {
  nock.disableNetConnect();
  nock('https://registry.npmjs.org:443')
    .get('/typescript-starter')
    .reply(404, {});
  const error = await t.throwsAsync(checkArgs);
  if (error) t.regex(error.message, /could not be found/);
});

test('checkArgs returns the right options', async (t) => {
  pretendLatestVersionIs('1.0.0');
  // eslint-disable-next-line functional/immutable-data
  process.argv = [
    'path/to/node',
    'path/to/typescript-starter.js',
    'example-project',
    '--appveyor',
    '--description',
    '"example description"',
    '--dom',
    '--node',
    '--strict',
    '--travis',
    '--yarn',
    '--no-circleci',
    '--no-cspell',
    '--no-editorconfig',
    '--no-functional',
    '--no-install',
    '--no-vscode',
  ];
  const opts = await checkArgs();
  const currentVersion = meow('', {
    importMeta: import.meta,
  }).pkg.version as string;

  t.deepEqual(opts, {
    appveyor: true,
    circleci: false,
    cspell: false,
    description: '"example description"',
    domDefinitions: true,
    editorconfig: false,
    functional: false,
    install: false,
    nodeDefinitions: true,
    projectName: 'example-project',
    runner: Runner.Yarn,
    starterVersion: currentVersion,
    strict: true,
    travis: true,
    vscode: false,
  });
});

test('checkArgs always returns a TypescriptStarterRequiredConfig, even in interactive mode', async (t) => {
  pretendLatestVersionIs('1.0.0');
  // eslint-disable-next-line functional/immutable-data
  process.argv = ['path/to/node', 'path/to/typescript-starter.js'];
  const opts = await checkArgs();
  t.true(typeof opts.install === 'boolean');
  t.true(typeof opts.starterVersion === 'string');
});

test('only accepts valid package names', async (t) => {
  t.true(validateName('package-name'));
  t.true(validateName('package-name-2'));
  t.true(validateName('@example/package-name-2'));
});

test('ascii art shows if stdout has 85+ columns', async (t) => {
  const jumbo = getIntro(100);
  const snippet = `| __| | | | '_ \\ / _ \\/ __|/ __| '__| | '_ \\|`;
  t.regex(jumbo, new RegExp(snippet));
});

test('small ascii art shows if stdout has 74-84 columns', async (t) => {
  const jumbo = getIntro(80);
  const snippet = `|  _| || | '_ \\/ -_|_-</ _| '_| | '_ \\  _|`;
  t.regex(jumbo, new RegExp(snippet));
});

const mockErr = (code = 1, name = 'ERR') =>
  (() => {
    const err: any = new Error();
    // eslint-disable-next-line functional/immutable-data
    err.exitCode = code;
    // eslint-disable-next-line functional/immutable-data
    err.exitCodeName = name;
    // eslint-disable-next-line functional/no-throw-statements
    throw err;
  }) as unknown as typeof execa;

test('cloneRepo: errors when Git is not installed on PATH', async (t) => {
  const error = await t.throwsAsync(
    cloneRepo(mockErr(1, 'ENOENT'))({ repo: 'r', branch: '.' }, 'd', 'p')
  );
  if (error) t.regex(error.message, /Git is not installed on your PATH/);
});

test('cloneRepo: throws when clone fails', async (t) => {
  const error = await t.throwsAsync(
    cloneRepo(mockErr(128))({ repo: 'r', branch: 'b' }, 'd', 'p')
  );
  if (error) t.regex(error.message, /Git clone failed./);
});

test('cloneRepo: throws when rev-parse fails', async (t) => {
  // eslint-disable-next-line functional/no-let
  let calls = 0;
  const mock = (async () => {
    calls++;

    return calls === 1 ? {} : (mockErr(128) as any)();
  }) as unknown as typeof execa;
  const error = await t.throwsAsync(
    cloneRepo(mock)({ repo: 'r', branch: 'b' }, 'd', 'p')
  );
  if (error) t.regex(error.message, /Git rev-parse failed./);
});

test('getGithubUsername: returns found users', async (t) => {
  const mockFetcher = async (email: string) => email.split('@')[0];
  const username: string = await getGithubUsername(mockFetcher)(
    'bitjson@github.com'
  );
  t.is(username, 'bitjson');
});

test("getGithubUsername: returns placeholder if user doesn't have Git user.email set", async (t) => {
  const mockFetcher = async () => t.fail();
  const username: string = await getGithubUsername(mockFetcher)(
    Placeholders.email
  );
  t.is(username, Placeholders.username);
});

test('getGithubUsername: returns placeholder if not found', async (t) => {
  const mockFetcher = async () => {
    throw new Error();
  };
  const username: string = await getGithubUsername(mockFetcher)(
    'bitjson@github.com'
  );
  t.is(username, Placeholders.username);
});

test('getUserInfo: suppresses errors and returns empty strings', async (t) => {
  const result = await getUserInfo(mockErr(1))();
  t.deepEqual(result, {
    gitEmail: Placeholders.email,
    gitName: Placeholders.name,
  });
});

test('getUserInfo: returns results properly', async (t) => {
  const mock = (async () => {
    return {
      stdout: 'result',
    };
  }) as unknown as typeof execa;
  const result = await getUserInfo(mock)();
  t.deepEqual(result, {
    gitEmail: 'result',
    gitName: 'result',
  });
});

test('initialCommit: throws generated errors', async (t) => {
  const error = await t.throwsAsync<ExecaError>(
    initialCommit(mockErr(1))('deadbeef', 'fail')
  );
  if (error) t.is(error.exitCode, 1);
});

test('initialCommit: spawns 3 times', async (t) => {
  t.plan(4);
  const mock = (async () => {
    t.pass();
  }) as unknown as typeof execa;
  await t.notThrowsAsync(initialCommit(mock)('commit', 'dir'));
});

test('install: uses the correct runner', async (t) => {
  const mock = (async (runner: Runner) => {
    runner === Runner.Yarn ? t.pass() : t.fail();
  }) as unknown as typeof execa;
  await install(mock)(Runner.Yarn, 'pass');
});

test('install: throws pretty error on failure', async (t) => {
  const error = await t.throwsAsync(install(mockErr())(Runner.Npm, 'fail'));
  if (error)
    t.is(
      error.message,
      "Installation failed. You'll need to install manually."
    );
});

test("getRepoInfo: returns defaults when TYPESCRIPT_STARTER_REPO_URL/BRANCH aren't set", async (t) => {
  const thisRelease = '9000.0.1';
  t.deepEqual(getRepoInfo(thisRelease), {
    branch: `v${thisRelease}`,
    repo: 'https://github.com/bitjson/typescript-starter.git',
  });
  const url = 'https://another/repo';
  // eslint-disable-next-line functional/immutable-data
  process.env.TYPESCRIPT_STARTER_REPO_URL = url;
  t.deepEqual(getRepoInfo(thisRelease), {
    branch: `master`,
    repo: url,
  });
  const branch = 'test';
  // eslint-disable-next-line functional/immutable-data
  process.env.TYPESCRIPT_STARTER_REPO_BRANCH = branch;
  t.deepEqual(getRepoInfo(thisRelease), {
    branch,
    repo: url,
  });
});

// tslint:disable:no-console no-if-statement no-expression-statement
import execa, { ExecaStatic, Options, StdIOOption } from 'execa';
import { readFileSync, writeFileSync } from 'fs';
import githubUsername from 'github-username';
import { join } from 'path';
import { Runner } from './primitives';

// TODO: await https://github.com/DefinitelyTyped/DefinitelyTyped/pull/24209
const inherit = 'inherit' as StdIOOption;

const repo =
  process.env.TYPESCRIPT_STARTER_REPO_URL ||
  'https://github.com/bitjson/typescript-starter.git';
export interface Tasks {
  readonly cloneRepo: (
    dir: string
  ) => Promise<{ readonly commitHash: string; readonly gitHistoryDir: string }>;
  readonly getGithubUsername: (email: string | undefined) => Promise<string>;
  readonly getUserInfo: () => Promise<{
    readonly gitEmail: string | undefined;
    readonly gitName: string | undefined;
  }>;
  readonly initialCommit: (hash: string, projectDir: string) => Promise<void>;
  readonly install: (
    shouldInstall: boolean,
    runner: Runner,
    projectDir: string
  ) => Promise<void>;
  readonly readPackageJson: (path: string) => any;
  readonly writePackageJson: (path: string, pkg: any) => void;
}

// We implement these as function factories to make unit testing easier.

export const cloneRepo = (spawner: ExecaStatic) => async (dir: string) => {
  const cwd = process.cwd();
  const projectDir = join(cwd, dir);
  const gitHistoryDir = join(projectDir, '.git');
  try {
    await spawner('git', ['clone', '--depth=1', repo, dir], {
      cwd,
      stdio: 'inherit'
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`
    Git is not installed on your PATH. Please install Git and try again.
      
    For more information, visit: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
`);
    } else {
      throw new Error(`Git clone failed.`);
    }
  }
  try {
    const revParseResult = await spawner('git', ['rev-parse', 'HEAD'], {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', inherit]
    });
    const commitHash = revParseResult.stdout;
    return { commitHash, gitHistoryDir };
  } catch (err) {
    throw new Error(`Git rev-parse failed.`);
  }
};

export const getGithubUsername = (fetcher: any) => async (
  email: string | undefined
) => {
  const placeholder = 'YOUR_USER_NAME';
  if (email === undefined) {
    return placeholder;
  }
  return fetcher(email).catch(() => {
    // if username isn't found, just return a placeholder
    return placeholder;
  });
};

export const getUserInfo = (spawner: ExecaStatic) => async () => {
  const opts: Options = {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', inherit]
  };
  try {
    const nameResult = await spawner('git', ['config', 'user.name'], opts);
    const emailResult = await spawner('git', ['config', 'user.email'], opts);
    return {
      gitEmail: emailResult.stdout,
      gitName: nameResult.stdout
    };
  } catch (err) {
    return {
      gitEmail: undefined,
      gitName: undefined
    };
  }
};

export const initialCommit = (spawner: ExecaStatic) => async (
  hash: string,
  projectDir: string
) => {
  const opts: Options = {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: 'pipe'
  };
  await spawner('git', ['init'], opts);
  await spawner('git', ['add', '-A'], opts);
  await spawner(
    'git',
    [
      'commit',
      '-m',
      `Initial commit\n\nCreated with typescript-starter@${hash}`
    ],
    opts
  );
};

export const install = (spawner: ExecaStatic) => async (
  shouldInstall: boolean,
  runner: Runner,
  projectDir: string
) => {
  const opts: Options = {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: 'inherit'
  };
  if (!shouldInstall) {
    return;
  }
  try {
    runner === Runner.Npm
      ? spawner('npm', ['install'], opts)
      : spawner('yarn', opts);
  } catch (err) {
    throw new Error(`Installation failed. You'll need to install manually.`);
  }
};

const readPackageJson = (path: string) =>
  JSON.parse(readFileSync(path, 'utf8'));

const writePackageJson = (path: string, pkg: any) => {
  // write using the same format as npm:
  // https://github.com/npm/npm/blob/latest/lib/install/update-package-json.js#L48
  const stringified = JSON.stringify(pkg, null, 2) + '\n';
  return writeFileSync(path, stringified);
};

export const LiveTasks: Tasks = {
  cloneRepo: cloneRepo(execa),
  getGithubUsername: getGithubUsername(githubUsername),
  getUserInfo: getUserInfo(execa),
  initialCommit: initialCommit(execa),
  install: install(execa),
  readPackageJson,
  writePackageJson
};

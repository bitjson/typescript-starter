import { join } from 'path';

import execa, { Options } from 'execa';
import githubUsername from 'github-username';

import {
  Runner,
  TypescriptStarterInferredOptions,
  TypescriptStarterOptions,
  TypescriptStarterUserOptions,
} from './utils';

export enum Placeholders {
  email = 'YOUR_EMAIL',
  name = 'YOUR_NAME',
  username = 'YOUR_GITHUB_USER_NAME',
}

// We implement these as function factories to make unit testing easier.

export const cloneRepo = (
  spawner: typeof execa,
  suppressOutput = false
) => async (
  repoInfo: {
    readonly branch: string;
    readonly repo: string;
  },
  workingDirectory: string,
  dir: string
) => {
  const projectDir = join(workingDirectory, dir);
  const gitHistoryDir = join(projectDir, '.git');
  const args =
    repoInfo.branch === '.'
      ? ['clone', '--depth=1', repoInfo.repo, dir]
      : [
          'clone',
          '--depth=1',
          `--branch=${repoInfo.branch}`,
          repoInfo.repo,
          dir,
        ];
  try {
    await spawner('git', args, {
      cwd: workingDirectory,
      stdio: suppressOutput ? 'pipe' : 'inherit',
    });
  } catch (err) {
    if (err.exitCodeName === 'ENOENT') {
      // eslint-disable-next-line functional/no-throw-statement
      throw new Error(`
    Git is not installed on your PATH. Please install Git and try again.

    For more information, visit: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
`);
    } else {
      // eslint-disable-next-line functional/no-throw-statement
      throw new Error(`Git clone failed.`);
    }
  }
  try {
    const revParseResult = await spawner('git', ['rev-parse', 'HEAD'], {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'inherit'],
    });
    const commitHash = revParseResult.stdout;
    return { commitHash, gitHistoryDir };
  } catch (err) {
    // eslint-disable-next-line functional/no-throw-statement
    throw new Error(`Git rev-parse failed.`);
  }
};

export const getGithubUsername = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: any
) => async (email: string | undefined): Promise<string> => {
  if (email === Placeholders.email) {
    return Placeholders.username;
  }
  return fetcher(email).catch(() => {
    return Placeholders.username;
  });
};

export const getUserInfo = (spawner: typeof execa) => async () => {
  const opts: Options = {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit'],
  };
  try {
    const nameResult = await spawner('git', ['config', 'user.name'], opts);
    const emailResult = await spawner('git', ['config', 'user.email'], opts);
    return {
      gitEmail: emailResult.stdout,
      gitName: nameResult.stdout,
    };
  } catch (err) {
    return {
      gitEmail: Placeholders.email,
      gitName: Placeholders.name,
    };
  }
};

export const initialCommit = (spawner: typeof execa) => async (
  hash: string,
  projectDir: string
): Promise<void> => {
  const opts: Options = {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: 'pipe',
  };
  await spawner('git', ['init'], opts);
  await spawner('git', ['add', '-A'], opts);
  await spawner(
    'git',
    [
      'commit',
      '-m',
      `Initial commit\n\nCreated with bitjson/typescript-starter@${hash}`,
    ],
    opts
  );
};

export const install = (spawner: typeof execa) => async (
  runner: Runner,
  projectDir: string
) => {
  const opts: Options = {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: 'inherit',
  };
  try {
    runner === Runner.Npm
      ? spawner('npm', ['install'], opts)
      : spawner('yarn', opts);
  } catch (err) {
    // eslint-disable-next-line functional/no-throw-statement
    throw new Error(`Installation failed. You'll need to install manually.`);
  }
};

/**
 * Returns the URL and branch to clone. We clone the branch (tag) at the current
 * release rather than `master`. This ensures we get the exact files expected by
 * this version of the CLI. (If we cloned master, changes merged to master, but
 * not yet released, may cause unexpected results.)
 * @param starterVersion the current version of this CLI
 */
export const getRepoInfo = (starterVersion: string) => {
  return process.env.TYPESCRIPT_STARTER_REPO_URL
    ? {
        branch: process.env.TYPESCRIPT_STARTER_REPO_BRANCH
          ? process.env.TYPESCRIPT_STARTER_REPO_BRANCH
          : 'master',
        repo: process.env.TYPESCRIPT_STARTER_REPO_URL,
      }
    : {
        branch: `v${starterVersion}`,
        repo: 'https://github.com/bitjson/typescript-starter.git',
      };
};

export type Tasks = {
  readonly cloneRepo: (
    repoInfo: {
      readonly branch: string;
      readonly repo: string;
    },
    workingDirectory: string,
    dir: string
  ) => Promise<{ readonly commitHash: string; readonly gitHistoryDir: string }>;
  readonly initialCommit: (
    hash: string,
    projectDir: string,
    name: string
  ) => Promise<void>;
  readonly install: (runner: Runner, projectDir: string) => Promise<void>;
};

export const LiveTasks: Tasks = {
  cloneRepo: cloneRepo(execa),
  initialCommit: initialCommit(execa),
  install: install(execa),
};
export const addInferredOptions = async (
  userOptions: TypescriptStarterUserOptions
): Promise<TypescriptStarterOptions> => {
  const { gitName, gitEmail } = await getUserInfo(execa)();
  const username = await getGithubUsername(githubUsername)(gitEmail);
  const inferredOptions: TypescriptStarterInferredOptions = {
    email: gitEmail,
    fullName: gitName,
    githubUsername: username,
    repoInfo: getRepoInfo(userOptions.starterVersion),
    workingDirectory: process.cwd(),
  };
  return {
    ...inferredOptions,
    appveyor: userOptions.appveyor,
    circleci: userOptions.circleci,
    cspell: userOptions.cspell,
    description: userOptions.description,
    domDefinitions: userOptions.domDefinitions,
    editorconfig: userOptions.editorconfig,
    functional: userOptions.functional,
    install: userOptions.install,
    nodeDefinitions: userOptions.nodeDefinitions,
    projectName: userOptions.projectName,
    runner: userOptions.runner,
    strict: userOptions.strict,
    travis: userOptions.travis,
    vscode: userOptions.vscode,
  };
};

// tslint:disable:no-console no-if-statement no-expression-statement
import execa, { ExecaStatic, Options, StdIOOption } from 'execa';
import githubUsername from 'github-username';
import { join } from 'path';
import { Runner, TypescriptStarterInferredOptions } from './utils';

// TODO: await https://github.com/DefinitelyTyped/DefinitelyTyped/pull/24209
const inherit = 'inherit' as StdIOOption;

export enum Placeholders {
  email = 'YOUR_EMAIL',
  name = 'YOUR_NAME',
  username = 'YOUR_GITHUB_USER_NAME'
}

// We implement these as function factories to make unit testing easier.

export const cloneRepo = (
  spawner: ExecaStatic,
  suppressOutput = false
) => async (repoURL: string, workingDirectory: string, dir: string) => {
  const projectDir = join(workingDirectory, dir);
  const gitHistoryDir = join(projectDir, '.git');
  try {
    await spawner('git', ['clone', '--depth=1', repoURL, dir], {
      cwd: workingDirectory,
      stdio: suppressOutput ? 'pipe' : 'inherit'
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
): Promise<string> => {
  if (email === Placeholders.email) {
    return Placeholders.username;
  }
  return fetcher(email).catch(() => {
    return Placeholders.username;
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
      gitEmail: Placeholders.email,
      gitName: Placeholders.name
    };
  }
};

export const initialCommit = (spawner: ExecaStatic) => async (
  hash: string,
  projectDir: string
): Promise<void> => {
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
  runner: Runner,
  projectDir: string
) => {
  const opts: Options = {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: 'inherit'
  };
  try {
    runner === Runner.Npm
      ? spawner('npm', ['install'], opts)
      : spawner('yarn', opts);
  } catch (err) {
    throw new Error(`Installation failed. You'll need to install manually.`);
  }
};

export const getRepoUrl = () => {
  return (
    process.env.TYPESCRIPT_STARTER_REPO_URL ||
    'https://github.com/bitjson/typescript-starter.git'
  );
};

export interface Tasks {
  readonly cloneRepo: (
    repoURL: string,
    workingDirectory: string,
    dir: string
  ) => Promise<{ readonly commitHash: string; readonly gitHistoryDir: string }>;
  readonly initialCommit: (
    hash: string,
    projectDir: string,
    name: string
  ) => Promise<void>;
  readonly install: (runner: Runner, projectDir: string) => Promise<void>;
}

export const LiveTasks: Tasks = {
  cloneRepo: cloneRepo(execa),
  initialCommit: initialCommit(execa),
  install: install(execa)
};
export const getInferredOptions = async (): Promise<
  TypescriptStarterInferredOptions
> => {
  const { gitName, gitEmail } = await getUserInfo(execa)();
  const username = await getGithubUsername(githubUsername)(gitEmail);
  return {
    email: gitEmail,
    fullName: gitName,
    githubUsername: username,
    repoURL: getRepoUrl(),
    workingDirectory: process.cwd()
  };
};

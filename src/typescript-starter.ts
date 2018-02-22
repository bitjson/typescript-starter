#!/usr/bin/env node

// tslint:disable:no-console
import chalk from 'chalk';
import spawn from 'cross-spawn';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'fs';
import githubUsername from 'github-username';
import gradient from 'gradient-string';
import { prompt } from 'inquirer';
import ora from 'ora';
import { join } from 'path';
import replace from 'replace-in-file';
import sortedObject from 'sorted-object';
import trash from 'trash';

enum ProjectType {
  Node,
  Library
}

enum Runner {
  Npm,
  Yarn
}

enum TypeDefinitions {
  none,
  Node,
  DOM,
  NodeAndDOM
}

const ascii = `
 _                                   _       _            _             _            
| |_ _   _ _ __   ___  ___  ___ _ __(_)_ __ | |_      ___| |_ __ _ _ __| |_ ___ _ __ 
| __| | | | '_ \\ / _ \\/ __|/ __| '__| | '_ \\| __|____/ __| __/ _\` | '__| __/ _ \\ '__|
| |_| |_| | |_) |  __/\\__ \\ (__| |  | | |_) | ||_____\\__ \\ || (_| | |  | ||  __/ |   
 \\__|\\__, | .__/ \\___||___/\\___|_|  |_| .__/ \\__|    |___/\\__\\__,_|_|   \\__\\___|_|   
     |___/|_|                         |_|                                            
`;

const repo =
  process.env.TYPESCRIPT_STARTER_REPO_URL ||
  'https://github.com/bitjson/typescript-starter.git';

(async () => {
  if (process.argv.some(a => a === '-v' || a === '--version')) {
    console.log(
      JSON.parse(readFileSync(`${__dirname}/../../package.json`, 'utf8'))
        .version
    );
    process.exit(0);
  }
  if (process.stdout.columns && process.stdout.columns >= 85) {
    console.log(chalk.bold(gradient.mind(ascii)));
  } else {
    console.log(`\n${chalk.cyan.bold.underline('typescript-starter')}\n`);
  }
  const { definitions, description, name, runner } = await collectOptions();
  const commitHash = await cloneRepo(name);
  const nodeDefinitions = [
    TypeDefinitions.Node,
    TypeDefinitions.NodeAndDOM
  ].includes(definitions);
  const domDefinitions = [
    TypeDefinitions.DOM,
    TypeDefinitions.NodeAndDOM
  ].includes(definitions);
  console.log(`${chalk.dim(`Cloned at commit:${commitHash}`)}\n`);

  const { gitName, gitEmail } = await getUserInfo();
  const username = await githubUsername(gitEmail).catch(err => {
    // if username isn't found, just return a placeholder
    return 'YOUR_USER_NAME';
  });

  const spinner1 = ora('Updating package.json').start();
  const projectPath = join(process.cwd(), name);
  const pkgPath = join(projectPath, 'package.json');
  const pkg = readPackageJson(pkgPath);
  pkg.name = name;
  pkg.version = '1.0.0';
  pkg.description = description;
  delete pkg.bin;
  pkg.repository = `https://github.com/${username}/${name}`;
  pkg.keywords = [];

  // dependencies to retain for Node.js applications
  const nodeKeptDeps = ['sha.js'];
  pkg.dependencies = nodeDefinitions
    ? nodeKeptDeps.reduce((all, dep) => {
        all[dep] = pkg.dependencies[dep];
        return all;
      }, {})
    : {};

  if (runner === Runner.Yarn) {
    pkg.scripts.preinstall = `node -e \"if(process.env.npm_execpath.indexOf('yarn') === -1) throw new Error('${name} must be installed with Yarn: https://yarnpkg.com/')\"`;
  }

  writePackageJson(pkgPath, pkg);
  spinner1.succeed();

  const spinner2 = ora('Updating .gitignore').start();
  if (runner === Runner.Yarn) {
    await replace({
      files: join(projectPath, '.gitignore'),
      from: 'yarn.lock',
      to: 'package-lock.json'
    });
  }
  spinner2.succeed();

  const spinner3 = ora('Updating .npmignore').start();
  await replace({
    files: join(projectPath, '.npmignore'),
    from: 'examples\n',
    to: ''
  });
  spinner3.succeed();

  const spinner4 = ora('Updating LICENSE').start();
  await replace({
    files: join(projectPath, 'LICENSE'),
    from: 'Jason Dreyzehner',
    to: gitName
  });
  spinner4.succeed();

  const spinner5 = ora('Deleting unnecessary files').start();
  await trash([
    join(projectPath, 'examples'),
    join(projectPath, 'CHANGELOG.md'),
    join(projectPath, 'README.md'),
    join(projectPath, 'package-lock.json'),
    join(projectPath, 'src', 'typescript-starter.ts')
  ]);
  spinner5.succeed();

  const spinner6 = ora('Updating README.md').start();
  renameSync(
    join(projectPath, 'README-starter.md'),
    join(projectPath, 'README.md')
  );
  await replace({
    files: join(projectPath, 'README.md'),
    from: 'package-name',
    to: name
  });
  spinner6.succeed();

  if (!domDefinitions) {
    const spinner6A = ora(`tsconfig: don't include "dom" lib`).start();
    await replace({
      files: join(projectPath, 'tsconfig.json'),
      from: '"lib": ["es2017", "dom"]',
      to: '"lib": ["es2017"]'
    });
    spinner6A.succeed();
  }

  if (!nodeDefinitions) {
    const spinner6B = ora(`tsconfig: don't include "node" types`).start();
    await replace({
      files: join(projectPath, 'tsconfig.json'),
      from: '"types": ["node"]',
      to: '"types": []'
    });
    await replace({
      files: join(projectPath, 'src', 'index.ts'),
      from: `export * from './lib/hash';\n`,
      to: ''
    });
    await trash([
      join(projectPath, 'src', 'lib', 'hash.ts'),
      join(projectPath, 'src', 'lib', 'hash.spec.ts'),
      join(projectPath, 'src', 'lib', 'async.ts'),
      join(projectPath, 'src', 'lib', 'async.spec.ts')
    ]);
    spinner6B.succeed();
  }

  console.log(`\n${chalk.green.bold('Installing dependencies...')}\n`);
  await install(runner, projectPath);
  console.log();

  const spinner7 = ora(`Initializing git repository`).start();
  await initialCommit(commitHash, projectPath);
  spinner7.succeed();

  console.log(`\n${chalk.blue.bold(`Created ${name} 🎉`)}\n`);
  // TODO:
  // readme: add how to work on this file
  // `npm link`, `npm run watch`, and in a test directory `TYPESCRIPT_STARTER_REPO_URL='/local/path/to/typescript-starter' typescript-starter`
})();

async function collectOptions() {
  const packageName = {
    filter: (answer: string) => answer.trim(),
    message: 'Enter the new package name:',
    name: 'name',
    type: 'input',
    validate: (answer: string) =>
      !/^\s*[a-zA-Z]+(-[a-zA-Z]+)*\s*$/.test(answer)
        ? 'Name should be in-kebab-case'
        : existsSync(answer)
          ? `The ${answer} path already exists in this directory.`
          : true
  };

  const node = 'Node.js application';
  const lib = 'Javascript library';
  const projectType = {
    choices: [node, lib],
    filter: val => (val === node ? ProjectType.Node : ProjectType.Library),
    message: 'What are you making?',
    name: 'type',
    type: 'list'
  };

  const packageDescription = {
    filter: answer => answer.trim(),
    message: 'Enter the package description:',
    name: 'description',
    type: 'input',
    validate: (answer: string) => answer.length > 0
  };

  const runnerChoices = ['npm', 'yarn'];
  const runner = {
    choices: runnerChoices,
    filter: val => runnerChoices.indexOf(val),
    message: 'Will this project use npm or yarn?',
    name: 'runner',
    type: 'list'
  };

  const typeDefChoices = [
    `None — the library won't use any globals or modules from Node.js or the DOM`,
    `Node.js — parts of the library require access to Node.js globals or built-in modules`,
    `DOM — parts of the library require access to the Document Object Model (DOM)`,
    `Both Node.js and DOM — some parts of the library require Node.js, other parts require DOM access`
  ];
  const typeDefs = {
    choices: typeDefChoices,
    filter: val => typeDefChoices.indexOf(val),
    message: 'Which global type definitions do you want to include?',
    name: 'definitions',
    type: 'list',
    when: answers => answers.type === ProjectType.Library
  };

  return (prompt([
    packageName,
    projectType,
    packageDescription,
    runner,
    typeDefs
  ]) as Promise<{
    name: string;
    type: ProjectType;
    description: string;
    runner: Runner;
    definitions?: TypeDefinitions;
  }>).then(answers => {
    return {
      definitions:
        answers.definitions === undefined
          ? TypeDefinitions.Node
          : answers.definitions,
      description: answers.description,
      name: answers.name,
      runner: answers.runner,
      type: answers.type
    };
  });
}

async function cloneRepo(dir: string) {
  console.log();
  const cwd = process.cwd();
  const projectDir = join(cwd, dir);
  const gitHistoryDir = join(projectDir, '.git');
  const clone = spawn.sync('git', ['clone', '--depth=1', repo, dir], {
    cwd,
    stdio: 'inherit'
  });
  if (clone.error && clone.error.code === 'ENOENT') {
    console.error(
      chalk.red(
        `\nGit is not installed on your PATH. Please install Git and try again.`
      )
    );
    console.log(
      chalk.dim(
        `\nFor more information, visit: ${chalk.bold.underline(
          'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git'
        )}\n`
      )
    );
    process.exit(1);
  } else if (clone.status !== 0) {
    abort(chalk.red(`Git clone failed. Correct the issue and try again.`));
  }
  console.log();
  const revParse = spawn.sync('git', ['rev-parse', 'HEAD'], {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', process.stderr]
  });
  if (revParse.status !== 0) {
    abort(chalk.red(`Git rev-parse failed.`));
  }
  const commitHash = revParse.stdout.trim();
  await trash([gitHistoryDir]);
  return commitHash;
}

async function getUserInfo() {
  const gitNameProc = spawn.sync('git', ['config', 'user.name'], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', process.stderr]
  });
  if (gitNameProc.status !== 0) {
    abort(chalk.red(`Couldn't get name from Git config.`));
  }
  const gitName = gitNameProc.stdout.trim();
  const gitEmailProc = spawn.sync('git', ['config', 'user.email'], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', process.stderr]
  });
  if (gitEmailProc.status !== 0) {
    abort(chalk.red(`Couldn't get email from Git config.`));
  }
  const gitEmail = gitEmailProc.stdout.trim();
  return {
    gitEmail,
    gitName
  };
}

function readPackageJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writePackageJson(path: string, pkg: any) {
  // write using the same format as npm:
  // https://github.com/npm/npm/blob/latest/lib/install/update-package-json.js#L48
  const stringified = JSON.stringify(pkg, null, 2) + '\n';
  writeFileSync(path, stringified);
}

async function install(runner: Runner, projectDir: string) {
  const opts = {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: ['inherit', 'inherit', process.stderr]
  };
  const runnerProc =
    runner === Runner.Npm
      ? spawn.sync('npm', ['install'], opts)
      : spawn.sync('yarn', opts);

  if (runnerProc.status !== 0) {
    abort(chalk.red(`Installation failed. You'll need to install manually.`));
  }
}

async function initialCommit(hash: string, projectDir: string) {
  const opts = {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: ['ignore', 'ignore', process.stderr]
  };
  const init = spawn.sync('git', ['init'], opts);
  if (init.status !== 0) {
    abort(chalk.red(`Git repo initialization failed.`));
  }
  const add = spawn.sync('git', ['add', '-A'], opts);
  if (add.status !== 0) {
    abort(chalk.red(`Could not stage initial commit.`));
  }
  const commit = spawn.sync(
    'git',
    [
      'commit',
      '-m',
      `Initial commit\n\nCreated with typescript-starter@${hash}`
    ],
    opts
  );
  if (commit.status !== 0) {
    abort(chalk.red(`Initial commit failed.`));
  }
}

function abort(msg: string) {
  console.error(`\n${msg}\n`);
  process.exit(1);
}

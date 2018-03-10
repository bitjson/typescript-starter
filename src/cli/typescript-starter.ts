// tslint:disable:no-console no-if-statement no-expression-statement
import chalk from 'chalk';
import del from 'del';
import { renameSync } from 'fs';
import ora from 'ora';
import { join } from 'path';
import replace from 'replace-in-file';
import { Runner, TypescriptStarterOptions } from './primitives';
import { Tasks } from './tasks';

export async function typescriptStarter(
  {
    description,
    domDefinitions,
    install,
    name,
    nodeDefinitions,
    runner
  }: TypescriptStarterOptions,
  tasks: Tasks
): Promise<void> {
  console.log();
  const { commitHash, gitHistoryDir } = await tasks.cloneRepo(name);
  await del([gitHistoryDir]);
  console.log(`
  ${chalk.dim(`Cloned at commit: ${commitHash}`)}
`);

  const { gitName, gitEmail } = await tasks.getUserInfo();
  const username = await tasks.getGithubUsername(gitEmail);

  const spinner1 = ora('Updating package.json').start();
  const projectPath = join(process.cwd(), name);
  const pkgPath = join(projectPath, 'package.json');

  // dependencies to retain for Node.js applications
  const nodeKeptDeps: ReadonlyArray<any> = ['sha.js'];

  const pkg = tasks.readPackageJson(pkgPath);
  const newPkg = {
    ...pkg,
    bin: {},
    dependencies: nodeDefinitions
      ? nodeKeptDeps.reduce((all, dep) => {
          return { ...all, [dep]: pkg.dependencies[dep] };
        }, {})
      : {},
    description,
    keywords: [],
    name,
    repository: `https:// github.com/${username}/${name}`,
    scripts:
      runner === Runner.Yarn
        ? {
            ...pkg.scripts,
            preinstall: `node -e \"if(process.env.npm_execpath.indexOf('yarn') === -1) throw new Error('${name} must be installed with Yarn: https://yarnpkg.com/')\"`
          }
        : { ...pkg.scripts },
    version: '1.0.0'
  };

  tasks.writePackageJson(pkgPath, newPkg);
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
  await del([
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
    await del([
      join(projectPath, 'src', 'lib', 'hash.ts'),
      join(projectPath, 'src', 'lib', 'hash.spec.ts'),
      join(projectPath, 'src', 'lib', 'async.ts'),
      join(projectPath, 'src', 'lib', 'async.spec.ts')
    ]);
    spinner6B.succeed();
  }

  await tasks.install(install, runner, projectPath);

  const spinner7 = ora(`Initializing git repository`).start();
  completeSpinner(
    spinner7,
    await tasks.initialCommit(commitHash, projectPath, gitName, gitEmail),
    "Git config user.name and user.email are not configured. You'll need to `git commit` yourself."
  );

  console.log(`\n${chalk.blue.bold(`Created ${name} 🎉`)}\n`);
}

export function completeSpinner(
  spinner: {
    readonly succeed: (text?: string) => any;
    readonly fail: (text?: string) => any;
  },
  success: boolean,
  message?: string
): void {
  success ? spinner.succeed() : spinner.fail(message);
}

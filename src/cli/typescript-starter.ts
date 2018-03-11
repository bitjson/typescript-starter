// tslint:disable:no-console no-if-statement no-expression-statement
import chalk from 'chalk';
import del from 'del';
import { readFileSync, renameSync, writeFileSync } from 'fs';
import ora from 'ora';
import { join } from 'path';
import replace from 'replace-in-file';
import { Placeholders, Tasks } from './tasks';
import { Runner, TypescriptStarterOptions } from './utils';

export async function typescriptStarter(
  {
    description,
    domDefinitions,
    email,
    install,
    projectName,
    nodeDefinitions,
    runner,
    fullName,
    githubUsername,
    repoURL,
    workingDirectory
  }: TypescriptStarterOptions,
  tasks: Tasks
): Promise<void> {
  console.log();
  const { commitHash, gitHistoryDir } = await tasks.cloneRepo(
    repoURL,
    workingDirectory,
    projectName
  );
  await del([gitHistoryDir]);
  console.log(`
  ${chalk.dim(`Cloned at commit: ${commitHash}`)}
`);

  const spinner1 = ora('Updating package.json').start();
  const projectPath = join(workingDirectory, projectName);
  const pkgPath = join(projectPath, 'package.json');

  // dependencies to retain for Node.js applications
  const nodeKeptDeps: ReadonlyArray<any> = ['sha.js'];

  const pkg = readPackageJson(pkgPath);
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
    projectName,
    repository: `https:// github.com/${githubUsername}/${projectName}`,
    scripts:
      runner === Runner.Yarn
        ? {
            ...pkg.scripts,
            preinstall: `node -e \"if(process.env.npm_execpath.indexOf('yarn') === -1) throw new Error('${projectName} must be installed with Yarn: https://yarnpkg.com/')\"`
          }
        : { ...pkg.scripts },
    version: '1.0.0'
  };

  writePackageJson(pkgPath, newPkg);
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
    to: fullName
  });
  spinner4.succeed();

  const spinner5 = ora('Deleting unnecessary files').start();
  await del([
    join(projectPath, 'examples'),
    join(projectPath, 'CHANGELOG.md'),
    join(projectPath, 'README.md'),
    join(projectPath, 'package-lock.json'),
    join(projectPath, 'src', 'cli'),
    join(projectPath, 'src', 'types', 'cli.d.ts')
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
    to: projectName
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

  if (install) {
    await tasks.install(runner, projectPath);
  }

  if (fullName !== Placeholders.name && email !== Placeholders.email) {
    const spinner7 = ora(`Initializing git repository...`).start();
    await tasks.initialCommit(commitHash, projectPath, fullName);
    spinner7.succeed();
  }

  console.log(`\n${chalk.blue.bold(`Created ${projectName} 🎉`)}\n`);
}

const readPackageJson = (path: string) =>
  JSON.parse(readFileSync(path, 'utf8'));

const writePackageJson = (path: string, pkg: any) => {
  // write using the same format as npm:
  // https://github.com/npm/npm/blob/latest/lib/install/update-package-json.js#L48
  const stringified = JSON.stringify(pkg, null, 2) + '\n';
  return writeFileSync(path, stringified);
};

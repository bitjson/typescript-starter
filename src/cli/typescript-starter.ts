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

  const spinnerPackage = ora('Updating package.json').start();
  const projectPath = join(workingDirectory, projectName);
  const pkgPath = join(projectPath, 'package.json');

  const keptDevDeps: ReadonlyArray<string> = [
    'ava',
    'codecov',
    'cz-conventional-changelog',
    'gh-pages',
    'npm-run-all',
    'npm-scripts-info',
    'nsp',
    'nyc',
    'opn-cli',
    'prettier',
    'standard-version',
    'trash-cli',
    'tslint',
    'tslint-config-prettier',
    'tslint-immutable',
    'typedoc',
    'typescript'
  ];

  // dependencies to retain for Node.js applications
  const nodeKeptDeps: ReadonlyArray<string> = ['sha.js'];

  const filterAllBut = (
    keep: ReadonlyArray<string>,
    from: { readonly [module: string]: number }
  ) =>
    keep.reduce<{ readonly [module: string]: number }>(
      (acc, moduleName: string) => {
        return { ...acc, [moduleName]: from[moduleName] };
      },
      {}
    );

  const pkg = readPackageJson(pkgPath);
  const newPkg = {
    ...pkg,
    dependencies: nodeDefinitions
      ? filterAllBut(nodeKeptDeps, pkg.dependencies)
      : {},
    description,
    devDependencies: filterAllBut(keptDevDeps, pkg.devDependencies),
    keywords: [],
    repository: `https://github.com/${githubUsername}/${projectName}`,
    scripts:
      runner === Runner.Yarn
        ? {
            ...pkg.scripts,
            preinstall: `node -e \"if(process.env.npm_execpath.indexOf('yarn') === -1) throw new Error('${projectName} must be installed with Yarn: https://yarnpkg.com/')\"`
          }
        : { ...pkg.scripts },
    version: '1.0.0'
  };

  // tslint:disable:no-delete no-object-mutation
  delete newPkg.bin;
  delete newPkg.NOTE;
  // tslint:enable:no-delete no-object-mutation

  writePackageJson(pkgPath, newPkg);
  spinnerPackage.succeed();

  const spinnerGitignore = ora('Updating .gitignore').start();
  if (runner === Runner.Yarn) {
    await replace({
      files: join(projectPath, '.gitignore'),
      from: 'yarn.lock',
      to: 'package-lock.json'
    });
  }
  spinnerGitignore.succeed();

  const spinnerNpmignore = ora('Updating .npmignore').start();
  await replace({
    files: join(projectPath, '.npmignore'),
    from: 'examples\n',
    to: ''
  });
  spinnerNpmignore.succeed();

  const spinnerLicense = ora('Updating LICENSE').start();
  await replace({
    files: join(projectPath, 'LICENSE'),
    from: 'Jason Dreyzehner',
    to: fullName
  });
  spinnerLicense.succeed();

  const spinnerDelete = ora('Deleting unnecessary files').start();
  await del([
    join(projectPath, 'examples'),
    join(projectPath, 'CHANGELOG.md'),
    join(projectPath, 'README.md'),
    join(projectPath, 'package-lock.json'),
    join(projectPath, 'src', 'cli'),
    join(projectPath, 'src', 'types', 'cli.d.ts')
  ]);
  spinnerDelete.succeed();

  const spinnertsconfigModule = ora('Removing traces of the CLI').start();
  await replace({
    files: join(projectPath, 'tsconfig.module.json'),
    from: /,\s+\/\/ typescript-starter:[\s\S]*"src\/cli\/\*\*\/\*\.ts"/,
    to: ''
  });
  spinnertsconfigModule.succeed();

  const spinnerReadme = ora('Creating README.md').start();
  renameSync(
    join(projectPath, 'README-starter.md'),
    join(projectPath, 'README.md')
  );
  await replace({
    files: join(projectPath, 'README.md'),
    from: '[package-name]',
    to: projectName
  });
  await replace({
    files: join(projectPath, 'README.md'),
    from: '[description]',
    to: description
  });
  spinnerReadme.succeed();

  if (!domDefinitions) {
    const spinnerDom = ora(`tsconfig: don't include "dom" lib`).start();
    await replace({
      files: join(projectPath, 'tsconfig.json'),
      from: '"lib": ["es2017", "dom"]',
      to: '"lib": ["es2017"]'
    });
    spinnerDom.succeed();
  }

  if (!nodeDefinitions) {
    const spinnerNode = ora(`tsconfig: don't include "node" types`).start();
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
    spinnerNode.succeed();
  }

  if (install) {
    await tasks.install(runner, projectPath);
  }

  const gitIsConfigured =
    fullName !== Placeholders.name && email !== Placeholders.email
      ? true
      : false;
  if (gitIsConfigured) {
    const spinnerGitInit = ora(`Initializing git repository...`).start();
    await tasks.initialCommit(commitHash, projectPath, fullName);
    spinnerGitInit.succeed();
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

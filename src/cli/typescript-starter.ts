import { readFileSync, renameSync, writeFileSync } from 'fs';
import { join } from 'path';

import chalk from 'chalk';
import { deleteAsync, deleteSync } from 'del';
import ora from 'ora';
import replace_in_file from 'replace-in-file';
const { replaceInFile } = replace_in_file;

import { Placeholders, Tasks } from './tasks.js';
import { normalizePath, Runner, TypescriptStarterOptions } from './utils.js';

const readPackageJson = (path: string) =>
  JSON.parse(readFileSync(path, 'utf8'));

// eslint-disable-next-line functional/no-return-void
const writePackageJson = (path: string, pkg: unknown) => {
  // write using the same format as npm:
  // https://github.com/npm/npm/blob/latest/lib/install/update-package-json.js#L48
  const stringified = JSON.stringify(pkg, null, 2) + '\n';
  return writeFileSync(path, stringified);
};

export async function typescriptStarter(
  {
    appveyor,
    circleci,
    cspell,
    description,
    domDefinitions,
    editorconfig,
    email,
    fullName,
    githubUsername,
    functional,
    install,
    nodeDefinitions,
    projectName,
    repoInfo,
    runner,
    strict,
    travis,
    vscode,
    workingDirectory,
  }: TypescriptStarterOptions,
  tasks: Tasks
): Promise<void> {
  console.log();
  const { commitHash, gitHistoryDir } = await tasks.cloneRepo(
    repoInfo,
    workingDirectory,
    projectName
  );
  await deleteAsync([normalizePath(gitHistoryDir)]);
  console.log(`
  ${chalk.dim(`Cloned at commit: ${commitHash}`)}
`);

  const spinnerPackage = ora('Updating package.json').start();
  const projectPath = join(workingDirectory, projectName);
  const pkgPath = join(projectPath, 'package.json');

  const keptDevDeps: ReadonlyArray<string> = [
    '@ava/typescript',
    '@istanbuljs/nyc-config-typescript',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'ava',
    'codecov',
    'cspell',
    'cz-conventional-changelog',
    'eslint',
    'eslint-config-prettier',
    'eslint-plugin-eslint-comments',
    ...(functional ? ['eslint-plugin-functional'] : []),
    'eslint-plugin-import',
    'gh-pages',
    'npm-run-all',
    'nyc',
    'open-cli',
    'prettier',
    'standard-version',
    'trash-cli',
    'ts-node',
    'typedoc',
    'typescript',
  ];

  /**
   * dependencies to retain for Node.js applications
   */
  const nodeKeptDeps: ReadonlyArray<string> = ['@bitauth/libauth'];

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
  const removeCliScripts = {
    'check-integration-test': undefined,
    'check-integration-test:1': undefined,
    'check-integration-test:2': undefined,
    'check-integration-test:3': undefined,
    'check-integration-test:4': undefined,
    'check-integration-test:5': undefined,
    'check-integration-test:6': undefined,
  };
  const scripts = {
    ...pkg.scripts,
    ...removeCliScripts,
    ...(runner === Runner.Yarn
      ? { 'reset-hard': `git clean -dfx && git reset --hard && yarn` }
      : runner === Runner.Pnpm
      ? { 'reset-hard': `git clean -dfx && git reset --hard && pnpm i` }
      : {}),
    ...(cspell ? {} : { 'test:spelling': undefined }),
  };
  const newPkg = {
    ...pkg,
    dependencies: nodeDefinitions
      ? filterAllBut(nodeKeptDeps, pkg.dependencies)
      : {},
    description,
    devDependencies: filterAllBut(keptDevDeps, pkg.devDependencies),
    keywords: [],
    name: projectName,
    repository: `https://github.com/${githubUsername}/${projectName}`,
    scripts,
    version: '1.0.0',
    ava: {
      ...pkg.ava,
      files: ['!build/module/**'],
      ignoredByWatcher: undefined,
    },
  };

  // eslint-disable-next-line functional/immutable-data
  delete newPkg.bin;
  // eslint-disable-next-line functional/immutable-data
  delete newPkg.NOTE;
  // eslint-disable-next-line functional/immutable-data
  delete newPkg.NOTE_2;

  writePackageJson(pkgPath, newPkg);
  spinnerPackage.succeed();

  const spinnerGitignore = ora('Updating .gitignore').start();
  await replaceInFile({
    files: join(projectPath, '.gitignore'),
    from: 'diff\n',
    to: '',
  });
  if (runner === Runner.Yarn) {
    await replaceInFile({
      files: join(projectPath, '.gitignore'),
      from: 'yarn.lock',
      to: 'package-lock.json',
    });
  }
  if (runner === Runner.Pnpm) {
    await replaceInFile({
      files: join(projectPath, '.gitignore'),
      from: 'pnpm-lock.yaml',
      to: 'package-lock.json',
    });
  }
  spinnerGitignore.succeed();

  const spinnerLicense = ora('Updating LICENSE').start();
  await replaceInFile({
    files: join(projectPath, 'LICENSE'),
    // cspell: disable-next-line
    from: 'Jason Dreyzehner',
    to: fullName,
  });
  await replaceInFile({
    files: join(projectPath, 'LICENSE'),
    from: '2017',
    to: new Date().getUTCFullYear().toString(),
  });
  spinnerLicense.succeed();

  const spinnerDelete = ora('Deleting unnecessary files').start();

  await deleteAsync([
    normalizePath(join(projectPath, 'CHANGELOG.md')),
    normalizePath(join(projectPath, 'README.md')),
    normalizePath(join(projectPath, 'package-lock.json')),
    normalizePath(join(projectPath, 'bin')),
    normalizePath(join(projectPath, 'src', 'cli')),
  ]);
  // eslint-disable-next-line no-empty
  if (!appveyor) {
  }
  if (!circleci) {
    deleteSync([normalizePath(join(projectPath, '.circleci'))]);
  } else {
    await replaceInFile({
      files: join(projectPath, '.circleci', 'config.yml'),
      from: / {6}- run: npm run check-integration-tests\n/g,
      to: '',
    });
  }
  if (!cspell) {
    deleteSync([normalizePath(join(projectPath, '.cspell.json'))]);
    if (vscode) {
      await replaceInFile({
        files: join(projectPath, '.vscode', 'settings.json'),
        from: `  "cSpell.userWords": [], // only use words from .cspell.json\n`,
        to: '',
      });
      await replaceInFile({
        files: join(projectPath, '.vscode', 'settings.json'),
        from: `  "cSpell.enabled": true,\n`,
        to: '',
      });
    }
  }
  if (!travis) {
    deleteSync([normalizePath(join(projectPath, '.travis.yml'))]);
  }
  if (!editorconfig) {
    deleteSync([normalizePath(join(projectPath, '.editorconfig'))]);
  }
  if (!vscode) {
    deleteSync([normalizePath(join(projectPath, '.vscode'))]);
  }
  spinnerDelete.succeed();

  const spinnerTsconfigModule = ora('Removing traces of the CLI').start();
  await replaceInFile({
    files: join(projectPath, 'tsconfig.module.json'),
    from: /,\s+\/\/ typescript-starter.js:[\s\S]*"src\/cli\/\*\*\/\*\.ts"/,
    to: '',
  });
  if (vscode) {
    await replaceInFile({
      files: join(projectPath, '.vscode', 'launch.json'),
      from: /,[\s]*\/\/ --- cut here ---[\s\S]*]/,
      to: ']',
    });
  }
  spinnerTsconfigModule.succeed();

  const spinnerReadme = ora('Creating README.md').start();
  renameSync(
    join(projectPath, 'README-starter.md'),
    join(projectPath, 'README.md')
  );
  await replaceInFile({
    files: join(projectPath, 'README.md'),
    from: '[package-name]',
    to: projectName,
  });
  await replaceInFile({
    files: join(projectPath, 'README.md'),
    from: '[description]',
    to: description,
  });
  spinnerReadme.succeed();

  if (!strict) {
    const spinnerStrict = ora(`tsconfig: disable strict`).start();
    await replaceInFile({
      files: join(projectPath, 'tsconfig.json'),
      from: '"strict": true',
      to: '// "strict": true',
    });
    spinnerStrict.succeed();
  }

  if (!domDefinitions) {
    const spinnerDom = ora(`tsconfig: don't include "dom" lib`).start();
    await replaceInFile({
      files: join(projectPath, 'tsconfig.json'),
      from: '"lib": ["es2017", "dom"]',
      to: '"lib": ["es2017"]',
    });
    await replaceInFile({
      files: join(projectPath, 'src', 'index.ts'),
      from: `export * from './lib/hash';\n`,
      to: '',
    });
    await deleteAsync([
      normalizePath(join(projectPath, 'src', 'lib', 'hash.ts')),
      normalizePath(join(projectPath, 'src', 'lib', 'hash.spec.ts')),
    ]);
    spinnerDom.succeed();
  }

  if (!nodeDefinitions) {
    const spinnerNode = ora(`tsconfig: don't include "node" types`).start();
    await replaceInFile({
      files: join(projectPath, 'tsconfig.json'),
      from: '"types": ["node"]',
      to: '"types": []',
    });
    await replaceInFile({
      files: join(projectPath, 'src', 'index.ts'),
      from: `export * from './lib/async';\n`,
      to: '',
    });
    await replaceInFile({
      files: join(projectPath, 'src', 'index.ts'),
      from: `export * from './lib/hash';\n`,
      to: '',
    });
    await deleteAsync([
      normalizePath(join(projectPath, 'src', 'lib', 'hash.ts')),
      normalizePath(join(projectPath, 'src', 'lib', 'hash.spec.ts')),
      normalizePath(join(projectPath, 'src', 'lib', 'async.ts')),
      normalizePath(join(projectPath, 'src', 'lib', 'async.spec.ts')),
    ]);
    spinnerNode.succeed();
  }

  if (!functional) {
    const spinnerEslint = ora(
      `eslint: disable eslint-plugin-functional`
    ).start();
    await replaceInFile({
      files: join(projectPath, '.eslintrc.json'),
      from: '"plugins": ["import", "eslint-comments", "functional"]',
      to: '"plugins": ["import", "eslint-comments"]',
    });
    await replaceInFile({
      files: join(projectPath, '.eslintrc.json'),
      from: '"plugin:functional/lite",\n',
      to: '',
    });
    spinnerEslint.succeed();
  }

  if (install) {
    await tasks.install(runner, projectPath);
  }

  const gitIsConfigured =
    fullName !== Placeholders.name && email !== Placeholders.email;
  if (gitIsConfigured) {
    const spinnerGitInit = ora(`Initializing git repository...`).start();
    await tasks.initialCommit(commitHash, projectPath, fullName);
    spinnerGitInit.succeed();
  }

  console.log(`\n${chalk.blue.bold(`Created ${projectName} 🎉`)}\n`);
}

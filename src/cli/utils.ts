import chalk from 'chalk';
import { existsSync } from 'fs';
import gradient from 'gradient-string';
import validateNpmPackageName from 'validate-npm-package-name';
export enum Runner {
  Npm = 'npm',
  Yarn = 'yarn'
}

export interface TypescriptStarterCLIOptions {
  readonly appveyor: boolean;
  readonly circleci: boolean;
  readonly description: string;
  readonly domDefinitions: boolean;
  readonly editorconfig: boolean;
  readonly immutable: boolean;
  readonly install: boolean;
  readonly nodeDefinitions: boolean;
  readonly projectName: string;
  readonly runner: Runner;
  readonly strict: boolean;
  readonly travis: boolean;
  readonly vscode: boolean;
}

export interface TypescriptStarterRequiredConfig {
  readonly starterVersion: string;
  readonly install: boolean;
}

export type TypescriptStarterUserOptions = TypescriptStarterCLIOptions &
  TypescriptStarterRequiredConfig;

export type TypescriptStarterArgsOptions =
  | TypescriptStarterUserOptions
  | TypescriptStarterRequiredConfig;

export interface TypescriptStarterInferredOptions {
  readonly githubUsername: string;
  readonly fullName: string;
  readonly email: string;
  readonly repoInfo: {
    readonly repo: string;
    readonly branch: string;
  };
  readonly workingDirectory: string;
}

export interface TypescriptStarterOptions
  extends TypescriptStarterCLIOptions,
    TypescriptStarterInferredOptions {
  // readonly starterVersion?: string;
}

export function hasCLIOptions(
  opts: TypescriptStarterArgsOptions
): opts is TypescriptStarterUserOptions {
  return (opts as TypescriptStarterUserOptions).projectName !== undefined;
}

export function validateName(input: string): true | string {
  return !validateNpmPackageName(input).validForNewPackages
    ? 'Name should be in-kebab-case (for npm)'
    : existsSync(input)
    ? `The "${input}" path already exists in this directory.`
    : true;
}

export function getIntro(columns: number | undefined): string {
  const ascii = `
 _                                   _       _            _             _
| |_ _   _ _ __   ___  ___  ___ _ __(_)_ __ | |_      ___| |_ __ _ _ __| |_ ___ _ __
| __| | | | '_ \\ / _ \\/ __|/ __| '__| | '_ \\| __|____/ __| __/ _\` | '__| __/ _ \\ '__|
| |_| |_| | |_) |  __/\\__ \\ (__| |  | | |_) | ||_____\\__ \\ || (_| | |  | ||  __/ |
 \\__|\\__, | .__/ \\___||___/\\___|_|  |_| .__/ \\__|    |___/\\__\\__,_|_|   \\__\\___|_|
     |___/|_|                         |_|
`;

  const asciiSmaller = `
_                             _      _          _            _
| |_ _  _ _ __  ___ ___ __ _ _(_)_ __| |_ ___ __| |_ __ _ _ _| |_ ___ _ _
|  _| || | '_ \\/ -_|_-</ _| '_| | '_ \\  _|___(_-<  _/ _\` | '_|  _/ -_) '_|
 \\__|\\_, | .__/\\___/__/\\__|_| |_| .__/\\__|   /__/\\__\\__,_|_|  \\__\\___|_|
     |__/|_|                    |_|
`;

  return columns && columns >= 85
    ? chalk.bold(gradient.mind(ascii))
    : columns && columns >= 74
    ? chalk.bold(gradient.mind(asciiSmaller))
    : `\n${chalk.cyan.bold.underline('typescript-starter')}\n`;
}

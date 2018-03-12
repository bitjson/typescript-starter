import chalk from 'chalk';
import { existsSync } from 'fs';
import gradient from 'gradient-string';
export enum Runner {
  Npm = 'npm',
  Yarn = 'yarn'
}

export interface TypescriptStarterUserOptions {
  readonly description: string;
  readonly domDefinitions: boolean;
  readonly immutable: boolean;
  readonly install: boolean;
  readonly nodeDefinitions: boolean;
  readonly projectName: string;
  readonly runner: Runner;
  readonly strict: boolean;
  readonly vscode: boolean;
}

export interface TypescriptStarterInferredOptions {
  readonly githubUsername: string;
  readonly fullName: string;
  readonly email: string;
  readonly repoURL: string;
  readonly workingDirectory: string;
}

export interface TypescriptStarterOptions
  extends TypescriptStarterUserOptions,
    TypescriptStarterInferredOptions {}

export function validateName(input: string): true | string {
  return !/^\s*[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\s*$/.test(input)
    ? 'Name should be in-kebab-case'
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

  return columns && columns >= 85
    ? chalk.bold(gradient.mind(ascii))
    : `\n${chalk.cyan.bold.underline('typescript-starter')}\n`;
}

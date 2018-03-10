import { prompt, Question } from 'inquirer';
import { Runner, TypescriptStarterOptions, validateName } from './primitives';

export async function inquire(): Promise<TypescriptStarterOptions> {
  const packageNameQuestion: Question = {
    filter: (answer: string) => answer.trim(),
    message: 'Enter the new package name:',
    name: 'name',
    type: 'input',
    validate: validateName
  };

  enum ProjectType {
    Node = 'node',
    Library = 'lib'
  }
  const projectTypeQuestion: Question = {
    choices: [
      { name: 'Node.js application', value: ProjectType.Node },
      { name: 'Javascript library', value: ProjectType.Library }
    ],
    message: 'What are you making?',
    name: 'type',
    type: 'list'
  };

  const packageDescriptionQuestion: Question = {
    filter: (answer: string) => answer.trim(),
    message: 'Enter the package description:',
    name: 'description',
    type: 'input',
    validate: (answer: string) => answer.length > 0
  };

  const runnerQuestion: Question = {
    choices: [
      { name: 'npm', value: Runner.Npm },
      { name: 'yarn', value: Runner.Yarn }
    ],
    message: 'Will this project use npm or yarn?',
    name: 'runner',
    type: 'list'
  };

  enum TypeDefinitions {
    none = 'none',
    Node = 'node',
    DOM = 'dom',
    NodeAndDOM = 'both'
  }

  const typeDefsQuestion: Question = {
    choices: [
      {
        name: `None — the library won't use any globals or modules from Node.js or the DOM`,
        value: '0'
      },
      {
        name: `Node.js — parts of the library require access to Node.js globals or built-in modules`,
        value: '1'
      },
      {
        name: `DOM — parts of the library require access to the Document Object Model (DOM)`,
        value: '2'
      },
      {
        name: `Both Node.js and DOM — some parts of the library require Node.js, other parts require DOM access`,
        value: '3'
      }
    ],
    message: 'Which global type definitions do you want to include?',
    name: 'definitions',
    type: 'list',
    when: (answers: any) => answers.type === ProjectType.Library
  };

  return prompt([
    packageNameQuestion,
    projectTypeQuestion,
    packageDescriptionQuestion,
    runnerQuestion,
    typeDefsQuestion
  ]).then(answers => {
    const { definitions, description, name, runner } = answers as {
      readonly definitions?: TypeDefinitions;
      readonly description: string;
      readonly name: string;
      readonly runner: Runner;
    };
    return {
      description,
      domDefinitions: definitions
        ? [TypeDefinitions.DOM, TypeDefinitions.NodeAndDOM].includes(
            definitions
          )
        : false,
      install: true,
      name,
      nodeDefinitions: definitions
        ? [TypeDefinitions.Node, TypeDefinitions.NodeAndDOM].includes(
            definitions
          )
        : false,
      runner
    };
  });
}

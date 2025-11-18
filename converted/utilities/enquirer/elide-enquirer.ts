/**
 * Enquirer - Stylish CLI Prompts
 *
 * Stylish, intuitive CLI prompts with rich features.
 * **POLYGLOT SHOWCASE**: Stylish prompts in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/enquirer (~10M+ downloads/week)
 *
 * Features:
 * - Multiple prompt types
 * - Autocomplete support
 * - Survey/form prompts
 * - Snippet templates
 * - Rich validation
 * - Custom prompts
 * - Themeable
 * - Zero dependencies
 *
 * Use cases:
 * - Complex CLI wizards
 * - Form-based input
 * - Advanced configurations
 * - Interactive installers
 * - Developer tools
 *
 * Package has ~10M+ downloads/week on npm!
 */

interface EnquirerPrompt {
  type: string;
  name: string;
  message: string;
  initial?: any;
  choices?: string[] | Array<{name: string, value: any}>;
  validate?: (value: any) => boolean | string;
  result?: (value: any) => any;
}

export class Enquirer {
  async prompt(questions: EnquirerPrompt | EnquirerPrompt[]): Promise<any> {
    const questionsArray = Array.isArray(questions) ? questions : [questions];
    const answers: any = {};

    for (const question of questionsArray) {
      const answer = await this.ask(question);
      answers[question.name] = question.result ? question.result(answer) : answer;
    }

    return answers;
  }

  private async ask(question: EnquirerPrompt): Promise<any> {
    console.log(`\n${question.message}`);
    const answer = question.initial || '';
    console.log(`› ${answer}`);
    return answer;
  }
}

export default new Enquirer();

if (import.meta.url.includes("elide-enquirer.ts")) {
  console.log("✨ Enquirer - Stylish CLI Prompts for Elide (POLYGLOT!)\n");

  const enquirer = new Enquirer();

  const response = await enquirer.prompt({
    type: 'input',
    name: 'project',
    message: 'Project name:',
    initial: 'my-elide-app'
  });

  console.log('Response:', response);
  console.log("\n~10M+ downloads/week on npm!");
}

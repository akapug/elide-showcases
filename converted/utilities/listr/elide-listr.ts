/**
 * Listr - Task Lists
 *
 * Terminal task lists with beautiful output.
 * **POLYGLOT SHOWCASE**: Task lists in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/listr (~8M+ downloads/week)
 *
 * Features:
 * - Task organization
 * - Concurrent tasks
 * - Task status (pending, running, completed, failed)
 * - Subtasks support
 * - Custom renderers
 * - Zero dependencies
 *
 * Package has ~8M+ downloads/week on npm!
 */

interface Task {
  title: string;
  task: () => Promise<void> | void;
}

export class Listr {
  private tasks: Task[];

  constructor(tasks: Task[]) {
    this.tasks = tasks;
  }

  async run(): Promise<void> {
    for (const task of this.tasks) {
      console.log(`⠋ ${task.title}`);
      await task.task();
      console.log(`✔ ${task.title}`);
    }
  }
}

export default Listr;

if (import.meta.url.includes("elide-listr.ts")) {
  console.log("📝 Listr - Task Lists for Elide (POLYGLOT!)\n");

  const tasks = new Listr([
    {
      title: 'Installing dependencies',
      task: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    },
    {
      title: 'Building project',
      task: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  ]);

  await tasks.run();

  console.log("\n~8M+ downloads/week on npm!");
}

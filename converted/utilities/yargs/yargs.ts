/**
 * Yargs - Modern command-line argument parser
 * Based on https://www.npmjs.com/package/yargs (~13M downloads/week)
 */

export function yargs(argv?: string[]) {
  const args = argv || process.argv?.slice(2) || [];
  const parsed: any = { _: [] };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('-')) {
        parsed[key] = next;
        i++;
      } else {
        parsed[key] = true;
      }
    } else if (arg.startsWith('-')) {
      parsed[arg.slice(1)] = true;
    } else {
      parsed._.push(arg);
    }
  }

  return {
    argv: parsed,
    command: (cmd: string, desc: string, handler: (argv: any) => void) => {},
    option: (key: string, opts: any) => {},
    parse: () => parsed
  };
}

export default yargs;

if (import.meta.url.includes("yargs.ts")) {
  console.log("⚙️  Yargs - Command-line parser for Elide\n");
  const argv = yargs(['--name', 'Alice', '--age', '30', 'file.txt']).argv;
  console.log("Parsed:", argv);
  console.log("\n~13M+ downloads/week on npm!");
}

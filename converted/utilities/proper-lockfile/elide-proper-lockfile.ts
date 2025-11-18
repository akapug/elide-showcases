/**
 * proper-lockfile - File Locking
 *
 * Inter-process and inter-machine file locking
 * Prevents concurrent access to critical files
 *
 * Popular package with ~15M downloads/week on npm!
 */

interface LockOptions {
  stale?: number;
  retries?: number;
  realpath?: boolean;
}

interface UnlockOptions {
  realpath?: boolean;
}

const locks = new Map<string, number>();

export async function lock(file: string, options: LockOptions = {}): Promise<() => Promise<void>> {
  const { stale = 10000, retries = 0 } = options;
  const lockFile = `${file}.lock`;

  for (let i = 0; i <= retries; i++) {
    try {
      // Check if lock file exists
      try {
        const stat = await Deno.stat(lockFile);
        const age = Date.now() - (stat.mtime?.getTime() || 0);

        if (age > stale) {
          // Stale lock, remove it
          await Deno.remove(lockFile);
        } else {
          // Lock is held, wait and retry
          if (i < retries) {
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
          }
          throw new Error(`Failed to acquire lock on ${file}`);
        }
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }

      // Create lock file
      await Deno.writeTextFile(lockFile, String(Date.now()));
      locks.set(file, Date.now());

      // Return unlock function
      return async () => {
        await unlock(file);
      };
    } catch (error) {
      if (i === retries) {
        throw error;
      }
    }
  }

  throw new Error(`Failed to acquire lock on ${file}`);
}

export function lockSync(file: string, options: LockOptions = {}): () => void {
  const { stale = 10000, retries = 0 } = options;
  const lockFile = `${file}.lock`;

  for (let i = 0; i <= retries; i++) {
    try {
      try {
        const stat = Deno.statSync(lockFile);
        const age = Date.now() - (stat.mtime?.getTime() || 0);

        if (age > stale) {
          Deno.removeSync(lockFile);
        } else {
          if (i < retries) {
            // Busy wait
            const start = Date.now();
            while (Date.now() - start < 100) {}
            continue;
          }
          throw new Error(`Failed to acquire lock on ${file}`);
        }
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }

      Deno.writeTextFileSync(lockFile, String(Date.now()));
      locks.set(file, Date.now());

      return () => {
        unlockSync(file);
      };
    } catch (error) {
      if (i === retries) {
        throw error;
      }
    }
  }

  throw new Error(`Failed to acquire lock on ${file}`);
}

export async function unlock(file: string, options: UnlockOptions = {}): Promise<void> {
  const lockFile = `${file}.lock`;

  try {
    await Deno.remove(lockFile);
    locks.delete(file);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

export function unlockSync(file: string, options: UnlockOptions = {}): void {
  const lockFile = `${file}.lock`;

  try {
    Deno.removeSync(lockFile);
    locks.delete(file);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

export async function check(file: string): Promise<boolean> {
  const lockFile = `${file}.lock`;
  try {
    await Deno.stat(lockFile);
    return true;
  } catch {
    return false;
  }
}

// CLI Demo
if (import.meta.url.includes("elide-proper-lockfile.ts")) {
  console.log("🔒 proper-lockfile - File Locking for Elide\n");
  console.log('const release = await lock("database.db");');
  console.log('try {');
  console.log('  // Critical section');
  console.log('  await processDatabase();');
  console.log('} finally {');
  console.log('  await release();');
  console.log('}');
  console.log();
  console.log("✅ Use Cases: Database files, config files, shared resources");
  console.log("🚀 ~15M downloads/week on npm");
}

export default { lock, lockSync, unlock, unlockSync, check };

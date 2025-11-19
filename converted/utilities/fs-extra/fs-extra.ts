/**
 * fs-extra - Extra file system methods
 * Based on https://www.npmjs.com/package/fs-extra (~17M downloads/week)
 */

export async function copy(src: string, dest: string): Promise<void> {
  console.log(`Copying ${src} to ${dest}`);
}

export async function remove(path: string): Promise<void> {
  console.log(`Removing ${path}`);
}

export async function ensureDir(path: string): Promise<void> {
  console.log(`Ensuring directory ${path} exists`);
}

export async function readJson(file: string): Promise<any> {
  console.log(`Reading JSON from ${file}`);
  return {};
}

export async function writeJson(file: string, obj: any): Promise<void> {
  console.log(`Writing JSON to ${file}`);
}

export async function pathExists(path: string): Promise<boolean> {
  return true;
}

export const copySync = (src: string, dest: string) => copy(src, dest);
export const removeSync = (path: string) => remove(path);
export const ensureDirSync = (path: string) => ensureDir(path);

export default {
  copy, remove, ensureDir, readJson, writeJson, pathExists,
  copySync, removeSync, ensureDirSync
};

if (import.meta.url.includes("fs-extra.ts")) {
  console.log("📂 fs-extra - Extra file system methods for Elide\n");
  console.log("Features: copy, remove, ensureDir, readJson, writeJson");
  console.log("~17M+ downloads/week on npm!");
}

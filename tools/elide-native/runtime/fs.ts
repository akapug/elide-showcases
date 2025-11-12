/**
 * Elide Native Runtime - File System Operations
 *
 * High-performance file system operations for native applications.
 */

import { NativeBridge } from './bridge';

export class FileSystem {
  static async readFile(path: string, encoding: 'utf8' | 'base64' = 'utf8'): Promise<string> {
    return NativeBridge.readFile(path, encoding);
  }

  static async writeFile(path: string, content: string, encoding: 'utf8' | 'base64' = 'utf8'): Promise<void> {
    return NativeBridge.writeFile(path, content, encoding);
  }

  static async appendFile(path: string, content: string, encoding: 'utf8' | 'base64' = 'utf8'): Promise<void> {
    return NativeBridge.appendFile(path, content, encoding);
  }

  static async deleteFile(path: string): Promise<void> {
    return NativeBridge.deleteFile(path);
  }

  static exists(path: string): boolean {
    return NativeBridge.fileExists(path);
  }

  static async stat(path: string): Promise<{
    path: string;
    size: number;
    isDirectory: boolean;
    modificationTime: number;
    creationTime: number;
  }> {
    return NativeBridge.fileStat(path);
  }

  static async readDir(path: string): Promise<Array<{
    name: string;
    path: string;
    size: number;
    isDirectory: boolean;
    mtime: number;
  }>> {
    return NativeBridge.readDir(path);
  }

  static async mkdir(path: string): Promise<void> {
    return NativeBridge.mkdir(path);
  }

  static async moveFile(from: string, to: string): Promise<void> {
    return NativeBridge.moveFile(from, to);
  }

  static async copyFile(from: string, to: string): Promise<void> {
    return NativeBridge.copyFile(from, to);
  }
}

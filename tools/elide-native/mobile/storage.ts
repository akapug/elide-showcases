/**
 * Elide Mobile Framework - Local Storage
 *
 * Persistent storage APIs for mobile applications.
 */

import { NativeBridge } from '../runtime/bridge';

// AsyncStorage - Key-Value Store

export class AsyncStorage {
  static async setItem(key: string, value: string): Promise<void> {
    return NativeBridge.asyncStorageSetItem(key, value);
  }

  static async getItem(key: string): Promise<string | null> {
    return NativeBridge.asyncStorageGetItem(key);
  }

  static async removeItem(key: string): Promise<void> {
    return NativeBridge.asyncStorageRemoveItem(key);
  }

  static async getAllKeys(): Promise<string[]> {
    return NativeBridge.asyncStorageGetAllKeys();
  }

  static async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    return NativeBridge.asyncStorageMultiGet(keys);
  }

  static async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    return NativeBridge.asyncStorageMultiSet(keyValuePairs);
  }

  static async multiRemove(keys: string[]): Promise<void> {
    return NativeBridge.asyncStorageMultiRemove(keys);
  }

  static async clear(): Promise<void> {
    return NativeBridge.asyncStorageClear();
  }
}

// SecureStorage - Encrypted Storage

export class SecureStorage {
  static async setItem(key: string, value: string): Promise<void> {
    return NativeBridge.secureStorageSetItem(key, value);
  }

  static async getItem(key: string): Promise<string | null> {
    return NativeBridge.secureStorageGetItem(key);
  }

  static async removeItem(key: string): Promise<void> {
    return NativeBridge.secureStorageRemoveItem(key);
  }

  static async getAllKeys(): Promise<string[]> {
    return NativeBridge.secureStorageGetAllKeys();
  }

  static async clear(): Promise<void> {
    return NativeBridge.secureStorageClear();
  }
}

// FileSystem

export interface FileInfo {
  path: string;
  size: number;
  isDirectory: boolean;
  modificationTime: number;
  creationTime: number;
}

export interface ReadDirItem {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  mtime: number;
}

export class FileSystem {
  static DocumentDirectory = NativeBridge.getDocumentDirectory();
  static CacheDirectory = NativeBridge.getCacheDirectory();
  static TemporaryDirectory = NativeBridge.getTemporaryDirectory();

  static async readFile(path: string, encoding?: 'utf8' | 'base64'): Promise<string> {
    return NativeBridge.readFile(path, encoding || 'utf8');
  }

  static async writeFile(path: string, content: string, encoding?: 'utf8' | 'base64'): Promise<void> {
    return NativeBridge.writeFile(path, content, encoding || 'utf8');
  }

  static async appendFile(path: string, content: string, encoding?: 'utf8' | 'base64'): Promise<void> {
    return NativeBridge.appendFile(path, content, encoding || 'utf8');
  }

  static async deleteFile(path: string): Promise<void> {
    return NativeBridge.deleteFile(path);
  }

  static async exists(path: string): Promise<boolean> {
    return NativeBridge.fileExists(path);
  }

  static async stat(path: string): Promise<FileInfo> {
    return NativeBridge.fileStat(path);
  }

  static async readDir(path: string): Promise<ReadDirItem[]> {
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

  static async downloadFile(url: string, destination: string): Promise<void> {
    return NativeBridge.downloadFile(url, destination);
  }

  static async uploadFile(path: string, url: string, headers?: Record<string, string>): Promise<void> {
    return NativeBridge.uploadFile(path, url, headers);
  }
}

// SQLite Database

export interface SQLiteDatabase {
  transaction(callback: (tx: SQLiteTransaction) => void): Promise<void>;
  readTransaction(callback: (tx: SQLiteTransaction) => void): Promise<void>;
  executeSql(sql: string, args?: any[]): Promise<SQLiteResultSet>;
  close(): Promise<void>;
}

export interface SQLiteTransaction {
  executeSql(sql: string, args?: any[]): Promise<SQLiteResultSet>;
}

export interface SQLiteResultSet {
  insertId?: number;
  rowsAffected: number;
  rows: {
    length: number;
    item(index: number): any;
    raw(): any[];
  };
}

export class SQLite {
  static async openDatabase(name: string, version: string = '1.0'): Promise<SQLiteDatabase> {
    const handle = await NativeBridge.openSQLiteDatabase(name, version);

    return {
      transaction: async (callback: (tx: SQLiteTransaction) => void) => {
        return NativeBridge.sqliteTransaction(handle, callback);
      },

      readTransaction: async (callback: (tx: SQLiteTransaction) => void) => {
        return NativeBridge.sqliteReadTransaction(handle, callback);
      },

      executeSql: async (sql: string, args?: any[]) => {
        return NativeBridge.sqliteExecuteSql(handle, sql, args);
      },

      close: async () => {
        return NativeBridge.closeSQLiteDatabase(handle);
      },
    };
  }

  static async deleteDatabase(name: string): Promise<void> {
    return NativeBridge.deleteSQLiteDatabase(name);
  }
}

/**
 * Pino types and interfaces
 */

export interface LoggerOptions {
  name?: string;
  level?: string | number;
  customLevels?: { [key: string]: number };
  useOnlyCustomLevels?: boolean;
  serializers?: { [key: string]: SerializerFn };
  formatters?: Formatters;
  redact?: string[] | RedactOptions;
  hooks?: Hooks;
  timestamp?: boolean | TimestampFn;
  messageKey?: string;
  nestedKey?: string;
  base?: { [key: string]: any } | null;
  enabled?: boolean;
  crlf?: boolean;
  prettyPrint?: boolean | PrettyOptions;
  onChild?: OnChildFn;
}

export type SerializerFn = (value: any) => any;

export interface Formatters {
  level?: (label: string, number: number) => object;
  bindings?: (bindings: { [key: string]: any }) => object;
  log?: (object: { [key: string]: any }) => object;
}

export interface RedactOptions {
  paths: string[];
  censor?: string | ((value: any, path: string[]) => any);
  remove?: boolean;
}

export interface Hooks {
  logMethod?: (args: any[], method: LogFn, level: number) => void;
}

export type TimestampFn = () => string;

export interface PrettyOptions {
  colorize?: boolean;
  crlf?: boolean;
  errorLikeObjectKeys?: string[];
  errorProps?: string;
  levelFirst?: boolean;
  messageKey?: string;
  timestampKey?: string;
  translateTime?: boolean | string;
  ignore?: string;
  include?: string;
  hideObject?: boolean;
  singleLine?: boolean;
  customColors?: string;
  customLevels?: string;
  customPrettifiers?: { [key: string]: PrettifierFn };
}

export type PrettifierFn = (input: any) => string;

export type OnChildFn = (child: Logger) => void;

export type LogFn = (obj: object, msg?: string, ...args: any[]) => void;

export interface Logger {
  level: string | number;
  levelVal: number;

  trace(obj: object, msg?: string, ...args: any[]): void;
  trace(msg: string, ...args: any[]): void;

  debug(obj: object, msg?: string, ...args: any[]): void;
  debug(msg: string, ...args: any[]): void;

  info(obj: object, msg?: string, ...args: any[]): void;
  info(msg: string, ...args: any[]): void;

  warn(obj: object, msg?: string, ...args: any[]): void;
  warn(msg: string, ...args: any[]): void;

  error(obj: object, msg?: string, ...args: any[]): void;
  error(msg: string, ...args: any[]): void;

  fatal(obj: object, msg?: string, ...args: any[]): void;
  fatal(msg: string, ...args: any[]): void;

  child(bindings: { [key: string]: any }): Logger;
  bindings(): { [key: string]: any };
  isLevelEnabled(level: string | number): boolean;
  flush(): void;
}

export interface Bindings {
  [key: string]: any;
}

export interface LogObject {
  level: number;
  time: number;
  msg?: string;
  [key: string]: any;
}

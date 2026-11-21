// Minimal ambient types for the Node built-ins these scripts use, so the editor checks them without
// @types/node installed. Node runs the .ts files directly with type stripping; this file is types only.

declare module 'node:fs' {
  export interface Stats {
    isFile(): boolean;
    isDirectory(): boolean;
    size: number;
  }
  export interface Dirent {
    name: string;
    isFile(): boolean;
    isDirectory(): boolean;
  }
  export function cpSync(src: string, dest: string, opts?: any): void;
  export function mkdirSync(path: string, opts?: any): string | undefined;
  export function mkdtempSync(prefix: string): string;
  export function rmSync(path: string, opts?: any): void;
  export function writeFileSync(path: string, data: string | Uint8Array): void;
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding?: any): any;
  export function readdirSync(path: string, opts?: any): any;
  export function statSync(path: string): Stats;
  export function lstatSync(path: string): Stats;
  export function createReadStream(path: string): any;
}

declare module 'node:http' {
  export function createServer(handler: (req: any, res: any) => void): any;
}

declare module 'node:path' {
  export function join(...parts: string[]): string;
  export function resolve(...parts: string[]): string;
  export function normalize(path: string): string;
  export function extname(path: string): string;
  export const sep: string;
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
}

declare module 'node:stream' {
  export const Readable: any;
}

declare module 'node:process' {
  const process: {
    env: Record<string, string | undefined>;
    argv: string[];
    cwd(): string;
    exit(code?: number): never;
  };
  export default process;
}

declare const process: {
  env: Record<string, string | undefined>;
  argv: string[];
  cwd(): string;
  exit(code?: number): never;
};

declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
};

declare var URL: {
  new (input: string, base?: string): URL;
  prototype: URL;
};
interface URL {
  pathname: string;
  hash: string;
  origin: string;
  search: string;
}

interface ImportMeta {
  url: string;
  dirname: string;
  filename: string;
}

interface ImportMetaEnv {
  readonly [key: string]: string | undefined;
}

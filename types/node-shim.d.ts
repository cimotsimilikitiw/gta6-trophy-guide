declare module 'node:fs' {
  export function cpSync(src: string, dest: string, opts?: any): void;
  export function mkdirSync(path: string, opts?: any): string | undefined;
  export function writeFileSync(path: string, data: string | Uint8Array): void;
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding?: any): any;
  export function statSync(path: string): { isFile(): boolean; size: number };
  export function createReadStream(path: string): any;
}
declare module 'node:http' {
  export function createServer(handler: (req: any, res: any) => void): any;
}
declare module 'node:path' {
  export function join(...parts: string[]): string;
  export function extname(path: string): string;
}
declare module 'node:url' {
  export function fileURLToPath(url: string): string;
}
declare module 'node:stream' {
  export const Readable: any;
}
declare const process: { env: Record<string, string | undefined>; argv: string[]; cwd(): string };
declare const console: { log(...args: any[]): void; error(...args: any[]): void };
interface URL { pathname: string }
declare var URL: { new (input: string, base?: string): URL };

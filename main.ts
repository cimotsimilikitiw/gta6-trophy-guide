// Hands this entry in: the guide is app/ (plain static files a browser opens at app/index.html, no build step,
// nothing fetched over the network), the captures are screenshots/, and the dossier is what the vendored
// make.fun library writes from both. Node 22, standard library only.
//
// Locally:   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Grader:    the same script with /output as MAKEFUN_OUTPUT_DIR's default.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Caps the scorer enforces. Passing them here means a bundle that would be refused fails loudly at build time
// instead of in the gate: 4 screenshots at most, 256 KiB each, 993 entries and 48 MiB of app/ files.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
} as const;

const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');
const outApp = join(out, 'app');
const outShots = join(out, 'screenshots');

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing: that page is the guide.');
if (!existsSync(shotsDir)) fail('screenshots/ is missing: the entry hands in 3 or 4 captures of the running app.');

const shotNames = readdirSync(shotsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
  .map((entry) => entry.name)
  .sort();
if (shotNames.length < 3) fail(`screenshots/ holds ${shotNames.length} images; the entry needs 3 or 4.`);
if (shotNames.length > CAPS.screenshots.max) fail(`screenshots/ holds ${shotNames.length} images, over the ${CAPS.screenshots.max} cap.`);
for (const name of shotNames) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > CAPS.screenshots.max_bytes) fail(`screenshots/${name} is ${size} bytes, over the ${CAPS.screenshots.max_bytes} cap.`);
}

// A fresh copy every run: out/ is the bundle, never a merge with a previous one.
rmSync(outApp, { recursive: true, force: true });
rmSync(outShots, { recursive: true, force: true });
rmSync(join(out, 'dossier.json'), { force: true });

mkdirSync(out, { recursive: true });
cpSync(appDir, outApp, { recursive: true });
mkdirSync(outShots, { recursive: true });
cpSync(shotsDir, outShots, { recursive: true });

writeFileSync(join(out, 'dossier.json'), buildDossier(out, CAPS));

const bytes = statSync(join(out, 'dossier.json')).size;
console.log(`main.ts: wrote ${out}/dossier.json (${bytes} bytes) with ${shotNames.length} screenshots: ${shotNames.join(', ')}`);

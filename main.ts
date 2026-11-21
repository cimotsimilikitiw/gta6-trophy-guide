// Build script for the GTA VI trophy guide.
// Produces a self-contained out/ directory with the static app, screenshots, and dossier.json.

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = import.meta.dirname;
const outDir = join(root, 'out');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });

// Copy the static app as-is.
cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });

// Copy captured screenshots into the bundle.
cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

// Build dossier.json with the kit's expected caps.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log('Wrote out/dossier.json');

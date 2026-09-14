import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const destDir = join(__dirname, 'data');
mkdirSync(destDir, { recursive: true });

const pairs = [
  ['assets/data/shelters.json', 'data/shelters.json'],
  ['assets/data/shelter-enrichment.json', 'data/shelter-enrichment.json'],
];

for (const [fromRel, toRel] of pairs) {
  const from = join(root, fromRel);
  const to = join(__dirname, toRel.replace(/^data\//, 'data/'));
  if (!existsSync(from)) {
    console.warn('skip missing', fromRel);
    continue;
  }
  copyFileSync(from, to);
  console.log('synced', toRel);
}

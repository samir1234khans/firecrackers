import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Preserve installed runtime packages' notices; do not license the owner's application.
const names = ['react', 'react-dom', 'three', 'lucide-react'];
for (const name of readdirSync('node_modules')) {
  if (name.startsWith('workbox-')) names.push(name);
}
const notices = ['Firecrackers: third-party notices', 'Application code licensing remains an owner decision.'];
for (const name of names) {
  const directory = join('node_modules', name);
  const metadata = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  const license = readdirSync(directory).find(file => /^licen[sc]e(?:\.[a-z]+)?$/i.test(file));
  if (!license || !existsSync(join(directory, license))) {
    throw new Error(`Required license text is missing for ${name}`);
  }
  notices.push(`\n${'='.repeat(72)}\n${name} ${metadata.version}\n${'='.repeat(72)}\n`);
  notices.push(readFileSync(join(directory, license), 'utf8'));
}
writeFileSync('public/THIRD_PARTY_NOTICES.txt', notices.join('\n\n') + '\n');

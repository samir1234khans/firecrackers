import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Preserve installed runtime packages' notices; do not license the owner's application.
const names = ['react', 'react-dom', 'three', 'lucide-react'];
for (const name of readdirSync('node_modules')) {
  if (name.startsWith('workbox-')) names.push(name);
}
const notices = ['Firecrackers: third-party notices', 'Application code licensing remains an owner decision.'];
notices.push([
  'Wooden Canoe — OuterSpaceSimon (2023), published through Blendkit.',
  'Source: https://www.blendkit.com/asset-gallery-detail/a6a39894-5474-47c4-a657-dc8b7a1a5a44/',
  'License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/',
  'Publisher license: https://www.blendkit.com/docs/licenses/',
  'Modified for Firecrackers: scaled riverboat forms and exported PBR materials; original canopy, candles and v008 scenery additions.',
  'Download receipt and modifications: assets-source/PROVENANCE.md, assets-source/blender/RIVER-V007.md and assets-source/blender/RIVER-V008.md.',
  'CC0 applies to the downloaded canoe and its adaptation. Original canopy, figures, bank scenery and terrace retain the owner\'s licensing decisions.',
].join('\n'));
notices.push("Lunar disc: NASA's Scientific Visualization Studio; Ernie Wright (USRA), Noah Petro (NASA/GSFC), LRO/LROC and LOLA instrument teams. Source: https://svs.gsfc.nasa.gov/4720/ . Adapted into a fixed gibbous disc with restrained relief. Download/processing receipt: assets-source/moon/PROVENANCE.md. NASA imagery usage: https://www.nasa.gov/nasa-brand-center/images-and-media/ . No NASA endorsement is implied.");
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

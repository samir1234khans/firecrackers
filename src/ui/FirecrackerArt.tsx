import { useId } from 'react';
import type { CSSProperties } from 'react';
import { FAMILIES, ROCKET_PROFILES, familyIndex } from '../engine/catalog';
import type { FamilyId } from '../engine/catalog';
import { FireworkGlyph } from './FireworkGlyph';
import '../styles/firecracker-art.css';

export type FirecrackerArtProps = {
  family: FamilyId;
  /** Optical square size. The original paper prop keeps its own aspect ratio. */
  size?: number | string;
  className?: string;
  label?: string;
  decorative?: boolean;
};

/** Bright ink preserves the owned catalogue's family hues, including its silver and gold entries. */
export const FIRECRACKER_ACCENTS = {
  'gold-willow': '#ffdd85',
  'multicolor-peony': '#ffacd1',
  'chrysanthemum': '#ffc082',
  'silver-crossette-crackle': '#d3f2ff',
  'grand-finale': '#e3c3ff',
  'aurora-crown': '#8affd6',
  'ruby-dahlia': '#ff9ebc',
  'sapphire-saturn': '#a5c8ff',
  'phoenix-palm': '#ffca92',
  'opal-supernova': '#dec5ff',
  'imperial-crown': '#ffe2ae',
  'celestial-aurora': '#bcdcff',
  'royal-phoenix': '#ffc29b',
} as const satisfies Record<FamilyId, string>;

/** Share the paper-label ink with a real catalogue name; no broad ambient glow is added. */
export function firecrackerAccentStyle(family: FamilyId): CSSProperties {
  return { '--spark-cracker-neon': FIRECRACKER_ACCENTS[family], '--spark-cracker-glow': `${FIRECRACKER_ACCENTS[family]}70` } as CSSProperties;
}

/** The owner's real thirteen effect silhouettes, paired with the physical prop by the parent UI. */
export function FireworkEffectArt({ family, size = 32, className = '', label, decorative = true }: FirecrackerArtProps) {
  const definition = FAMILIES[familyIndex(family)];
  return <span className={`spark-effect-art ${className}`} data-family={family} style={{ ...firecrackerAccentStyle(family), width: size, height: size }} aria-hidden={decorative ? true : undefined} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : label ?? `${definition.name}: ${definition.note}`}>
    <FireworkGlyph family={family} color={definition.color} />
  </span>;
}

const PRINTED_NAMES: Record<FamilyId, readonly string[]> = {
  'gold-willow': ['GOLD', 'WILLOW'],
  'multicolor-peony': ['MULTICOLOR', 'PEONY'],
  'chrysanthemum': ['CHRYSAN-', 'THEMUM'],
  'silver-crossette-crackle': ['SILVER', 'CROSSETTE', 'CRACKLE'],
  'grand-finale': ['GRAND', 'FINALE'],
  'aurora-crown': ['AURORA', 'CROWN'],
  'ruby-dahlia': ['RUBY', 'DAHLIA'],
  'sapphire-saturn': ['SAPPHIRE', 'SATURN'],
  'phoenix-palm': ['PHOENIX', 'PALM'],
  'opal-supernova': ['OPAL', 'SUPERNOVA'],
  'imperial-crown': ['IMPERIAL', 'CROWN'],
  'celestial-aurora': ['CELESTIAL', 'AURORA'],
  'royal-phoenix': ['ROYAL', 'PHOENIX'],
};

const TAU = Math.PI * 2;
const point = (angle: number, radius: number) => [Math.cos(angle) * radius, Math.sin(angle) * radius];

/** Original printed labels describe catalogue recipes, rather than substituting burst icons for props. */
function FamilyPrint({ family }: { family: FamilyId }) {
  const rays = (count: number, radius: number, color: string, tips?: string) => Array.from({ length: count }, (_, index) => {
    const [x, y] = point(index / count * TAU, radius);
    return <g key={index}><path d={`M0 0L${x} ${y}`} stroke={color} /><circle cx={x} cy={y} r={tips ? .95 : .65} fill={tips ?? color} stroke="none" /></g>;
  });
  return <g fill="none" strokeWidth=".78" strokeLinecap="round" strokeLinejoin="round">
    {family === 'gold-willow' && <>{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M0 -6Q${(i - 4) * 3.2} -8 ${(i - 4) * 2.1} ${8 - Math.abs(i - 4) * .7}`} stroke="#edca85" />)}<circle cy="-6" r="1" fill="#ffebbc" /></>}
    {family === 'multicolor-peony' && <>{rays(16, 9, '#e8bad4')}{Array.from({ length: 12 }, (_, i) => { const [x, y] = point(i / 12 * TAU, 8); return <circle key={i} cx={x} cy={y} r="1.05" fill={['#e991a7', '#eac784', '#90cbaf', '#83b6ec'][i % 4]} stroke="none" />; })}<circle r="3.8" stroke="#f0d6b5" /></>}
    {family === 'chrysanthemum' && <>{rays(16, 9.3, '#e5ac7c', '#e4888d')}{rays(8, 5.6, '#edcf99')}<circle r="1.25" fill="#f2dab0" /></>}
    {family === 'silver-crossette-crackle' && <>{[0, 90, 180, 270].map(angle => <g key={angle} transform={`rotate(${angle})`} stroke="#d4e3ec"><path d="M0 0V-5M0-5l-3-3m3 3 3-3m-3 3-3 3m3-3 3 3" /><circle cy="-5" r=".65" fill="#edf4f6" /></g>)}</>}
    {family === 'grand-finale' && <>{[[-4.8, -3.5], [4.2, -1.2], [.8, 5.4]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>{rays(9, i === 0 ? 5.4 : 4.1, ['#e4c287', '#e4a3b5', '#d4d9ef'][i])}</g>)}</>}
    {family === 'aurora-crown' && <><path d="M-10 5-8-5-4-1 0-9 4-1 8-5 10 5" stroke="#9bd9bd" /><path d="M-6 5Q0-10 6 5M-9 7Q0 3 9 7" stroke="#c5aedf" /><circle cy="1" r="1.3" fill="#c5aedf" /></>}
    {family === 'ruby-dahlia' && <>{Array.from({ length: 12 }, (_, i) => <path key={i} transform={`rotate(${i * 30})`} d="M0 0Q-3.5-4 0-10Q3.5-4 0 0Z" stroke={i % 2 ? '#ec9ab2' : '#d984a1'} />)}<circle r="2" fill="#eaca8d" /></>}
    {family === 'sapphire-saturn' && <><circle r="5.8" stroke="#9dbef3" />{rays(10, 5.6, '#8eafde')}<ellipse rx="11" ry="3.6" transform="rotate(-26)" stroke="#ecd19c" strokeWidth="1.2" /><circle r="1" fill="#bfd5ed" /></>}
    {family === 'phoenix-palm' && <>{Array.from({ length: 11 }, (_, i) => { const x = (i - 5) * 1.9, y = -7 + Math.abs(i - 5) * 1.4; return <g key={i}><path d={`M0 9Q${x * .45} -8 ${x} ${y}`} stroke="#e8b887" /><path d={`M${x} ${y}l-1.5-1.8m1.5 1.8 1.7-1.4`} stroke="#df9eae" /></g>; })}</>}
    {family === 'opal-supernova' && <>{Array.from({ length: 7 }, (_, i) => { const [x, y] = i === 6 ? [0, 0] : point(i / 6 * TAU, 7.1); return <g key={i} transform={`translate(${x} ${y})`} stroke={['#9dd2df', '#a7d7be', '#c4a9db', '#e2a0b8', '#e4c190', '#d8e2e6', '#c5b3df'][i]}><path d="M0-2.5 2.1 0 0 2.5-2.1 0Z" /><path d="M0-4v1m0 6v1M-4 0h1m6 0h1" /></g>; })}</>}
    {family === 'imperial-crown' && <><path d="M-9 5-10-4-5 0 0-8 5 0 10-4 9 5ZM-8 7H8M-6 5-4-2M0 5V-4M6 5 4-2" stroke="#efd5a6" strokeWidth="1.1" />{[-8, -4, 0, 4, 8].map(x => <path key={x} d={`M${x} 8q-4 4-2 7m2-7q4 4 2 7`} stroke="#d0ad75" strokeWidth=".6" />)}<circle cy="-1" r="1.4" fill="#a85457" stroke="none" /></>}
    {family === 'celestial-aurora' && <><path d="M-11-3Q-5-12 0-4T11-4M-11 1Q-5-8 0 0T11 0M-10 5Q-5-4 0 4T10 4" stroke="#b4d4e8" />{[-7, 7].map(x => <g key={x} transform={`translate(${x} 7)`}><path d="M0-3Q-5 0 0 3Q5 0 0-3ZM-3 0H3" stroke="#c8b6e2" /><circle r=".65" fill="#e3e7ee" /></g>)}</>}
    {family === 'royal-phoenix' && <>{Array.from({ length: 5 }, (_, i) => <g key={i}><path d={`M0 7Q${-8 - i} ${-1 - i * 1.3} ${-10 + i * 1.8} ${-7 + i * 2.1}`} stroke="#dfb28c" /><path d={`M0 7Q${7 + i} ${2 - i * 1.2} ${10 - i * 1.3} ${-3 + i * 1.7}`} stroke="#c88875" /></g>)}<path d="M0 8V-5" stroke="#efdbb8" /><circle cy="6" r="1.5" fill="#efdbb8" /></>}
  </g>;
}

/** SVG adaptation of the owner's RocketIcon/RocketProp, retaining all thirteen real profiles. */
export function FirecrackerArt({ family, size = 64, className = '', label, decorative = true }: FirecrackerArtProps) {
  const uid = `spark-cracker-${useId().replaceAll(':', '')}`;
  const index = familyIndex(family), definition = FAMILIES[index];
  const [radius, height] = ROCKET_PROFILES[index];
  const center = 25.4, width = 30 * radius, bodyHeight = 42 * height, x = center - width / 2, top = 22;
  const bottom = top + bodyHeight, capTop = top - (index === 4 ? 18.56 : 16);
  // The first ten share the coloured paper wrap from RocketIcon; the signatures retain
  // RocketProp's champagne, blue and copper paper stock. These are paper cases, not missiles.
  const caseTone = index >= 10 ? ['#c5ae81', '#203654', '#64272c'][index - 10] : definition.color;
  const accent = FIRECRACKER_ACCENTS[family], names = PRINTED_NAMES[family];
  const fuse = `M${x + width - .7} ${bottom - 1.7}C${x + width + 2.4} ${bottom + 2.2} ${x + width + 7.4} ${bottom + 2.8} ${x + width + 10.2} ${bottom + 8.4}`;
  const title = label ?? `${definition.name} firecracker`;
  return <svg className={`spark-cracker-art ${className}`} style={firecrackerAccentStyle(family)} data-family={family} data-art-version="paper-v2" data-profile={`${radius},${height}`} viewBox="0 0 56 92" width={size} height={size} fill="none" focusable="false" aria-hidden={decorative ? true : undefined} role={decorative ? undefined : 'img'} aria-labelledby={decorative ? undefined : `${uid}-title`}>
    {!decorative && <title id={`${uid}-title`}>{title}</title>}
    <defs>
      <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#111e2b" /><stop offset=".16" stopColor={caseTone} /><stop offset=".36" stopColor={caseTone} /><stop offset=".48" stopColor={accent} /><stop offset=".61" stopColor={caseTone} /><stop offset=".87" stopColor={caseTone} /><stop offset="1" stopColor="#18222e" /></linearGradient>
      <linearGradient id={`${uid}-cap`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#403c37" /><stop offset=".19" stopColor={definition.color} /><stop offset=".44" stopColor="#f3e1bc" /><stop offset=".52" stopColor="#fff3d6" /><stop offset=".65" stopColor={definition.color} /><stop offset="1" stopColor="#675943" /></linearGradient>
      <linearGradient id={`${uid}-foil`} gradientUnits="userSpaceOnUse" x1={x} y1={top} x2={x + width} y2={top}><stop stopColor="#6c624e" /><stop offset=".23" stopColor="#d9be88" /><stop offset=".45" stopColor="#fff0cb" /><stop offset=".65" stopColor="#dbc6a1" /><stop offset="1" stopColor="#7a6e53" /></linearGradient>
      {/* Fixed coordinates also paint the zero-width stick and zero-height foil strokes. */}
      <linearGradient id={`${uid}-wood`} gradientUnits="userSpaceOnUse" x1={x + 4.95} y1={top} x2={x + 8.05} y2={top}><stop stopColor="#735137" /><stop offset=".34" stopColor="#d6bb8d" /><stop offset=".6" stopColor="#b08b60" /><stop offset="1" stopColor="#72543b" /></linearGradient>
      <clipPath id={`${uid}-case`}><rect x={x} y={top} width={width} height={bodyHeight} rx="2.1" /></clipPath>
    </defs>
    <ellipse cx={center + 2} cy="89.5" rx={18 * radius} ry="1.3" fill="#02070c" opacity=".45" />
    <path d={`M${x + 6.5} ${top + 5}V88.3`} stroke={`url(#${uid}-wood)`} strokeWidth="3.1" strokeLinecap="square" />
    <path d={`M${x + 5.7} ${bottom + .5}V87.4m1.2-13.2v8.1`} stroke="#f0d7ab" strokeWidth=".5" opacity=".7" />
    <path d={fuse} stroke="#211e18" strokeWidth="2.3" strokeLinecap="round" />
    <path d={fuse} stroke="#c9b78c" strokeWidth="1.65" strokeLinecap="round" />
    <path d={fuse} stroke="#766345" strokeWidth=".65" strokeDasharray="1 1.6" strokeLinecap="round" />
    <path d={`M${x + width + 9.6} ${bottom + 7.6}l1.3 1.1`} stroke="#efe4bd" strokeWidth="1.5" strokeLinecap="square" />
    <rect x={x} y={top} width={width} height={bodyHeight} rx="2.1" fill={`url(#${uid}-paper)`} stroke={accent} strokeOpacity=".5" strokeWidth=".7" />
    <g clipPath={`url(#${uid}-case)`}>
      {/* Fine sweeping foil lines adapt the owner's original printed-paper wrap. */}
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${x - 2 + i * width / 6} ${top - 3}c-8 10 9 12 1 24s9 14 0 25`} stroke="#f2dfb5" strokeWidth=".65" opacity=".32" />)}
      {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${x + 1.5 + i * 3.9 % (width - 3)} ${top + 1 + i * 7.3 % (bodyHeight - 2)}l${i % 2 ? .8 : -.8} .6`} stroke={i % 3 ? '#fff2d6' : '#071522'} strokeWidth=".45" opacity=".25" />)}
      <path d={`M${x + 2.5} ${top + 1.5}v${bodyHeight - 3}`} stroke="#fff5dc" strokeWidth="1.1" opacity=".48" />
      <path d={`M${x + width - 2.5} ${top + 1}l-.55 ${bodyHeight - 2}`} stroke="#071724" strokeWidth=".75" opacity=".56" />
      <rect x={x + 4.2} y={top + 6.9} width={width - 8.4} height={bodyHeight - 12.4} rx="1.2" fill="#06121f" fillOpacity=".91" stroke={`url(#${uid}-foil)`} strokeWidth=".55" />
      <g transform={`translate(${center} ${top + 14.2})`}><circle r="6.75" fill="#132133" stroke={accent} strokeWidth=".5" strokeOpacity=".63" /><g transform="scale(.62)"><FamilyPrint family={family} /></g></g>
      {names.map((line, lineIndex) => <text key={line} className="spark-cracker-art-name" x={center} y={bottom - 6.3 - (names.length - 1 - lineIndex) * 6.2} textAnchor="middle" fontSize={names.length > 2 ? 5.4 : 6.2} fontWeight="700" letterSpacing=".13" fontFamily="'Noor Satoshi',Arial,sans-serif" textLength={Math.min(width - 10.6, line.length * 3.4)} lengthAdjust="spacingAndGlyphs">{line}</text>)}
      {[2.3, 4.55, bodyHeight - 4.35, bodyHeight - 2.1].map((y, i) => <path key={i} d={`M${x} ${top + y}h${width}`} stroke={`url(#${uid}-foil)`} strokeWidth={i % 2 ? 1.05 : 1.3} />)}
      {Array.from({ length: index + 1 }, (_, i) => <path key={i} d={`M${x + 4 + (i + .5) * (width - 8) / (index + 1)} ${bottom - 3.9}v1.3`} stroke="#543f28" strokeWidth=".48" opacity=".72" />)}
    </g>
    <ellipse cx={center} cy={bottom - .1} rx={width / 2 - .4} ry="1.35" fill="#3b3024" stroke="#dfcfa6" strokeWidth=".55" />
    <path d={`M${x - 1.9} ${top}L${center} ${capTop}l${width / 2 + 1.9} ${top - capTop}Z`} fill={`url(#${uid}-cap)`} stroke="#ead8b4" strokeOpacity=".7" strokeWidth=".65" />
    <path d={`M${center} ${capTop + 1}l${width * .12} ${top - capTop - 1}`} stroke="#fff7df" strokeWidth=".85" opacity=".85" />
    <path d={`M${center + .4} ${capTop + 2.2}l${width * .36} ${top - capTop - 2.2}`} stroke="#4c4140" strokeWidth=".6" opacity=".45" />
    <ellipse cx={center} cy={top + .2} rx={width / 2 + 1.9} ry="1.3" fill={`url(#${uid}-foil)`} stroke="#f6e5be" strokeWidth=".45" />
    <text x={center - 2.2} y={top - 3.4} textAnchor="middle" fill="#182536" stroke="#f2dcb9" strokeWidth=".12" paintOrder="stroke" fontSize="4.8" fontWeight="700" fontFamily="Arial,sans-serif">{String(index + 1).padStart(2, '0')}</text>
  </svg>;
}

export default FirecrackerArt;

import type { FamilyId } from '../engine/catalog';
const TAU = Math.PI * 2;
const point = (a: number, r: number, cx = 40, cy = 40) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];

/** Scalable catalog artwork: each symbol describes its simulated silhouette. */
export function GrandGlyph({ family, color, id }: { family: FamilyId; color: string; id: string }) {
    return <svg className='firework-glyph' viewBox='0 0 80 80' aria-hidden='true'>
        <defs><radialGradient id={`${id}-grand`}><stop stopColor={color} stopOpacity='.20'/><stop offset='1' stopColor={color} stopOpacity='0'/></radialGradient></defs>
        <circle cx='40' cy='40' r='37' fill={`url(#${id}-grand)`}/>
        {family === 'aurora-crown' && <>
            {Array.from({ length: 17 }, (_, i) => {
                const x = 10 + i * 3.75, y = 50 - Math.sin(i / 16 * Math.PI) * 31;
                return <path key={i} d={`M40 52 Q${x} 13 ${x} ${y + 15}`} fill='none' stroke={i % 3 ? '#76edc0' : '#bba0ff'} strokeWidth={i % 4 ? '1' : '1.5'}/>;
            })}
            <path d='M25 49 Q40 23 55 49' fill='none' stroke='#b99aff' strokeWidth='2'/>
        </>}
        {family === 'ruby-dahlia' && <>
            {Array.from({ length: 12 }, (_, i) => {
                const a = i / 12 * TAU, [x, y] = point(a, 29), [l, t] = point(a - .16, 20), [r, b] = point(a + .16, 20);
                return <path key={i} d={`M40 40 Q${l} ${t} ${x} ${y} Q${r} ${b} 40 40`} fill='none' stroke={i % 2 ? '#ff789f' : '#ec4694'} strokeWidth='1.3'/>;
            })}<circle cx='40' cy='40' r='5' fill='#ffdca0'/>
        </>}
        {family === 'sapphire-saturn' && <>
            {Array.from({ length: 20 }, (_, i) => {
                const a = i / 20 * TAU, [x, y] = point(a, 18);
                return <path key={i} d={`M40 40 L${x} ${y}`} stroke={i % 3 ? '#719dff' : '#b5eaff'} strokeWidth='1.2'/>;
            })}
            <ellipse cx='40' cy='40' rx='34' ry='11' transform='rotate(-24 40 40)' fill='none' stroke='#f7d9a4' strokeWidth='1.5' strokeDasharray='1.4 1.7'/>
        </>}
        {family === 'phoenix-palm' && <>
            {Array.from({ length: 11 }, (_, i) => {
                const x = 8 + i * 6.4, y = 25 + Math.abs(i - 5) * 4;
                return <g key={i}><path d={`M40 67 Q${40 + (x - 40) * .5} 10 ${x} ${y}`} fill='none' stroke='#ffbb71' strokeWidth={i % 2 ? '1.2' : '1.8'}/><path d={`M${x} ${y} l-3 -4 m3 4 l4 -3`} stroke='#ff7fa7' strokeWidth='1.2'/></g>;
            })}
        </>}
        {family === 'opal-supernova' && <>
            {['#93d9ff', '#77ecc3', '#cca0ff', '#ff8eaa', '#ffcb86', '#d0f0ff', '#e9bdff'].map((tone, i) => {
                const [cx, cy] = point(i / 7 * TAU, i === 6 ? 0 : 21);
                return <g key={tone}>{Array.from({ length: 9 }, (_, ray) => {
                    const [x, y] = point(ray / 9 * TAU, 12, cx, cy);
                    return <path key={ray} d={`M${cx} ${cy} L${x} ${y}`} stroke={tone} strokeWidth='1.1'/>;
                })}</g>;
            })}
        </>}
        <circle cx='40' cy={family === 'aurora-crown' ? '52' : family === 'phoenix-palm' ? '66' : '40'} r='1.7' fill='#fff4e4'/>
    </svg>;
}

import type { FamilyId } from '../engine/catalog';

/** Original marks describing the three choreographies at 32px artwork size. */
export function SignatureGlyph({ family }: { family: FamilyId }) {
  return <svg className='grand-glyph' viewBox='0 0 80 80' aria-hidden='true' fill='none'>
    {family === 'imperial-crown' && <>
      {Array.from({length: 18}, (_, i) => { const a = i * Math.PI * 2 / 18, x = 40 + Math.cos(a) * 31, y = 36 + Math.sin(a) * 28;
        return <path key={i} d={`M40 36 Q${x} ${y-7} ${x} ${y+12}`} stroke={i%3 ? '#e7c28b' : '#fff0d3'} strokeWidth='1.4'/>; })}
      <path d='M22 43 L19 27 L31 35 L40 19 L49 35 L61 27 L58 43 Z' stroke='#fff0d3' strokeWidth='2'/>
      <circle cx='40' cy='40' r='3' fill='#a34247'/>
    </>}
    {family === 'celestial-aurora' && <>
      {[0,1,2].map(i => <ellipse key={i} cx='40' cy='39' rx={30-i*4} ry={15+i*5} transform={`rotate(${i*57+15} 40 39)`} stroke={['#a9d6ee','#8d8bc4','#71baaa'][i]} strokeWidth='1.6' strokeDasharray={i ? '18 3 5 3' : undefined}/>)}
      {[-1,1].map(s => <path key={s} d={`M${40+s*25} 24 l-4 -4 m4 4 l4 -3 m-4 3 l-3 5`} stroke='#d8eaf3' strokeWidth='1.3'/>)}
      <circle cx='40' cy='39' r='3' fill='#d8eaf3'/>
    </>}
    {family === 'royal-phoenix' && <>
      {[0,1,2,3,4,5].map(i => <g key={i}>
        <path d={`M40 58 Q${14-i*2} ${42-i*4} ${8+i*3} ${18+i*5}`} stroke={i%2 ? '#d89358' : '#f0c691'} strokeWidth='1.7'/>
        <path d={`M40 58 Q${65+i} ${42-i*3} ${68-i*2} ${25+i*5}`} stroke='#cc7254' strokeWidth='1.6'/>
      </g>)}
      <path d='M40 61 L40 29' stroke='#f6dbc0'/><circle cx='40' cy='56' r='3' fill='#f6dbc0'/>
    </>}
  </svg>;
}

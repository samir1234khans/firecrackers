import { useId } from 'react';
import type { FamilyId } from '../engine/catalog';

type Props = { family: FamilyId; color: string };

const rayAngles = Array.from({ length: 18 }, (_, index) => index * 20);
const shortAngles = Array.from({ length: 12 }, (_, index) => index * 30 + 15);

function Radial({ color, dense = false }: { color: string; dense?: boolean }) {
  const angles = dense ? rayAngles : shortAngles;
  return <>{angles.map((angle, index) => <g key={angle} transform={`rotate(${angle} 40 40)`}>
    <path d={dense ? 'M40 38 C40 30 40 20 40 9' : 'M40 38 C40 31 40 23 40 14'} stroke={color} strokeWidth={index % 3 === 0 ? 1.35 : .85} strokeLinecap='round' opacity={dense ? .82 : .75}/>
    <circle cx='40' cy={dense ? 8 : 13} r={index % 4 === 0 ? 1.3 : .8} fill={color} opacity='.9'/>
  </g>)}</>;
}

export function FireworkGlyph({ family, color }: Props) {
  const id = useId().replaceAll(':', '');
  return <svg className='firework-glyph' viewBox='0 0 80 80' aria-hidden='true'>
    <defs>
      <radialGradient id={`${id}g`}>
        <stop stopColor={color} stopOpacity='.52'/>
        <stop offset='.42' stopColor={color} stopOpacity='.08'/>
        <stop offset='1' stopColor={color} stopOpacity='0'/>
      </radialGradient>
      <filter id={`${id}b`} x='-50%' y='-50%' width='200%' height='200%'>
        <feGaussianBlur stdDeviation='1.2'/>
      </filter>
    </defs>
    <circle cx='40' cy='40' r='31' fill={`url(#${id}g)`}/>
    {family === 'gold-willow' && <>
      {Array.from({ length: 14 }, (_, index) => {
        const x = 14 + index * 4;
        const bend = index % 2 ? 5 : -4;
        return <path key={index} d={`M40 36 Q${x + bend} ${39 + Math.abs(index - 7) * .7} ${x} ${67 - Math.abs(index - 7) * 1.4}`} fill='none' stroke={color} strokeWidth={index % 3 === 0 ? 1.5 : .9} strokeLinecap='round' opacity={.55 + (index % 4) * .08}/>;
      })}
      <circle cx='40' cy='35' r='2.2' fill='#fff4ce'/><circle cx='40' cy='35' r='8' fill={color} opacity='.15' filter={`url(#${id}b)`}/>
    </>}
    {family === 'multicolor-peony' && <>
      {shortAngles.map((angle, index) => {
        const palette = ['#ff6868', '#ffd56e', '#68e4a4', '#77b9ff', '#b686ff'];
        const tone = palette[index % palette.length];
        return <g key={angle} transform={`rotate(${angle} 40 40)`}><path d='M40 38 L40 14' stroke={tone} strokeWidth='1.05' strokeLinecap='round'/><circle cx='40' cy='13' r='1.5' fill={tone}/></g>;
      })}
      <circle cx='40' cy='39' r='2' fill='#fff8e7'/>
    </>}
    {family === 'chrysanthemum' && <><Radial color={color} dense/><Radial color='#ffd69a'/><circle cx='40' cy='39' r='2.4' fill='#fff1c8'/></>}
    {family === 'silver-crossette-crackle' && <>
      {[0, 45, 90, 135].map(angle => <g key={angle} transform={`rotate(${angle} 40 40)`}>
        <path d='M40 39 L40 16' stroke='#e8f4ff' strokeWidth='1.35'/>
        <path d='M40 18 L34 10 M40 18 L46 10' stroke={color} strokeWidth='1.05' strokeLinecap='round'/>
        <circle cx='34' cy='9' r='1.1' fill='#fff'/><circle cx='46' cy='9' r='1.1' fill='#fff'/>
      </g>)}
      {shortAngles.filter((_, index) => index % 2 === 0).map((angle, index) => <circle key={angle} cx={40 + Math.cos(angle * Math.PI / 180) * (22 + index % 2 * 5)} cy={40 + Math.sin(angle * Math.PI / 180) * (22 + index % 2 * 5)} r='.8' fill='#dff4ff' opacity='.72'/>)}
      <circle cx='40' cy='39' r='2.2' fill='#fff'/>
    </>}
    {family === 'grand-finale' && <>
      <g transform='translate(-11 -4) scale(.76)'><Radial color='#ffc96e' dense/></g>
      <g transform='translate(20 3) scale(.64)'><Radial color='#f28c9d'/></g>
      <g transform='translate(2 24) scale(.52)'><Radial color='#d8e8ff'/></g>
      <circle cx='40' cy='41' r='3' fill='#fff4cc'/>
    </>}
  </svg>;
}

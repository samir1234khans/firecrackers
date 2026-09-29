import { useId } from 'react';
export function RocketIcon({color,index}:{color:string;index:number}) {
  const id=useId().replaceAll(':','');
  return <svg className='rocket-icon' viewBox='0 0 44 68' aria-hidden='true'>
    <defs><linearGradient id={id} x1='0' x2='1'><stop stopColor='#12151c'/><stop offset='.34' stopColor={color}/><stop offset='.62' stopColor={color}/><stop offset='1' stopColor='#29232a'/></linearGradient><linearGradient id={`${id}n`} x1='0' x2='1'><stop stopColor='#423836'/><stop offset='.42' stopColor='#e2ceb0'/><stop offset='1' stopColor='#786757'/></linearGradient></defs>
    <ellipse cx='23' cy='65' rx='12' ry='1.5' fill='#000' opacity='.35'/><path d='M19 36v28' stroke='#8f7659' strokeWidth='1.8'/>
    <rect x='13' y='21' width='18' height='27' rx='2' fill={`url(#${id})`}/><path d='M11 22L22 5l11 17z' fill={`url(#${id}n)`}/>
    <path d='M15 24v20' stroke='#fff' opacity='.15'/><path d='M13 43h18' stroke='#d7c7a8' strokeWidth='2'/>
    {Array.from({length:index+1},(_,i)=><path key={i} d={`M${17+i*2.5} 31v6`} stroke='#f3dfb8' opacity='.6' strokeWidth='.7'/>)}
    <path d='M30 44q7 0 7 7' stroke='#b8a16f' fill='none' strokeWidth='1.1'/>
  </svg>;
}

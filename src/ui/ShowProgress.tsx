import { EyeOff, Play, Square } from 'lucide-react';
import { formatDuration } from '../experience/ShowRecipe';
import type { Simulation } from '../engine/Simulation';
type State=ReturnType<Simulation['snapshot']>;
/** The supplied snapshot is already throttled by useWorld; no timer or live-region tick. */
export function ShowProgress({state,onHide,onReplay,onCreate,onAlways,onStop}:{state:State;onHide:()=>void;onReplay:()=>void;onCreate:()=>void;onAlways:()=>void;onStop:()=>void}){
  const p=state.personal,personal=['playing','falling','complete','blocked'].includes(p.status);
  const done=personal?p.status==='complete':state.showTiming.complete;
  const blocked=personal&&p.status==='blocked';
  if(!personal&&!state.show&&!done)return null;
  const finite=personal||state.show==='finale'||done;
  const elapsed=personal?p.elapsed:state.showTiming.elapsed;
  const duration=personal?p.estimate:state.showTiming.duration??0;
  const title=personal?p.name:state.show==='always'?'Always Play':state.show==='festival'?'Festival':state.show==='calm'?'Calm':'Finale';
  const phase=personal?(p.status==='falling'?'Final sparks':p.phase):state.show==='finale'?(elapsed<10?'Opening':elapsed<23?'Build-up':'Finale'):state.show?'Continuous display':'Final sparks';
  return <section className={`show-progress${done||blocked?' is-ended':''}`} data-stage-control aria-label='Current show'>
    <div className='show-progress-heading'><strong>{done?'Night complete':blocked?'Show needs attention':title}</strong><button type='button' className='studio-icon' aria-label='Hide show progress' onClick={onHide}><EyeOff size={15}/></button></div>
    {!done&&!blocked&&<><p>{phase} · {formatDuration(elapsed)}{finite?` / about ${formatDuration(duration)}`:' · continues until stopped'}</p>{finite&&<progress aria-label='Show progress' max={Math.max(1,duration)} value={Math.min(duration,elapsed)}/>}<button type='button' className='text-button' onClick={onStop}><Square size={13}/>Stop future cues</button></>}
    {blocked&&<p>{p.reason}</p>}
    {(done||blocked)&&<div className='encore-actions'><button type='button' className='secondary-button' onClick={onReplay}><Play size={14}/>Replay</button><button type='button' className='text-button' onClick={onCreate}>Another night</button>{done&&<button type='button' className='text-button' onClick={onAlways}>Continue with Always Play</button>}</div>}
  </section>;
}

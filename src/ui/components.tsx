import React from 'react';

export function Icon({name,size=20}:{name:string;size?:number}){
  const paths:Record<string,React.ReactNode>={
    sound:<g><path d='M11 5 6 9H3v6h3l5 4V5Z'/><path d='M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14'/></g>,
    muted:<g><path d='M11 5 6 9H3v6h3l5 4V5Z'/><path d='m16 9 5 6m0-6-5 6'/></g>,
    expand:<path d='M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'/>,
    settings:<g><path d='M4 7h16M4 17h16'/><circle cx='9' cy='7' r='3'/><circle cx='15' cy='17' r='3'/></g>,
    pause:<g><path d='M8 5v14M16 5v14' strokeWidth='3'/></g>,
    play:<path d='m8 4 12 8-12 8V4Z'/>,
    close:<path d='m6 6 12 12M6 18 18 6'/>,
    spark:<g><path d='M12 2v5m0 10v5M2 12h5m10 0h5M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3'/><circle cx='12' cy='12' r='2'/></g>,
    stop:<rect x='6' y='6' width='12' height='12' rx='2'/>,
    eye:<g><path d='M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z'/><circle cx='12' cy='12' r='3'/></g>,
    help:<g><circle cx='12' cy='12' r='9'/><path d='M9.5 8a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4M12 16h.01'/></g>,
    flame:<path d='M12 2c1 5 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 0 4 3 4 3 1V2Z'/>,
    down:<path d='m7 10 5 5 5-5'/>,
    install:<g><path d='M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5'/></g>,
  };
  return <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>{paths[name]||paths.spark}</svg>;
}

export function RocketArt({family,small=false}:{family:string;small?:boolean}){
  const index=['gold-willow','multicolor-peony','chrysanthemum','silver-crossette-crackle','grand-finale'].indexOf(family);
  return <span className={`rocket-art rocket-${index}${small?' small':''}`} aria-hidden='true'>
    <span className='rocket-stick'/><span className='rocket-body'><span className='rocket-band top'/><span className='rocket-mark'><Icon name={index===4?'spark':'flame'} size={small?11:16}/></span><span className='rocket-band bottom'/></span><span className='rocket-cap'/><span className='rocket-fuse'/><span className='fuse-spark'/>
  </span>;
}

type ModalProps={title:string;children:React.ReactNode;onClose:()=>void;className?:string};
export class Modal extends React.Component<ModalProps>{
  panel:HTMLDivElement|null=null;
  previous:HTMLElement|null=null;
  componentDidMount(){this.previous=document.activeElement as HTMLElement;this.panel?.querySelector<HTMLElement>('[data-autofocus], button, input, select')?.focus();}
  componentWillUnmount(){if(this.previous?.isConnected)this.previous.focus();}
  trap=(e:React.KeyboardEvent)=>{
    if(e.key==='Escape'){e.stopPropagation();this.props.onClose();return;}
    if(e.key!=='Tab'||!this.panel)return;
    const elements=Array.from(this.panel.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]'));
    const first=elements[0],last=elements[elements.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  };
  render(){return <div className='modal-backdrop' onMouseDown={e=>{if(e.target===e.currentTarget)this.props.onClose();}}>
    <div className={`modal glass ${this.props.className||''}`} role='dialog' aria-modal='true' aria-label={this.props.title} ref={el=>{this.panel=el;}} onKeyDown={this.trap}>
      <button className='icon-button modal-close' aria-label='Close dialog' onClick={this.props.onClose}><Icon name='close'/></button>{this.props.children}
    </div>
  </div>;}
}

export function Toggle({label,description,checked,onChange,disabled=false}:{label:string;description?:string;checked:boolean;onChange:(checked:boolean)=>void;disabled?:boolean}){
  return <label className='setting-row'><span><span className='setting-label'>{label}</span>{description&&<span className='setting-note'>{description}</span>}</span><input type='checkbox' role='switch' checked={checked} disabled={disabled} onChange={e=>onChange(e.target.checked)}/><span className='switch-track' aria-hidden='true'/></label>;
}

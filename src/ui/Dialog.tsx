import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
export function Dialog({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null),close=useRef(onClose);close.current=onClose;
  useEffect(()=> {
    const previous=document.activeElement as HTMLElement|null,dialog=ref.current;
    dialog?.showModal();const cancel=(event:Event)=>{event.preventDefault();close.current();};
    dialog?.addEventListener('cancel',cancel);
    return ()=>{dialog?.removeEventListener('cancel',cancel);dialog?.close();previous?.focus();};
  },[]);
  return <dialog ref={ref} className='sheet' aria-labelledby='sheet-title' onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)onClose();}}}>
    <div className='sheet-heading'><h2 id='sheet-title'>{title}</h2><button className='icon-button' aria-label='Close panel' onClick={onClose}><X size={20}/></button></div>{children}
  </dialog>;
}
export function Toggle({label,detail,checked,onChange,disabled=false}:{label:string;detail?:string;checked:boolean;onChange:(value:boolean)=>void;disabled?:boolean}) {
  return <label className={`setting-row${disabled?' unavailable':''}`}><span><span className='setting-label'>{label}</span>{detail&&<small>{detail}</small>}</span><input className='switch' type='checkbox' checked={checked} disabled={disabled} onChange={event=>onChange(event.target.checked)}/></label>;
}

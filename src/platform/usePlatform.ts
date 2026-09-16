import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
type InstallEvent=Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
type WakeToken={release:()=>Promise<void>;addEventListener:(name:string,fn:()=>void)=>void};
export function usePlatform(notice:(text:string)=>void) {
  const [offline,setOffline]=useState(false),[updateReady,setUpdateReady]=useState(false);
  const [fullscreen,setFullscreen]=useState(false),[awake,setAwake]=useState(false),[installable,setInstallable]=useState(false);
  const wake=useRef<WakeToken|null>(null),install=useRef<InstallEvent|null>(null),update=useRef<((reload?:boolean)=>Promise<void>)|null>(null);
  const releaseWake=useCallback(()=> { const token=wake.current; wake.current=null; setAwake(false); void token?.release().catch(()=>{}); },[]);
  useEffect(()=> {
    if('serviceWorker' in navigator) {
      update.current=registerSW({immediate:true,onOfflineReady:()=>setOffline(true),onNeedRefresh:()=>setUpdateReady(true),onRegisteredSW:(_url,registration)=>{
        if(registration?.active) void navigator.serviceWorker.ready.then(async()=>{
          try {const keys=await caches.keys();if(keys.some(k=>k.includes('precache'))) setOffline(true);} catch {}
        });
      },onRegisterError:()=>notice('Offline storage is unavailable. The online app still works.')});
    }
    const onInstall=(event:Event)=>{event.preventDefault();install.current=event as InstallEvent;setInstallable(true);};
    const onFullscreen=()=>setFullscreen(Boolean(document.fullscreenElement));
    const onHidden=()=>{if(document.hidden) releaseWake();};
    window.addEventListener('beforeinstallprompt',onInstall);document.addEventListener('fullscreenchange',onFullscreen);document.addEventListener('visibilitychange',onHidden);
    return ()=>{window.removeEventListener('beforeinstallprompt',onInstall);document.removeEventListener('fullscreenchange',onFullscreen);document.removeEventListener('visibilitychange',onHidden);releaseWake();};
  },[notice,releaseWake]);
  const toggleFullscreen=async()=>{
    try { if(document.fullscreenElement) await document.exitFullscreen(); else if(document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else notice('This browser uses the full window. Add to Home Screen for an app-like view.'); }
    catch {notice('Fullscreen was not available. You can keep using this window.');}
  };
  const toggleWake=async()=>{
    if(awake) {releaseWake();return;}
    try {
      const api=(navigator as unknown as {wakeLock?:{request:(type:string)=>Promise<WakeToken>}}).wakeLock;
      if(!api) {notice('Keep-awake is not supported in this browser.');return;}
      const token=await api.request('screen'); wake.current=token;setAwake(true);
      token.addEventListener('release',()=>{if(wake.current===token){wake.current=null;setAwake(false);}});
    } catch {notice('The screen could not be kept awake. Check your device power settings.');}
  };
  const installApp=async()=>{
    if(!install.current) {notice('Open your browser menu and choose Install app or Add to Home Screen, when available.');return;}
    try {await install.current.prompt();await install.current.userChoice;install.current=null;setInstallable(false);} catch {notice('Installation was not completed. The website remains available.');}
  };
  return {offline,updateReady,fullscreen,awake,installable,toggleFullscreen,toggleWake,releaseWake,installApp,applyUpdate:()=>update.current?.(true)};
}

import React from 'react';
import { CATALOG, FAMILY, clamp } from './engine/core.js';
import { Experience } from './engine/experience.js';
import { loadPreferences, savePreferences, toggleFullscreen } from './platform/preferences.js';
import { Icon, RocketArt, Modal, Toggle } from './ui/components';

type Preferences=ReturnType<typeof loadPreferences>;
type Snapshot={time:number;quality:string;units:number;maxUnits:number;active:number;stars:number;trails:number;smoke:number;show:boolean;mode:string;launched:number;completed:number;paused:boolean;backend:string;fps:number};
type State={prefs:Preferences;ready:boolean;error:string;help:boolean;settings:boolean;controls:boolean;sound:boolean;paused:boolean;placement:number;holding:boolean;igniting:boolean;armed:boolean;display:boolean;message:string;lastLaunch:string;fullscreen:boolean;installable:boolean;offline:boolean;update:boolean;snapshot:Snapshot};
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
const EMPTY:Snapshot={time:0,quality:'standard',units:0,maxUnits:6,active:0,stars:0,trails:0,smoke:0,show:false,mode:'festival',launched:0,completed:0,paused:false,backend:'Starting',fps:0};

export default class App extends React.Component<Record<string,never>,State>{
  host:HTMLDivElement|null=null;
  root:HTMLDivElement|null=null;
  rocketButton:HTMLButtonElement|null=null;
  controller:Experience|null=null;
  alive=false;
  holdTimer:ReturnType<typeof setTimeout>|null=null;
  idleTimer:ReturnType<typeof setTimeout>|null=null;
  armTimer:ReturnType<typeof setTimeout>|null=null;
  pointer:{id:number;x:number;y:number;dragged:boolean}|null=null;
  ignoreClickUntil=0;
  pendingId:number|null=null;
  lastInputWasKeyboard=false;
  installEvent:InstallEvent|null=null;
  constructor(props:Record<string,never>){
    super(props);
    const prefs=loadPreferences();
    this.state={prefs,ready:false,error:'',help:!prefs.onboarded,settings:false,controls:true,sound:false,paused:false,placement:.5,holding:false,igniting:false,armed:false,display:false,message:'Choose a rocket. Make the night your own.',lastLaunch:'',fullscreen:false,installable:false,offline:false,update:false,snapshot:EMPTY};
  }
  componentDidMount(){
    this.alive=true;
    if(this.host){
      this.controller=new Experience(this.host,{preferences:this.state.prefs,onSnapshot:this.onSnapshot,onEvent:this.onEvent,onError:this.onError});
      const forced=new URLSearchParams(location.search).get('renderer');
      void this.controller.initialize(forced&&['webgl','webgpu','canvas'].includes(forced)?forced:'auto');
    }
    this.rocketButton?.addEventListener('pointerdown',this.pointerDown);
    window.addEventListener('pointermove',this.pointerMove);
    window.addEventListener('pointerup',this.pointerUp);
    window.addEventListener('pointercancel',this.pointerUp);
    window.addEventListener('keydown',this.shortcut);
    window.addEventListener('blur',this.cancelHold);
    window.addEventListener('beforeinstallprompt',this.onInstallPrompt);
    window.addEventListener('firecrackers:offline',this.onOffline);
    window.addEventListener('firecrackers:update',this.onUpdate);
    document.addEventListener('fullscreenchange',this.onFullscreen);
  }
  componentWillUnmount(){
    this.alive=false;this.controller?.dispose();this.cancelTimers();
    this.rocketButton?.removeEventListener('pointerdown',this.pointerDown);
    window.removeEventListener('pointermove',this.pointerMove);window.removeEventListener('pointerup',this.pointerUp);window.removeEventListener('pointercancel',this.pointerUp);
    window.removeEventListener('keydown',this.shortcut);window.removeEventListener('blur',this.cancelHold);
    window.removeEventListener('beforeinstallprompt',this.onInstallPrompt);window.removeEventListener('firecrackers:offline',this.onOffline);window.removeEventListener('firecrackers:update',this.onUpdate);
    document.removeEventListener('fullscreenchange',this.onFullscreen);
  }
  cancelTimers(){if(this.holdTimer)clearTimeout(this.holdTimer);if(this.idleTimer)clearTimeout(this.idleTimer);if(this.armTimer)clearTimeout(this.armTimer);}
  onSnapshot=(snapshot:Snapshot)=>{if(this.alive)this.setState({snapshot,ready:snapshot.backend!=='Starting',paused:snapshot.paused});};
  onError=(message:string)=>{if(this.alive){this.cancelHold();this.setState({error:message,controls:true,paused:true});}};
  onEvent=(event:{type:string;fireworkId?:number;family?:string})=>{
    if(!this.alive)return;
    if(event.type==='launch.started'&&event.fireworkId===this.pendingId){
      this.pendingId=null;
      const name=FAMILY[event.family||'']?.name||'Your firework';
      this.setState({igniting:false,lastLaunch:name,message:`${name} launched. Look up.`},this.scheduleHide);
    }else if(event.type==='show.settled'){
      this.preferences({mode:'festival'});this.setState({message:'The finale settles into a festival night.'});
    }else if(event.type==='visibility.paused'){
      this.cancelHold();this.setState({controls:true,message:'Paused while you were away. Resume when you are ready.'});
    }
  };
  onOffline=()=>this.alive&&this.setState({offline:true});
  onUpdate=()=>this.alive&&this.setState({update:true});
  onFullscreen=()=>this.alive&&this.setState({fullscreen:!!document.fullscreenElement});
  onInstallPrompt=(event:Event)=>{event.preventDefault();this.installEvent=event as InstallEvent;if(this.alive)this.setState({installable:true});};
  preferences=(patch:Partial<Preferences>)=>{
    this.setState(state=>({prefs:{...state.prefs,...patch}}),()=>{
      const p=this.state.prefs;
      if(!savePreferences(p))this.setState({message:'Preferences are saved for this session only; browser storage is unavailable.'});
      this.controller?.applyPreferences(p);
      if(patch.keepAwake!==undefined)void this.controller?.wake.set(p.keepAwake).then(result=>{if(this.alive&&!result.ok&&result.reason)this.setState({message:result.reason});});
    });
  };
  reveal=()=>{if(!this.state.controls)this.setState({controls:true});this.scheduleHide();};
  scheduleHide=()=>{
    if(this.idleTimer)clearTimeout(this.idleTimer);
    this.idleTimer=setTimeout(()=>{
      if(!this.alive||this.state.help||this.state.settings||this.state.holding||this.state.armed||this.state.igniting||this.state.paused||this.state.error)return;
      if(this.lastInputWasKeyboard&&document.activeElement!==document.body)return;
      if(this.state.snapshot.show||this.state.lastLaunch||this.state.display)this.setState({controls:false});
    },3200);
  };
  enter=()=>{this.preferences({onboarded:true});this.setState({help:false,controls:true});};
  select=(id:string)=>{
    if(this.state.igniting)return;
    this.cancelHold();this.preferences({selected:id});this.setState({armed:false,message:FAMILY[id].note,controls:true});this.scheduleHide();
  };
  canIgnite(){const s=this.state;return s.ready&&!s.help&&!s.settings&&!s.paused&&!s.error&&!s.igniting&&s.snapshot.units+FAMILY[s.prefs.selected].cost<=s.snapshot.maxUnits;}
  pointerDown=(event:PointerEvent)=>{
    if(event.button!==0||!this.canIgnite())return;
    event.preventDefault();this.lastInputWasKeyboard=false;
    this.pointer={id:event.pointerId,x:event.clientX,y:event.clientY,dragged:false};
    this.rocketButton?.setPointerCapture(event.pointerId);
    if(!this.state.prefs.tapIgnition)this.beginHold();
  };
  pointerMove=(event:PointerEvent)=>{
    if(!this.pointer||this.pointer.id!==event.pointerId)return;
    if(Math.hypot(event.clientX-this.pointer.x,event.clientY-this.pointer.y)>12)this.pointer.dragged=true;
    if(this.pointer.dragged&&!this.state.igniting){this.cancelHold();this.setState({placement:clamp(event.clientX/window.innerWidth,.18,.82),message:'Placed. Hold the rocket to light its fuse.'});this.ignoreClickUntil=performance.now()+500;}
  };
  pointerUp=(event:PointerEvent)=>{if(this.pointer?.id===event.pointerId){const dragged=this.pointer.dragged;this.cancelHold();this.pointer=null;this.ignoreClickUntil=dragged||!this.state.prefs.tapIgnition?performance.now()+400:0;}};
  beginHold=()=>{
    if(!this.canIgnite())return;
    this.cancelHold();this.setState({holding:true,armed:false,controls:true});
    void this.controller?.audio.unlock();
    this.holdTimer=setTimeout(this.ignite,560);
  };
  cancelHold=()=>{
    if(this.holdTimer)clearTimeout(this.holdTimer);this.holdTimer=null;
    if(this.alive&&this.state.holding)this.setState({holding:false});
  };
  ignite=()=>{
    this.cancelHold();
    if(!this.canIgnite()||!this.controller)return;
    const result=this.controller.sim.ignite(this.state.prefs.selected,this.state.placement,'manual');
    if(result.accepted){
      this.pendingId=result.id||null;
      this.setState({igniting:true,armed:false,message:'Fuse lit. Stand back and enjoy the sky.',controls:true});
      this.controller.publish();
    }else this.setState({message:result.reason||'The sky is busy. Give this burst a moment.'});
  };
  tapLight=()=>{
    if(!this.canIgnite())return;
    if(this.state.armed){void this.controller?.audio.unlock();this.ignite();}
    else{this.setState({armed:true,message:'Press again to light. Escape cancels.'});if(this.armTimer)clearTimeout(this.armTimer);this.armTimer=setTimeout(()=>this.alive&&this.setState({armed:false}),5000);}
  };
  rocketKeyDown=(event:React.KeyboardEvent)=>{
    this.lastInputWasKeyboard=true;
    if(event.key===' '){event.preventDefault();if(!event.repeat&&!this.state.prefs.tapIgnition)this.beginHold();else if(!event.repeat)this.tapLight();}
    if(event.key==='Enter'){event.preventDefault();if(!event.repeat)this.tapLight();}
  };
  toggleSound=async()=>{
    const sound=!this.state.sound;
    if(!sound){this.controller?.audio.setPreferences({enabled:false});this.setState({sound:false});return;}
    if(!this.controller)return;
    this.controller.audio.setPreferences({enabled:true});
    const available=await this.controller.audio.unlock();
    if(!this.alive)return;
    if(!available)this.controller.audio.setPreferences({enabled:false});
    this.setState({sound:available,message:available?'Sound on. Start with a comfortable volume.':'Sound could not start. The visual show is still available.'});
  };
  toggleShow=async()=>{
    if(!this.controller||!this.state.ready||this.state.error)return;
    this.cancelHold();
    if(this.state.snapshot.show){this.controller.sim.stopShow();this.setState({display:false,message:'Auto show stopped. The last embers will fade.'});}
    else{
      if(this.state.paused)await this.controller.resume();
      this.controller.sim.startShow(this.state.prefs.mode);
      if(this.state.prefs.keepAwake)void this.controller.wake.set(true);
      this.setState({message:'Your show is starting. Light a rocket any time to take the lead.'});
    }
    this.controller.publish();this.reveal();
  };
  togglePause=()=>{this.cancelHold();if(this.state.paused)void this.controller?.resume();else this.controller?.pause();this.setState({controls:true});};
  fullscreen=async()=>{if(!this.root)return;const result=await toggleFullscreen(this.root);if(!result.ok&&this.alive)this.setState({message:result.reason||'Fullscreen is unavailable.'});};
  display=()=>{if(!this.state.snapshot.show)void this.toggleShow();this.setState({display:!this.state.display,controls:true},this.scheduleHide);};
  shortcut=(event:KeyboardEvent)=>{
    if(event.defaultPrevented||event.ctrlKey||event.altKey||event.metaKey)return;
    this.lastInputWasKeyboard=true;
    if(this.state.help||this.state.settings)return;
    const target=event.target as HTMLElement;
    if(['INPUT','SELECT','TEXTAREA'].includes(target.tagName))return;
    const key=event.key.toLowerCase();
    if(key==='escape'){this.cancelHold();this.controller?.pause();this.setState({display:false,armed:false,controls:true,message:'Paused. Resume when you are ready.'});return;}
    if(event.repeat)return;
    if(/^[1-5]$/.test(key)){this.select(CATALOG[Number(key)-1].id);return;}
    if(['m','f','a','p','h'].includes(key)){event.preventDefault();this.reveal();}
    if(key==='m')void this.toggleSound();if(key==='f')void this.fullscreen();if(key==='a')void this.toggleShow();if(key==='p')this.togglePause();if(key==='h')this.setState({help:true,controls:true});
  };
  retry=async(preference='auto')=>{
    this.cancelHold();this.pendingId=null;this.controller?.clear();this.setState({error:'',ready:false,igniting:false,message:'Restoring your night sky…'});
    await this.controller?.initialize(preference);
  };
  install=async()=>{
    if(!this.installEvent)return;
    try{await this.installEvent.prompt();const choice=await this.installEvent.userChoice;if(this.alive)this.setState({message:choice.outcome==='accepted'?'Installation accepted by your browser.':'Installation dismissed.',installable:false});}catch{if(this.alive)this.setState({message:'Use your browser’s install or Add to Home Screen option.'});}
    this.installEvent=null;
  };
  renderSettings(){
    const {prefs,snapshot,sound}=this.state;
    return <Modal title='Your night, your way' onClose={()=>this.setState({settings:false},this.scheduleHide)}>
      <h2>Your night, your way.</h2><p className='modal-lead'>Small adjustments. A different atmosphere.</p>
      <section className='settings-section'><h3>Sound & feeling</h3>
        <Toggle label='Firework sound' description='Fuse, lift, distant boom and crackle' checked={sound} onChange={()=>void this.toggleSound()}/>
        <label className='volume-row'><span>Volume</span><input type='range' aria-label='Volume' min='0' max='1' step='.05' value={prefs.volume} onChange={e=>this.preferences({volume:Number(e.target.value)})}/><output>{Math.round(prefs.volume*100)}%</output></label>
        <Toggle label='Night ambience' description='A quiet wash of evening air' checked={prefs.ambience} onChange={v=>this.preferences({ambience:v})}/>
        <Toggle label='Haptic feedback' description={'vibrate'in navigator?'Subtle touch feedback where supported':'Not supported by this browser'} checked={prefs.haptics} disabled={!('vibrate'in navigator)} onChange={v=>this.preferences({haptics:v})}/>
      </section>
      <section className='settings-section'><h3>Comfort & control</h3>
        <Toggle label='Reduced effects' description='Less light, gentler pacing, no sparkle flicker' checked={prefs.reduced} onChange={v=>this.preferences({reduced:v})}/>
        <Toggle label='Tap twice to light' description='An alternative to holding the rocket' checked={prefs.tapIgnition} onChange={v=>this.preferences({tapIgnition:v})}/>
        <Toggle label='Keep screen awake' description='Only while this page is visible; uses more battery' checked={prefs.keepAwake} onChange={v=>this.preferences({keepAwake:v})}/>
        <label className='setting-row'><span className='setting-label'>Graphics quality</span><select aria-label='Graphics quality' value={prefs.quality} onChange={e=>this.preferences({quality:e.target.value})}><option value='auto'>Automatic</option><option value='low'>Low power</option><option value='standard'>Standard</option><option value='ultra'>Ultra</option></select></label>
      </section>
      <div className='diagnostics'><span>{snapshot.backend} · {snapshot.quality}</span><span>{this.state.offline?'Ready offline':'Offline copy not ready'}</span><span>{snapshot.launched} launched · {snapshot.active} active</span></div>
      <p className='safety-note'>This experience contains flashing lights and sudden sounds. Reduced effects are not a photosensitivity safety guarantee.</p>
      <div className='settings-actions'>
        <button className='quiet-button' onClick={()=>{this.controller?.clear();this.pendingId=null;this.setState({igniting:false,armed:false,lastLaunch:'',message:'The sky is clear.',display:false});}}>Clear sky</button>
        <button className='quiet-button' onClick={()=>this.setState({settings:false,help:true})}>How it works</button>
        {this.state.installable&&<button className='quiet-button' onClick={()=>void this.install()}><Icon name='install' size={16}/>Install app</button>}
      </div>
      {!this.state.installable&&<p className='install-note'>Install using your browser menu. On iPhone or iPad, use Share → Add to Home Screen.</p>}
      {this.state.update&&<button className='primary-button update-button' onClick={()=>{this.controller?.pause();window.dispatchEvent(new Event('firecrackers:apply-update'));}}>Update and restart</button>}
      <button className='primary-button settings-done' onClick={()=>this.setState({settings:false},this.scheduleHide)}>Back to the sky</button>
    </Modal>;
  }
  render(){
    const s=this.state,family=FAMILY[s.prefs.selected],busy=s.snapshot.units+family.cost>s.snapshot.maxUnits;
    const hidden=!s.controls&&!s.help&&!s.settings&&!s.error;
    const ignitionLabel=s.igniting?'Fuse is burning…':s.holding?'Lighting…':s.armed?'Press again to light':busy?'Let the sky settle':s.paused?'Show paused':s.prefs.tapIgnition?'Tap to light':'Hold to light';
    return <div className={`experience${s.prefs.reduced?' reduced-effects':''}${hidden?' chrome-hidden':''}`} ref={el=>{this.root=el;}} onMouseMove={this.reveal} onTouchStart={this.reveal}>
      <div className='scene-host' ref={el=>{this.host=el;}}/>
      <main className='app-surface' aria-label='Firecrackers interactive night sky'>
        <div className='sky-touch-target' onClick={this.reveal} aria-hidden='true'/>
        <header className='topbar chrome' aria-hidden={hidden}>
          <div className='brand'><Icon name='spark' size={26}/><div><h1>Firecrackers</h1><p>A little wonder. A whole night sky.</p></div></div>
          <div className='top-controls glass'>
            <button className={`icon-button${s.sound?' is-active':''}`} onClick={()=>void this.toggleSound()} aria-label={s.sound?'Mute sound':'Enable sound'} aria-pressed={s.sound} title={s.sound?'Mute sound (M)':'Enable sound (M)'} tabIndex={hidden?-1:0}><Icon name={s.sound?'sound':'muted'}/></button>
            <button className='icon-button fullscreen-control' onClick={()=>void this.fullscreen()} aria-label={s.fullscreen?'Exit fullscreen':'Enter fullscreen'} title='Fullscreen (F)' tabIndex={hidden?-1:0}><Icon name='expand'/></button>
            <button className='icon-button' onClick={()=>{this.cancelHold();this.setState({settings:true,controls:true});}} aria-label='Open settings' title='Settings' tabIndex={hidden?-1:0}><Icon name='settings'/></button>
          </div>
        </header>
        <div className='show-controls glass chrome' aria-hidden={hidden}>
          <button className={`show-button${s.snapshot.show?' is-active':''}`} aria-label={s.snapshot.show?'Stop auto show':'Start auto show'} aria-pressed={s.snapshot.show} disabled={!s.ready||!!s.error} onClick={()=>void this.toggleShow()} tabIndex={hidden?-1:0}><Icon name={s.snapshot.show?'stop':'play'} size={15}/><span>{s.snapshot.show?'Stop show':'Auto show'}</span></button>
          <span className='control-divider'/><select aria-label='Show mood' value={s.prefs.mode} onChange={e=>{this.preferences({mode:e.target.value});if(s.snapshot.show)this.controller?.sim.startShow(e.target.value);}} tabIndex={hidden?-1:0}><option value='calm'>Calm</option><option value='festival'>Festival</option><option value='finale'>Finale</option></select>
          <button className='icon-button pause-control' aria-label={s.paused?'Resume show':'Pause show'} disabled={!s.ready||!!s.error} onClick={this.togglePause} tabIndex={hidden?-1:0}><Icon name={s.paused?'play':'pause'} size={16}/></button>
        </div>
        {s.paused&&!s.error&&!s.help&&!s.settings&&<div className='paused-overlay glass'><span>The night can wait.</span><button className='primary-button' onClick={this.togglePause}><Icon name='play' size={16}/>Resume</button></div>}
        {s.error&&<section className='error-panel glass' role='alert'><h2>Let’s bring back the sky.</h2><p>{s.error}</p><button className='primary-button' onClick={()=>void this.retry('canvas')}>Use compatibility graphics</button><button className='quiet-button' onClick={()=>void this.retry()}>Try again</button></section>}
        <section className='launch-stage chrome' aria-label='Place and light a firework' aria-hidden={hidden}>
          <label className='placement-control'><span>Launch position</span><input type='range' aria-label='Launch position' min='.18' max='.82' step='.01' value={s.placement} disabled={s.igniting||s.paused} tabIndex={hidden?-1:0} onChange={e=>this.setState({placement:Number(e.target.value)})}/></label>
          <div className={`launch-object${s.holding?' holding':''}${s.igniting?' ignited':''}${s.armed?' armed':''}`} style={{left:`${s.placement*100}%`,'--rocket-accent':family.color} as React.CSSProperties}>
            <div className='launch-ground'/><button className='rocket-button' ref={el=>{this.rocketButton=el;}} aria-label={`${ignitionLabel}: ${family.name}`} aria-describedby='ignition-hint' disabled={!s.ready||s.igniting||s.paused||!!s.error||busy} onContextMenu={e=>e.preventDefault()} onClick={e=>{if(performance.now()<this.ignoreClickUntil)return;if(s.prefs.tapIgnition||e.detail===0)this.tapLight();}} onKeyDown={this.rocketKeyDown} onKeyUp={e=>{if(e.key===' '){e.preventDefault();this.cancelHold();}}} onBlur={this.cancelHold} tabIndex={hidden?-1:0}><RocketArt family={family.id}/><span className='hold-ring'/></button>
            <p className='ignition-label'>{ignitionLabel}</p>
          </div>
        </section>
        <section className='selection-area chrome' aria-label='Choose a firework' aria-hidden={hidden}>
          <div className='selection-caption'><h2>{family.name}</h2><p>{family.note}</p></div>
          <div className='rocket-dock glass' role='group' aria-label='Five firework families'>
            {CATALOG.map((f,index)=><button key={f.id} className={`rocket-option${f.id===family.id?' selected':''}`} style={{'--rocket-accent':f.color} as React.CSSProperties} aria-label={`Select ${f.name}`} aria-pressed={f.id===family.id} disabled={s.igniting} tabIndex={hidden?-1:0} onClick={()=>this.select(f.id)} title={`${f.name} (${index+1})`}><span className='rocket-option-art'><RocketArt family={f.id} small/></span><span className='rocket-option-name'>{f.short}</span><span className='selection-dot'/></button>)}
          </div>
          <p className='interaction-hint' id='ignition-hint'>{s.prefs.tapIgnition?'Drag to place · tap twice to light':'Drag to place · hold to light'}<span className='desktop-hint'> · 1–5 to choose</span></p>
        </section>
        <footer className='bottom-actions chrome' aria-hidden={hidden}>
          <button className='quiet-button' onClick={()=>this.setState({help:true,controls:true})} aria-label='How to play' tabIndex={hidden?-1:0}><Icon name='help' size={17}/><span>How to play</span></button>
          <button className={`quiet-button${s.display?' is-active':''}`} onClick={this.display} aria-label={s.display?'Exit display mode':'Enter display mode'} disabled={!s.ready||!!s.error} tabIndex={hidden?-1:0}><Icon name='eye' size={17}/><span>{s.display?'Exit display':'Display mode'}</span></button>
        </footer>
        <button className='reveal-controls glass' aria-label='Show controls' onClick={()=>{this.setState({controls:true,display:false});}} style={{visibility:hidden?'visible':'hidden'}} tabIndex={hidden?0:-1}><Icon name='settings' size={18}/><span>Controls</span></button>
        <div className='live-message' role='status' aria-live='polite'>{s.message}</div>
        {s.lastLaunch&&<p className='last-launch sr-only'>Last launch: {s.lastLaunch}</p>}
        {s.help&&<Modal title='The sky is yours' className='welcome-modal' onClose={this.enter}>
          <div className='welcome-art'><RocketArt family='gold-willow'/><span className='welcome-orbit'/></div>
          <h2>The sky is yours.</h2><p className='welcome-description'>That small pause before the spark.<br/>The wonder that comes after.</p>
          <div className='welcome-steps'><span><b>01</b>Choose a rocket</span><span><b>02</b>Find its place</span><span><b>03</b>Hold to light</span></div>
          <p className='safety-note'>Flashing lights and sudden sounds.<br/>Starts quiet. Sound is always your choice.</p>
          <Toggle label='Start with reduced effects' checked={s.prefs.reduced} onChange={v=>this.preferences({reduced:v})}/>
          <button className='primary-button welcome-enter' data-autofocus onClick={this.enter}>Enter the night<Icon name='spark' size={17}/></button>
          <p className='welcome-footnote'>No score. No rush. Just look up.</p>
        </Modal>}
        {s.settings&&this.renderSettings()}
      </main>
    </div>;
  }
}

import { StrictMode, lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { OptionalEntrance } from './entrance/OptionalEntrance';
const App = lazy(() => import('./App'));
import { AppBoundary } from './ui/AppBoundary';
import './index.css';
import './styles/experience-layout.css';
function Root() {
 const [entered,setEntered]=useState(new URLSearchParams(location.search).get('intro')!=='1');
 useEffect(()=>{const replay=()=>setEntered(false);window.addEventListener('firecrackers:entrance',replay);return()=>window.removeEventListener('firecrackers:entrance',replay);},[]);
 const enter=(opening:boolean)=>{const url=new URL(location.href);url.searchParams.delete('intro');if(opening)url.searchParams.set('opening','1');else url.searchParams.delete('opening');history.replaceState(null,'',url);setEntered(true);};
 return <AppBoundary>{entered?<Suspense fallback={<div role="status" className="boot-shell">Opening your night sky…</div>}><App/></Suspense>:<OptionalEntrance enter={enter}/>}</AppBoundary>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Root/></StrictMode>);

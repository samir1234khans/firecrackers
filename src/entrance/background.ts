/** Optional, bounded video enhancement. The static SVG welcome is the first paint. */
export function welcomeBackground(cover: HTMLElement, calm: HTMLInputElement, language: 'en' | 'hi', onFirstFrame: () => void = () => {}) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const contrast = matchMedia('(forced-colors: active)');
  const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean; effectiveType?: string } }).connection;
  const video = document.createElement('video');
  video.className = 'welcome-film';
  video.muted = video.defaultMuted = true;
  video.loop = true; video.playsInline = true; video.preload = 'none';
  video.setAttribute('aria-hidden', 'true'); video.tabIndex = -1;
  const format = video.canPlayType('video/mp4; codecs="avc1.64001f"') ? 'mp4' : video.canPlayType('video/webm; codecs="vp9"') ? 'webm' : null;
  const control = document.createElement('button');
  control.type = 'button'; control.className = 'welcome-film-control'; control.hidden = true;
  control.setAttribute('data-welcome-film-control', '');
  cover.prepend(video); cover.append(control);
  let timer = 0, announced = false, disposed = false, suspended = false, paused = false, broken = false, attached = false;
  const eligible = () => !disposed && !motion.matches && !contrast.matches && !calm.checked && !connection?.saveData && !/^(slow-)?2g$/.test(connection?.effectiveType || '');
  const blocked = () => !eligible() || broken || !format;
  const label = () => { control.textContent = language === 'hi' ? paused ? 'पृष्ठभूमि चलाएँ' : 'पृष्ठभूमि रोकें' : paused ? 'Play background' : 'Pause background'; };
  const unload = () => {
    video.pause(); video.classList.remove('is-ready'); cover.classList.remove('has-welcome-film'); control.hidden = true;
    if (attached) { video.removeAttribute('src'); video.removeAttribute('poster'); video.load(); attached = false; }
  };
  const play = () => {
    if (blocked() || suspended || paused || document.hidden) return;
    void video.play().catch(() => { if (!blocked() && attached && !suspended && !document.hidden && !paused) { paused = true; label(); } });
  };
  const sync = () => {
    clearTimeout(timer);
    if (blocked()) { unload(); return; }
    if (suspended || document.hidden) { video.pause(); return; }
    if (attached) { play(); return; }
    // First paint and critical welcome files have priority; no renderer or RAF.
    timer = window.setTimeout(() => {
      if (blocked() || suspended || document.hidden) return;
      const mobile = matchMedia('(max-width: 600px)').matches;
      video.poster = mobile ? '/welcome/native-celebration-mobile.webp' : '/welcome/native-celebration.webp';
      video.src = `/welcome/native-celebration${mobile ? '-mobile' : ''}.${format}`;
      attached = true; video.preload = 'auto'; video.load(); play();
    }, 40);
  };
  const ready = () => { if (!blocked() && attached) { video.classList.add('is-ready'); cover.classList.add('has-welcome-film'); control.hidden = false; label(); if (!announced) { announced = true; onFirstFrame(); } } };
  const failure = () => { if (attached) { broken = true; unload(); } };
  const toggle = () => { paused = !paused; if (paused) video.pause(); else play(); label(); };
  video.addEventListener('loadeddata', ready);
  video.addEventListener('error', failure);
  control.addEventListener('click', toggle);
  document.addEventListener('visibilitychange', sync);
  calm.addEventListener('change', sync);
  motion.addEventListener('change', sync); contrast.addEventListener('change', sync);
  connection?.addEventListener('change', sync);
  sync();
  return {
    eligible() { return eligible(); },
    language(value: 'en' | 'hi') { language = value; label(); },
    suspend() { suspended = true; clearTimeout(timer); video.pause(); },
    resume() { suspended = false; sync(); },
    destroy() {
      disposed = true; clearTimeout(timer); unload();
      document.removeEventListener('visibilitychange', sync); calm.removeEventListener('change', sync);
      motion.removeEventListener('change', sync); contrast.removeEventListener('change', sync);
      connection?.removeEventListener('change', sync);
      video.removeEventListener('loadeddata', ready); video.removeEventListener('error', failure);
      control.removeEventListener('click', toggle); video.remove(); control.remove();
    },
  };
}

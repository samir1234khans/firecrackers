// Cache cleanup runs only when the replacement worker is deliberately activated.
(() => {
  const release = '__FIRECRACKERS_RELEASE__';
  const keep = new Set(['art', 'audio', 'music'].map(kind => `firecrackers-${kind}-${release}`));
  self.addEventListener('activate', event => event.waitUntil((async () => {
    try {
      for (const name of await caches.keys()) {
        if (name.startsWith('firecrackers-') && !keep.has(name)) await caches.delete(name);
      }
    } catch { /* Storage denial must not prevent activation. */ }
    // Never navigate a window: it may own an unsaved Studio draft or recording.
  })()));
})();

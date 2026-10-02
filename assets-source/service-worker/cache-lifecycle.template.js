// Original Firecrackers cache migration. Generated with the catalog release.
(() => {
  const release = '__FIRECRACKERS_RELEASE__';
  const keep = new Set(['art', 'audio', 'music'].map(kind => `firecrackers-${kind}-${release}`));
  const replacingWorker = Boolean(self.registration.active);
  self.addEventListener('activate', event => event.waitUntil((async () => {
    try {
      for (const name of await caches.keys()) {
        if (name.startsWith('firecrackers-') && !keep.has(name)) await caches.delete(name);
      }
      await self.clients.claim();
      // Older prompt-mode bundles have no automatic reload listener. Refresh
      // those clients once per activation, after precache installation. This
      // also covers redeploying this version after a legacy-worker rollback.
      if (replacingWorker) {
        const scope = new URL(self.registration.scope);
        const clients = await self.clients.matchAll({ type: 'window' });
        // Navigation can wait for this worker to finish activating. Do not
        // include navigation promises in the activation lifetime (a deadlock).
        void Promise.allSettled(clients.filter(client => {
          const url = new URL(client.url);
          return url.origin === scope.origin && url.pathname.startsWith(scope.pathname);
        }).map(client => client.navigate(client.url)));
      }
    } catch { /* Storage denial or a closed tab must not prevent activation. */ }
  })()));
})();

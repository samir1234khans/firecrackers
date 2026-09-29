import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { WakeLockController } from './WakeLockController';
import type { WakeToken } from './WakeLockController';
type InstallEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
    }>;
};
export function usePlatform(notice: (text: string) => void) {
    const [offline, setOffline] = useState(false);
    const [updateReady, setUpdateReady] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [awake, setAwake] = useState(false);
    const [installable, setInstallable] = useState(false);
    const wake = useRef<WakeLockController | null>(null);
    const install = useRef<InstallEvent | null>(null);
    const update = useRef<((reload?: boolean) => Promise<void>) | null>(null);
    const releaseWake = useCallback(() => wake.current?.release(), []);
    useEffect(() => {
        let alive = true;
        let registration: ServiceWorkerRegistration | undefined;
        const checkUpdate = () => { if (!document.hidden && navigator.onLine) void registration?.update().catch(() => { /* Offline is normal. */ }); };
        const api = (navigator as unknown as {
            wakeLock?: {
                request: (type: string) => Promise<WakeToken>;
            };
        }).wakeLock;
        const controller = new WakeLockController(api ? () => api.request('screen') : null, () => !document.hidden, active => { if (alive)
            setAwake(active); });
        wake.current = controller;
        if ('serviceWorker' in navigator) {
            update.current = registerSW({
                immediate: true,
                onOfflineReady: () => { if (alive)
                    setOffline(true); },
                onNeedRefresh: () => { if (alive)
                    setUpdateReady(true); },
                onRegisteredSW: (_url, registered) => {
                    registration = registered;
                    if (registration?.active)
                        void navigator.serviceWorker.ready.then(async () => {
                            try {
                                const keys = await caches.keys();
                                if (alive && keys.some(key => key.includes('precache')))
                                    setOffline(true);
                            }
                            catch { /* Storage failure is nonfatal for online play. */ }
                        });
                },
                onRegisterError: () => { if (alive)
                    notice('Offline storage is unavailable. The online app still works.'); },
            });
        }
        const onInstall = (event: Event) => { event.preventDefault(); install.current = event as InstallEvent; setInstallable(true); };
        const onInstalled = () => { install.current = null; setInstallable(false); notice('App installed. Your sky is ready.'); };
        const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
        const onHidden = () => { if (document.hidden)
            controller.release(); };
        window.addEventListener('focus', checkUpdate);
        window.addEventListener('beforeinstallprompt', onInstall);
        window.addEventListener('appinstalled', onInstalled);
        document.addEventListener('fullscreenchange', onFullscreen);
        document.addEventListener('visibilitychange', onHidden);
        return () => {
            alive = false;
            controller.dispose();
            if (wake.current === controller)
                wake.current = null;
            window.removeEventListener('focus', checkUpdate);
            window.removeEventListener('beforeinstallprompt', onInstall);
            window.removeEventListener('appinstalled', onInstalled);
            document.removeEventListener('fullscreenchange', onFullscreen);
            document.removeEventListener('visibilitychange', onHidden);
        };
    }, [notice]);
    const toggleFullscreen = async () => {
        try {
            if (document.fullscreenElement)
                await document.exitFullscreen();
            else if (document.documentElement.requestFullscreen)
                await document.documentElement.requestFullscreen();
            else
                notice('This browser uses the full window. Add to Home Screen for an app-like view.');
        }
        catch {
            notice('Fullscreen was not available. You can keep using this window.');
        }
    };
    const toggleWake = async () => {
        if (awake) {
            releaseWake();
            return;
        }
        if (!('wakeLock' in navigator)) {
            notice('Keep-awake is not supported in this browser.');
            return;
        }
        if (!await wake.current?.acquire())
            notice('Keep-awake was not activated. Check your device power settings.');
    };
    const installApp = async () => {
        if (!install.current) {
            notice('Open your browser menu and choose Install app or Add to Home Screen, when available.');
            return;
        }
        try {
            await install.current.prompt();
            const result = await install.current.userChoice;
            install.current = null;
            setInstallable(false);
            if (result.outcome === 'dismissed')
                notice('Installation dismissed. You can keep playing in this browser.');
        }
        catch {
            notice('Installation was not completed. The website remains available.');
        }
    };
    return { offline, updateReady, fullscreen, awake, installable, toggleFullscreen, toggleWake, releaseWake, installApp, applyUpdate: () => update.current?.(true) };
}

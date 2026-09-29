import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base:'./',
  plugins:[react(),VitePWA({
    registerType:'prompt',injectRegister:false,
    includeAssets:['icon.svg','icons/icon-192.png','icons/icon-512.png'],
    manifest:{name:'Firecrackers',short_name:'Firecrackers',description:'A single-screen festival night. Choose, place, light, and watch.',
      theme_color:'#03050b',background_color:'#03050b',display:'standalone',start_url:'./',scope:'./',
      icons:[{src:'icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},
    workbox:{globPatterns:['**/*.{js,css,html,svg,png,txt,webmanifest}'],maximumFileSizeToCacheInBytes:4000000,cleanupOutdatedCaches:true,clientsClaim:false,skipWaiting:false},
    devOptions:{enabled:false}
  })],
  build:{outDir:process.env.APPDEPLOY_VITE_OUT_DIR||'dist',sourcemap:process.env.APPDEPLOY_VITE_SOURCEMAP==='hidden'?'hidden':false,
    chunkSizeWarningLimit:1600,rollupOptions:{maxParallelFileOps:128}},
});

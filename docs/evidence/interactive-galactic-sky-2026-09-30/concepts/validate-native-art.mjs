// Standalone native-canvas art inspection. Does not load the app or a server.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const out = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.addScriptTag({ path: path.join(out, 'art-validation-bundle.js') });
  const result = await page.evaluate(() => {
    const start = performance.now(), art = GalaxyArt.makeGalaxySky();
    const generationMs = performance.now() - start;
    const statistics = {};
    for (const label of ['stars','dust','nearStars']) {
      const canvas = art[label], { width, height } = canvas;
      const data = canvas.getContext('2d').getImageData(0,0,width,height).data;
      let edgeAlpha=0,horizonAlpha=0,transparentRGB=0,peakAlpha=0,centerSum=0,centerN=0,cornerSum=0,cornerN=0;
      for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
        const i=(y*width+x)*4,a=data[i+3]; peakAlpha=Math.max(peakAlpha,a);
        if(x===0 || y===0 || x===width-1 || y===height-1) edgeAlpha=Math.max(edgeAlpha,a);
        if(y>=Math.ceil(height*.725)) horizonAlpha=Math.max(horizonAlpha,a);
        if(!a) transparentRGB=Math.max(transparentRGB,data[i],data[i+1],data[i+2]);
        if(x>width*.40 && x<width*.60 && y>height*.30 && y<height*.56) { centerSum+=a;centerN++; }
        if(((x>width*.20&&x<width*.34)||(x>width*.68&&x<width*.80))&&y>height*.08&&y<height*.27) {cornerSum+=a;cornerN++;}
      }
      statistics[label]={edgeAlpha,horizonAlpha,transparentRGB,peakAlpha,centerMeanAlpha:centerSum/centerN,upperClusterMeanAlpha:cornerSum/cornerN};
    }
    const composite=document.createElement('canvas');composite.width=2048;composite.height=1024;
    const c=composite.getContext('2d');c.fillStyle='#030915';c.fillRect(0,0,2048,1024);
    c.drawImage(art.dust,0,0);c.drawImage(art.stars,0,0);c.drawImage(art.nearStars,0,0);
    const portrait=document.createElement('canvas');portrait.width=600;portrait.height=700;
    portrait.getContext('2d').drawImage(composite,2048*.20,0,2048*.60,1024,0,0,600,700);
    return {metadata:art.metadata,generationMs,statistics,images:Object.fromEntries(['stars','dust','nearStars'].map(label=>[label,art[label].toDataURL('image/png')])),composite:composite.toDataURL('image/png'),portrait:portrait.toDataURL('image/png')};
  });
  for(const [label,url] of Object.entries({...result.images,composite:result.composite,portrait:result.portrait})) await writeFile(path.join(out,`native-${label}.png`),Buffer.from(url.split(',')[1],'base64'));
  delete result.images; delete result.composite; delete result.portrait;
  for(const [label,data] of Object.entries(result.statistics)) {
    assert.equal(data.horizonAlpha,0,`${label} horizon alpha`);
    assert.equal(data.transparentRGB,0,`${label} transparent RGB`);
    assert.ok(data.edgeAlpha<=1,`${label} seam alpha`);
  }
  assert.ok(result.statistics.dust.centerMeanAlpha<result.statistics.dust.upperClusterMeanAlpha*.25,'Protected central canopy');
  await writeFile(path.join(out,'native-art-validation.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
} finally { await browser.close(); }

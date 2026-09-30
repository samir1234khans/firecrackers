import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLaunchAimScreenX } from '../.test-build/engine/LaunchProfile.js';

test('signature inward aiming retains24px child-depth guard and chooses nearest valid center',()=>{
 const layout={unobstructedScene:{x:0,y:0,width:844,height:314}};
 const scale=1.9625,effectScale=.74,margin=90*effectScale*scale+24;
 assert.equal(resolveLaunchAimScreenX(layout,'celestial-aurora',scale,820,effectScale),844-margin);
 assert.equal(resolveLaunchAimScreenX(layout,'celestial-aurora',scale,20,effectScale),margin);
 assert.equal(resolveLaunchAimScreenX(layout,'celestial-aurora',scale,420,effectScale),420,'an already-safe center has no added drift');
});
test('original/Grand aiming uses unchanged12px guard; narrow scene converges without scaling fireworks',()=>{
 const layout={unobstructedScene:{x:24,y:0,width:120,height:300}};
 assert.equal(resolveLaunchAimScreenX(layout,'gold-willow',4,20),84);
 assert.equal(resolveLaunchAimScreenX(layout,'sapphire-saturn',4,140),84);
 const wide={unobstructedScene:{x:0,y:0,width:1280,height:724}},margin=55*4.525+12;
 assert.equal(resolveLaunchAimScreenX(wide,'gold-willow',4.525,20),margin);
 assert.equal(resolveLaunchAimScreenX(wide,'gold-willow',4.525,640),640);
});
test('near depth bounds the shell offset as well as radius across wide edge placements',()=>{
 const layout={unobstructedScene:{x:0,y:0,width:1920,height:1004}},q=1.3,scale=6,effect=.8;
 const aim=resolveLaunchAimScreenX(layout,'celestial-aurora',scale,1900,effect,q);
 assert.ok(Math.abs(q*(aim-960+90*effect*scale)-(960-24))<1e-9);
 assert.equal(resolveLaunchAimScreenX(layout,'celestial-aurora',scale,20,effect,q),1920-aim);
 assert.equal(resolveLaunchAimScreenX(layout,'gold-willow',scale,1900,1,q),1920-55*scale-12,'original envelope remains unchanged');
});

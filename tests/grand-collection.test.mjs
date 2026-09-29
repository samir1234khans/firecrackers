import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../.test-build/engine/Simulation.js';
import { grandRecipe, OPAL_PALETTE } from '../.test-build/engine/GrandEffects.js';
import { BUDGETS, FAMILIES, familyReservation, familyKeyIndex, ROCKET_PROFILES, splitChildCount } from '../.test-build/engine/catalog.js';
const run = (s, seconds) => { for (let i = 0; i < Math.ceil(seconds * 60); i++) s.advance(1 / 60); };
const original = ['gold-willow','multicolor-peony','chrysanthemum','silver-crossette-crackle','grand-finale'];

test('append-only catalogue preserves all original IDs and provides ten safe prop profiles', () => {
    assert.deepEqual(FAMILIES.slice(0, 5).map(f => f.id), original);
    assert.equal(new Set(FAMILIES.map(f => f.id)).size, 10);
    assert.equal(ROCKET_PROFILES.length, FAMILIES.length);
    for (const profile of ROCKET_PROFILES) for (const value of profile) assert.ok(Number.isFinite(value) && value > 0);
});
test('keys 1 through 0 address all ten families, with invalid shortcuts rejected', () => {
    assert.deepEqual('1234567890'.split('').map(familyKeyIndex), [0,1,2,3,4,5,6,7,8,9]);
    for (const key of ['','a','10',' ','ArrowLeft']) assert.equal(familyKeyIndex(key), -1);
});
for (let family = 5; family < 10; family++) for (const quality of ['low','standard','ultra']) {
    test(`${FAMILIES[family].name} / ${quality}: finite, reserved, deterministic and fully cleaned up`, () => {
        const recipe = grandRecipe(family, quality, 946), repeat = grandRecipe(family, quality, 946);
        assert.deepEqual(recipe, repeat);
        assert.ok(recipe.stars.length > 100);
        let reserved = recipe.stars.length + recipe.carriers.reduce((n, c) => n + c.reserve, 0);
        for (const star of recipe.stars) {
            for (const value of [...star.velocity, ...star.color, star.life, star.trail, star.drag, star.gravity]) assert.ok(Number.isFinite(value));
            assert.ok(star.life > 0 && star.trail > 0);
            if (star.split > 0) reserved += splitChildCount(family) - 1;
        }
        assert.ok(reserved <= familyReservation(family), `${reserved} reserved vs ${familyReservation(family)}`);
        const s = new Simulation(946); s.quality = quality; s.select(FAMILIES[family].id);
        assert.equal(s.ignite(), true); assert.equal(s.ignite(), false);
        run(s, 4.7);
        assert.ok(s.bursts >= 1 && s.heads.count > 0);
        run(s, 35);
        assert.equal(s.bursts, family === 9 ? 8 : 1);
        for (const pool of [s.heads,s.trails,s.embers,s.smoke]) assert.equal(pool.count, 0);
        assert.equal(s.cues.length, 0); assert.equal(s.rockets.length, 0); assert.equal(s.ready, true);
    });
}
test('Aurora layers have both jade upper crown and violet interior at Low', () => {
    const { stars } = grandRecipe(5,'low',4);
    assert.ok(stars.filter(s => s.color[1] > .8 && s.velocity[1] > 0).length > stars.length * .6);
    assert.ok(stars.filter(s => s.color[2] === 1 && s.color[1] < .3).length > 20);
});
test('Dahlia retains twelve distinct petal clusters and champagne center', () => {
    const { stars } = grandRecipe(6,'low',4);
    const petals = stars.filter(s => s.color[1] < .3);
    const angles = new Set(petals.map(s => Math.round(Math.atan2(s.velocity[1],s.velocity[0]) / (Math.PI / 6))));
    assert.ok(angles.size >= 12);
    assert.ok(stars.some(s => s.color[1] > .7));
});
test('Saturn retains a genuinely tilted ring and smaller blue sphere', () => {
    const { stars } = grandRecipe(7,'ultra',12);
    const ring = stars.filter(s => s.color[0] === 1), core = stars.filter(s => s.color[0] < .4);
    assert.equal(ring.length,core.length);
    assert.ok(Math.max(...ring.map(s => Math.abs(s.velocity[2]))) > 25);
    assert.ok(Math.max(...core.map(s => Math.hypot(...s.velocity))) < 22);
});
test('Phoenix has eleven rising arms and reserved traveling leaf parents', () => {
    const { stars } = grandRecipe(8,'ultra',12);
    assert.ok(stars.every(s => s.velocity[1] > 0));
    assert.equal(stars.filter(s => s.split > 0).length, 27);
    const s = new Simulation(12); s.select('phoenix-palm'); s.ignite();
    run(s, 5.8);
    assert.ok(Array.from(s.heads.b.subarray(0,s.heads.count)).some(b => b > .3));
});
test('Opal carriers are paced, palette-distinct and nonrecursive', () => {
    const recipe = grandRecipe(9,'ultra',12);
    assert.equal(recipe.carriers.length, 7);
    assert.equal(new Set(recipe.carriers.map(c => c.palette)).size, OPAL_PALETTE.length);
    for (let i = 1; i < 7; i++) assert.ok(recipe.carriers[i].delay - recipe.carriers[i-1].delay >= .7);
    for (const c of recipe.carriers) {
        const child = grandRecipe(9,'ultra',c.seed,.72,c.palette);
        assert.equal(child.carriers.length,0); assert.ok(child.stars.length <= c.reserve);
    }
});
test('composite pause cancels time advancement without losing its remaining carriers', () => {
    const s = new Simulation(45); s.select('opal-supernova'); s.ignite(); run(s,4.3);
    assert.ok(s.cues.length > 0);
    const before = JSON.stringify(s.cues); s.setPaused(true); run(s,60);
    assert.equal(JSON.stringify(s.cues),before); s.setPaused(false); run(s,20);
    assert.equal(s.bursts,8); assert.equal(s.cues.length,0);
});
test('mixed catalogue shows do not over-admit heads or lose reserved children', () => {
    for (const quality of ['low','standard','ultra']) {
        const s = new Simulation(892); s.quality=quality; s.startShow('festival');
        let dropped=0; const add=s.heads.add.bind(s.heads);
        s.heads.add=(...args)=>{const result=add(...args);if(result<0)dropped++;return result;};
        const families=new Set();
        for(let i=0;i<300*60;i++){
            s.advance(1/60);
            for(const e of s.drainEvents())if(e.type==='fuse')families.add(e.family);
            assert.ok(s.heads.count<=3072 && s.trails.count<=BUDGETS[quality].trails && s.smoke.count<=BUDGETS[quality].smoke);
            assert.ok(s.cues.length<=35);
        }
        assert.equal(dropped,0); assert.ok([...families].some(f=>f>=5));
    }
});
test('invalid grand recipe inputs fail early instead of producing NaNs', () => {
    for(const family of [4,10,NaN,5.5])assert.throws(()=>grandRecipe(family,'low',1));
    for(const scale of [0,-1,2,Infinity])assert.throws(()=>grandRecipe(5,'low',1,scale));
});

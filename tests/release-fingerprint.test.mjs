import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalSource } from '../scripts/generate-release.mjs';
const normalize = source => canonicalSource('Example.tsx', source).text;
const base = "export const Button=()=> <button onClick={() => launch(1)} aria-label='Light'>Light</button>;";
const tag = ' data-appdeploy-source-id="src_f1f2fa6762156d4c264b67d4237cc9f2"';
test('host static diagnostic labels do not change application fingerprint', () => {
  assert.equal(normalize(base), normalize(base.replace('<button ', '<button' + tag + ' ')));
  assert.equal(canonicalSource('Example.tsx', base.replace('<button ', '<button' + tag + ' ')).removedHostAttributes, 1);
});
test('handlers, safety labels, copy and classes remain fingerprinted', () => {
  for (const changed of [base.replace('launch(1)', 'launch(2)'), base.replace("aria-label='Light'", "aria-label='Different'"), base.replace('>Light<', '>Fire<'), base.replace('<button ', "<button className='changed' ")]) {
    assert.notEqual(normalize(base), normalize(changed));
  }
});
test('host-key expressions cannot hide executable differences', () => {
  assert.throws(() => normalize(base.replace('<button ', '<button data-appdeploy-source-id={launch()} ')), /Unexpected host metadata/);
});
test('non-JSX engine and CSS bytes remain exact except line-ending normalization', () => {
  assert.equal(canonicalSource('engine.ts', 'const a = 1;\r\n').text, 'const a = 1;\n');
  assert.notEqual(canonicalSource('engine.ts', 'const a = 1;').text, canonicalSource('engine.ts', 'const a = 2;').text);
  assert.equal(canonicalSource('app.css', '.a { opacity: .5; }').text, '.a { opacity: .5; }');
});

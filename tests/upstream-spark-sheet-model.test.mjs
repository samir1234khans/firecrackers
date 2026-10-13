import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestSheetStop, sheetStops } from '../.test-build/ui/SheetModel.js';

test('portrait and short landscape retain ordered useful stops inside the available screen', () => {
  for (const height of [180, 220, 320, 390, 844, 1080]) {
    const stops = sheetStops(height);
    assert.ok(stops.closed > 0 && stops.closed < stops.peek && stops.peek < stops.work,
      `stops must remain ordered at ${height}px`);
    assert.ok(stops.work <= height - 88 + 1e-8,
      `${height}px landscape must preserve its actual top control reservation`);
    assert.ok(stops.work <= 480);
  }
  assert.ok(sheetStops(320).peek < sheetStops(844).peek, 'landscape peek leaves more of the scene visible');
});

test('wide compact tools cap working space without reducing phone or short-screen stops', () => {
  assert.equal(sheetStops(900, 1440).work, 320);
  assert.equal(sheetStops(1024, 768).work, 320);
  assert.equal(sheetStops(844, 390).work, sheetStops(844).work);
  assert.equal(sheetStops(390, 844).work, sheetStops(390).work);
  for (const height of [650, 700, 900, 1024]) {
    const stops = sheetStops(height, 1440);
    assert.ok(stops.closed < stops.peek && stops.peek < stops.work);
    assert.ok(stops.work <= height * .4);
    assert.equal(nearestSheetStop(stops.work, 0, stops), 'work');
  }
});

test('a slow release settles at the nearest stop with no velocity-induced jump', () => {
  for (const height of [320, 844]) {
    const stops = sheetStops(height);
    for (const stop of ['closed', 'peek', 'work']) {
      assert.equal(nearestSheetStop(stops[stop], 0, stops), stop);
    }
    assert.equal(nearestSheetStop(stops.closed - 1000, 0, stops), 'closed');
    assert.equal(nearestSheetStop(stops.work + 1000, 0, stops), 'work');
  }
});

test('upward flick opens and downward flick closes from a peek on portrait and landscape', () => {
  for (const height of [320, 844]) {
    const stops = sheetStops(height);
    assert.equal(nearestSheetStop(stops.peek, -1.5, stops), 'work');
    assert.equal(nearestSheetStop(stops.peek, 1.5, stops), 'closed');
  }
});

test('extreme release velocities are bounded to the same practical flick limit', () => {
  const stops = sheetStops(844);
  for (const visible of [stops.closed, stops.peek, 300, stops.work]) {
    assert.equal(nearestSheetStop(visible, -100, stops), nearestSheetStop(visible, -1.5, stops));
    assert.equal(nearestSheetStop(visible, 100, stops), nearestSheetStop(visible, 1.5, stops));
  }
});

test('an exact neutral midpoint chooses the lower stop, preserving a calm non-flick release', () => {
  const stops = sheetStops(844);
  assert.equal(nearestSheetStop((stops.closed + stops.peek) / 2, 0, stops), 'closed');
  assert.equal(nearestSheetStop((stops.peek + stops.work) / 2, 0, stops), 'peek');
});


test('short-screen expanded tools reserve toolbar and flow margin at maximum scroll', () => {
  for (const height of [375,390,568,600,649]) {
    const stops=sheetStops(height,390);
    assert.ok(height - 22 - stops.work >= 98, 'toolbar stays clear above the expanded dock');
  }
});

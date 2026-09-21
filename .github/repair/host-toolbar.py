from pathlib import Path

# Apply only to the inspected prior source; abort on drift instead of overwriting it.
p = Path('src/App.tsx')
s = p.read_text()
old = '    data-display={presentation.mode}\n'
assert s.count(old) == 1 and 'data-hosted-preview=' not in s
p.write_text(s.replace(old, old + "    data-hosted-preview={location.hostname.endsWith('.appdeploy.ai')}\n"))
p = Path('src/styles/flow.css')
s = p.read_text()
assert "[data-hosted-preview='true']" not in s
p.write_text(s + '''
/* Keep host preview chrome outside the app's actual touch targets.
   Do not hide the host toolbar or bypass hit testing. */
@media (max-width: 700px), (max-height: 480px) {
  .fireworks-app[data-hosted-preview='true'] .flow-deck-wrap {
    bottom: max(72px, calc(env(safe-area-inset-bottom) + 12px));
  }
  .fireworks-app[data-hosted-preview='true'] .sheet {
    max-height: calc(100dvh - 100px);
    margin: 12px auto 88px;
  }
}
''')
for filename in ['src/engine/catalog.ts', 'tests/tests.json', 'tests/video-flow-browser.mjs']:
    p = Path(filename)
    s = p.read_text()
    assert '2026-09-21.2' in s
    p.write_text(s.replace('2026-09-21.2', '2026-09-21.3'))
p = Path('tests/tests.json')
s = p.read_text().replace('Choose Reset this sky, cancel, then confirm a reset; verify cancellation preserves choices and confirmation starts a fresh scene.', 'With the host preview toolbar present, scroll settings to the bottom and choose Reset this sky; it must be reachable without hiding the toolbar. Cancel, then confirm a reset; verify cancellation preserves choices and confirmation starts a fresh scene.')
p.write_text(s)
p = Path('tests/video-flow-browser.mjs')
s = p.read_text()
old = "    await page.getByRole('button', { name: 'Reset this sky' }).click();"
assert s.count(old) == 1
p.write_text(s.replace(old, """    const resetAction = page.getByRole('button', { name: 'Reset this sky' });
    await resetAction.scrollIntoViewIfNeeded();
    assert.ok(await resetAction.evaluate(element => {
      const r = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    }), 'Reset action must be reachable with host preview toolbar present');
    await shot(page, `${v.name}-settings-reset-reachable`);
    await resetAction.click();"""))

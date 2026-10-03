from pathlib import Path

script = Path('scripts/apply-full-night.py').read_text()
old = r'''regex(p, r'const radius = \(index >= 10 \? 90 \* effectScale : 55\) \* scale;', "const radius = index === 4 ? scene.width * .48 : (index >= 10 ? 90 * effectScale : index === 1 ? 75 * effectScale : index === 3 ? 60 * effectScale : 55) * scale;")'''
new = '''replace(p, 'const radius=(index>=10?90*effectScale:55)*scale,guard=index>=10?24:12;', 'const radius = index === 4 ? scene.width * .48 : (index >= 10 ? 90 * effectScale : index === 1 ? 75 * effectScale : index === 3 ? 60 * effectScale : 55) * scale;\\n  const guard = index >= 10 ? 24 : 12;')'''
assert script.count(old) == 1
script = script.replace(old, new)
# Collect every failed anchor, but never write any target if an assertion fails.
script = script.replace('pending = {}', 'pending = {}\nerrors = []')
script = script.replace("raise RuntimeError(f'{path}: expected {count} occurrences, found {found}: {old[:120]!r}')", "errors.append(f'{path}: expected {count} occurrences, found {found}: {old[:120]!r}'); return")
script = script.replace("raise RuntimeError(f'{path}: pattern matched {found}, expected {count}: {pattern[:100]}')", "errors.append(f'{path}: pattern matched {found}, expected {count}: {pattern[:100]}'); return")
script = script.replace('for path, content in pending.items():', "if errors:\n    raise RuntimeError('\\n'.join(errors))\nfor path, content in pending.items():")
exec(compile(script, 'guarded-full-night-edit', 'exec'))

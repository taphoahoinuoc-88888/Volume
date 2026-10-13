"""Actual working-tree product scope, immutable baseline and credential guard."""
import hashlib
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'e25296877b84e9a233b3fda2f37afcd8003e0924'
def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])
def check():
    plan = (ROOT / 'docs/product/IMPLEMENTATION_PLAN.md').read_text()
    paths = re.search(r'```text\n(.*?)```', plan, re.S).group(1).splitlines()
    allowed = set(paths)
    assert len(paths) == len(allowed) and all('*' not in p and '..' not in p for p in paths)
    delta = set(git('diff', '--name-only', BASE).decode().splitlines())
    delta.update(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
    assert delta <= allowed, 'Outside allowlist: ' + ', '.join(sorted(delta - allowed))
    frozen = json.loads((ROOT / 'docs/product/frozen-files.json').read_text())
    for name, expected in frozen.items():
        raw = (ROOT / name).read_bytes()
        actual = hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
        assert actual == expected, 'Frozen file changed: ' + name
    # Outside-allowlist drift is denied even when a file was not named in the manifest.
    guard = 'scripts/check-sprint3-scope.py'
    prefix = '# PRODUCT_PHASE_DISPATCH_BEGIN\n'
    suffix = '# PRODUCT_PHASE_DISPATCH_END\n'
    source = (ROOT / guard).read_text()
    assert source.startswith(prefix) and suffix in source
    historical = source.split(suffix, 1)[1]
    assert historical.encode() == git('show', BASE + ':' + guard), 'Historical scope guarantees changed'
    tracked = git('ls-files').decode().splitlines()
    patterns = [r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
                r'gh[pousr]_[A-Za-z0-9]{30,}', r'sb_secret_[A-Za-z0-9_-]{20,}',
                r'\b\d{8,}:[A-Za-z0-9_-]{30,}',
                r'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}']
    for name in sorted(set(tracked) | delta):
        p = ROOT / name
        assert p.is_file() and not p.is_symlink(), 'Missing or symlink candidate: ' + name
        try:
            text = p.read_text()
        except UnicodeError:
            continue
        assert not any(re.search(pattern, text) for pattern in patterns), 'Potential credential: ' + name
        if name.startswith(('apps/', 'packages/')) and p.suffix in ('.ts', '.tsx', '.js', '.mjs'):
            assert not re.search(r'(?:process\.env|import\.meta\.env)\.[A-Z_]*(?:SERVICE_ROLE|SECRET|DB_URL|TELEGRAM_TOKEN)', text), 'Client secret reference: ' + name
    config = (ROOT / 'supabase/config.toml').read_text()
    assert '[functions.open-table-payment]' in config
    assert 'verify_jwt = true' in config.split('[functions.open-table-payment]', 1)[1].split('\n[', 1)[0]
    subprocess.run(['git', '-C', str(ROOT), 'diff', '--check'], check=True)
    print(f'PRODUCT scope/credential patterns/frozen files/JWT PASS: {len(allowed)} allowed paths, {len(delta)} changed paths, {len(frozen)} immutable hashes. Not a runtime-security result.')
if __name__ == '__main__':
    check()

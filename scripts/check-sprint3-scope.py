"""S3-T01/T43/T45/T47/T48: exact candidate scope; no frozen-snapshot testing."""
import json
import pathlib
import re
import subprocess

BASE = '69b680da06ae3194f8dcc2bbfffce4eddf30be32'
def git(*args):
    return subprocess.check_output(['git', *args], text=True)

plan = pathlib.Path('docs/sprints/SPRINT_3_IMPLEMENTATION_PLAN.md').read_text()
allowed_paths = plan.split('```text\n')[1].split('\n```')[0].splitlines()
allowed = set(allowed_paths)
assert len(allowed) == len(allowed_paths) and all('*' not in p for p in allowed)
# Owner-approved Local Demo maintenance: independent exact scope, not a Sprint 3 contract rewrite.
DEMO_BASE = '06dbaa8526824952e8269ca35a81cc6e7c39e33c'
DEMO_PATHS = {
    'START_VOLUME.bat', 'STOP_VOLUME.bat', 'README_DEMO.md',
    'scripts/local-demo.ps1', 'scripts/local-demo-admin.mjs',
    'tests/local-demo/launcher.Tests.ps1', 'tests/local-demo/admin.test.mjs',
    '.github/workflows/local-demo.yml',
}
LOGIN_FIXTURE = 'tests/e2e/fixtures/auth.ts'  # Separately owner-approved exact synchronization only.
maintenance = set(git('diff', '--name-only', DEMO_BASE, 'HEAD').splitlines())
assert maintenance <= DEMO_PATHS | {'scripts/check-sprint3-scope.py', LOGIN_FIXTURE}, 'Unapproved maintenance delta: ' + str(maintenance)
allowed |= DEMO_PATHS | {LOGIN_FIXTURE}
changed = set(git('diff', '--name-only', BASE, 'HEAD').splitlines())
assert changed <= allowed, 'Unapproved paths: ' + str(changed - allowed)
baseline = git('ls-tree', '-r', '--name-only', BASE).splitlines()
frozen = ['AGENTS.md','docs/blueprint.yaml','docs/permissions.md','docs/architecture.md','docs/sprints/SPRINT_3_SPEC.md','package.json','package-lock.json','supabase/config.toml','supabase/seed.sql','playwright.config.ts','vitest.config.ts']
for p in baseline:
    if p.startswith(('supabase/migrations/','docs/decisions/')) or (p.startswith(('supabase/tests/','tests/integration/','tests/e2e/')) and p not in ['supabase/tests/sprint2_constraints.test.sql','tests/integration/fixtures/payment.ts','tests/integration/fixtures/auth.ts']):
        frozen.append(p)
for p in frozen:
    if p == LOGIN_FIXTURE:
        original = subprocess.check_output(['git', 'show', BASE + ':' + LOGIN_FIXTURE])
        marker = " if(name==='disabled'){await expect(page.getByRole('status')).toContainText('Quyền truy cập');return;}\n".encode('utf-8')
        insertion = b" await page.waitForURL(origin+(surface==='customer'?'/profile':'/overview'));\n"
        assert original.count(marker) == 1 and insertion not in original
        assert pathlib.Path(p).read_bytes() == original.replace(marker, marker + insertion), 'Only exact final-login-URL synchronization allowed; frozen assertions/Auth/timeouts unchanged'
    else:
        assert not git('diff','--name-only',BASE,'HEAD','--',p).strip(), 'Frozen file changed: '+p
auth_fixture='tests/integration/fixtures/auth.ts'
old=git('show',BASE+':'+auth_fixture)
source="const r=await fetch(`${base}/auth/v1/${path}`,{method:'POST',headers:{apikey:anon,'Content-Type':'application/json'},body:JSON.stringify(body)});"
assert old.count(source)==1
expected=old.replace(source,source.replace("headers:{apikey:anon,","headers:{Connection:'close',apikey:anon,"))
assert pathlib.Path(auth_fixture).read_text()==expected, 'Only exact Auth fixture connection-lifecycle header allowed; assertions/auth unchanged'
fixture='tests/integration/fixtures/payment.ts'
old=git('show',BASE+':'+fixture)
expected=old.replace('truncate public.payment_receipts,public.payments,public.table_sessions,public.billiard_tables,public.audit_events','truncate public.session_financial_issues,public.session_cash_receipts,public.payment_receipts,public.payments,public.table_sessions,public.billiard_tables,public.audit_events')
assert pathlib.Path(fixture).read_text()==expected, 'Only exact isolated FK reset adaptation allowed'
test='supabase/tests/sprint2_constraints.test.sql'
old=git('show',BASE+':'+test)
expected=old.replace("where table_schema='public' and table_type='BASE TABLE'),8,'T65 exactly eight approved business tables'", "where table_schema='public' and table_type='BASE TABLE' and table_name in ('profiles','venues','staff_memberships','audit_events','billiard_tables','table_sessions','payments','payment_receipts')),8,'T65 exactly eight retained Sprint2 business tables'")
assert pathlib.Path(test).read_text()==expected, 'Only named frozen eight-table assertion adaptation allowed'
for p in git('ls-files').splitlines():
    data=pathlib.Path(p).read_text()
    assert not re.search(r'sb_secret_[A-Za-z0-9_-]{15,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}',data), 'Secret-like value: '+p
    assert not p.startswith('reference/') and not re.search(r'/(?:player|matches|video|tournament|shop|telegram|crm|ai|refund)/',p,re.I), 'Forbidden scope: '+p
    if p.startswith(('apps/','packages/')):
        assert all(x not in data for x in ['SUPABASE_DB_URL','payment-adapter','service_role']), 'Server capability in client: '+p
for p,marker in [('.github/workflows/sprint1a.yml','      - name: Install locked core test dependencies\n'),('.github/workflows/sprint1b.yml','      - name: Locked dependencies, typecheck, lint, unit tests, dependency audit\n')]:
    assert git('show',BASE+':'+p).split(marker)[1] == pathlib.Path(p).read_text().split(marker)[1], 'Frozen runtime changed: '+p
for p,marker in [('.github/workflows/sprint1a.yml','      - name: Scope, frozen documents and secret scan\n'),('.github/workflows/sprint1b.yml','      - name: Exact 1B allowlist, frozen core and secret scan\n')]:
    assert git('show',BASE+':'+p).split(marker)[0] == pathlib.Path(p).read_text().split(marker)[0], 'Frozen workflow authority changed: '+p
assert "TARGETED_EDGE_UI: 'false'" in pathlib.Path('.github/workflows/sprint3.yml').read_text(), 'Sprint3 must run full candidate coverage'
assert {f'T{i:02}' for i in range(1,63)} <= set(re.findall(r'\bT\d\d\b',plan)), 'Missing scenario mapping'
print(f'PASS Sprint3 exact {len(allowed)}-path scope; frozen migrations/Auth/security/dependencies/regressions; no secrets/future modules')

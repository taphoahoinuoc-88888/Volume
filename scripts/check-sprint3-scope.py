"""S3-T01/T43/T45/T47/T48: exact candidate scope; no frozen-snapshot testing."""
import json
import pathlib
import re
import subprocess

BASE = '69b680da06ae3194f8dcc2bbfffce4eddf30be32'
def git(*args):
    return subprocess.check_output(['git', *args], text=True)

plan = pathlib.Path('docs/sprints/SPRINT_3_IMPLEMENTATION_PLAN.md').read_text()
allowed = set(plan.split('```text\n')[1].split('\n```')[0].splitlines())
assert len(allowed) == len(list(allowed)) and all('*' not in p for p in allowed)
changed = set(git('diff', '--name-only', BASE, 'HEAD').splitlines())
assert changed <= allowed, 'Unapproved paths: ' + str(changed - allowed)
baseline = git('ls-tree', '-r', '--name-only', BASE).splitlines()
frozen = ['AGENTS.md','docs/blueprint.yaml','docs/permissions.md','docs/architecture.md','docs/sprints/SPRINT_3_SPEC.md','package.json','package-lock.json','supabase/config.toml','supabase/seed.sql','playwright.config.ts','vitest.config.ts']
for p in baseline:
    if p.startswith(('supabase/migrations/','docs/decisions/')) or (p.startswith(('supabase/tests/','tests/integration/','tests/e2e/')) and p not in ['supabase/tests/sprint2_constraints.test.sql','tests/integration/fixtures/payment.ts']):
        frozen.append(p)
for p in frozen:
    assert not git('diff','--name-only',BASE,'HEAD','--',p).strip(), 'Frozen file changed: '+p
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
assert {f'T{i:02}' for i in range(1,63)} <= set(re.findall(r'\bT\d\d\b',plan)), 'Missing scenario mapping'
print(f'PASS Sprint3 exact {len(allowed)}-path scope; frozen migrations/Auth/security/dependencies/regressions; no secrets/future modules')

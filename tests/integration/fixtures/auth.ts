/** Real-provider compatibility preflight. No mocked JWT/session or application authority. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

async function sessionLifecyclePreflight() {
  const raw = execFileSync('supabase', ['status', '-o', 'json'], { encoding: 'utf8' });
  const config = JSON.parse(raw);
  const base = config.API_URL;
  const key = config.ANON_KEY;
  assert.ok(base && key, 'Local Auth endpoint and anon key required');
  const email = `preflight-${randomUUID()}@example.test`;
  const password = `Local-test-${randomUUID()}!`;
  async function request(path: string, body: object) {
    const response = await fetch(`${base}/auth/v1/${path}`, {
      method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 200, `Auth ${path} status ${response.status}`);
    return response.json();
  }
  function claims(token: string) { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()); }
  function sessionRow(id: string) {
    assert.match(id, /^[0-9a-f-]{36}$/);
    return JSON.parse(execFileSync('docker', ['exec', 'supabase_db_volume-preflight',
      'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1', '-c',
      `select row_to_json(s) from (select id,user_id,created_at from auth.sessions where id='${id}'::uuid) s;`], {encoding:'utf8'}));
  }
  await request('signup', {email, password});
  const initial = await request('token?grant_type=password', {email,password});
  const initialClaims = claims(initial.access_token);
  const before = sessionRow(initialClaims.session_id);
  assert.equal(before.user_id, initialClaims.sub);
  assert.ok(before.created_at);
  const refreshed = await request('token?grant_type=refresh_token', {refresh_token: initial.refresh_token});
  assert.equal(claims(refreshed.access_token).session_id, initialClaims.session_id);
  const after = sessionRow(initialClaims.session_id);
  assert.equal(after.created_at, before.created_at, 'Refresh must preserve session creation authority');
  const relogin = await request('token?grant_type=password', {email,password});
  const next = sessionRow(claims(relogin.access_token).session_id);
  assert.notEqual(next.id, before.id, 'Re-login must create a distinct session');
  assert.ok(new Date(next.created_at).getTime() >= new Date(before.created_at).getTime());
  console.log('REAL AUTH PREFLIGHT PASS: verified user/session mapping; refresh preserves session_id/created_at; re-login creates new session. This is not Checkpoint 1A acceptance.');
}
if (process.argv.includes('--preflight')) await sessionLifecyclePreflight();

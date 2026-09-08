/**
 * E2E test of Ed25519 auth against a RUNNING PDS server (localhost:4000).
 * Proves: register (signed), whoami, upload auth required, tamper/forgery/
 * replay rejection, ownership enforcement, challenge flow.
 */
import nacl from 'tweetnacl';

const BASE = 'http://localhost:4000';
let passed = 0, failed = 0;
function check(name, ok) { if (ok) { passed++; console.log(`  ✓ ${name}`); } else { failed++; console.log(`  ✗ FAIL: ${name}`); } }
const hex = (b) => Buffer.from(b).toString('hex');

function authMessage(did, ts) { return new TextEncoder().encode(`${did}|${ts}`); }
function b64url(s) { return Buffer.from(s, 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function makeToken(did, secretKey) {
  const ts = Date.now();
  const sig = nacl.sign.detached(authMessage(did, ts), secretKey);
  return b64url(`${did}|${ts}|${hex(sig)}`);
}

async function main() {
  // fresh identity
  const kp = nacl.sign.keyPair();
  const did = `did:plc:e2e${hex(kp.publicKey).slice(0, 20)}`;
  const pub = hex(kp.publicKey);
  console.log(`identity: ${did}\n`);

  // 1. Register WITHOUT proof -> 401
  let r = await fetch(`${BASE}/api/identity/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ did, handle: 'e2ebob', publicKey: pub }) });
  check(`register without signature rejected (401, got ${r.status})`, r.status === 401);

  // 2. Register WITH ownership proof -> 201
  const msg = new TextEncoder().encode(`${did}|${pub.toLowerCase()}|register`);
  const regSig = hex(nacl.sign.detached(msg, kp.secretKey));
  r = await fetch(`${BASE}/api/identity/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ did, handle: 'e2ebob', publicKey: pub, signatureHex: regSig }) });
  const rj = await r.json();
  check(`signed registration accepted (201, got ${r.status})`, r.status === 201);
  check(`handle echoed: ${rj.handle}`, rj.handle === 'e2ebob');

  // 3. Re-register same DID -> 409
  r = await fetch(`${BASE}/api/identity/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ did, handle: 'e2ebob2', publicKey: pub, signatureHex: regSig }) });
  check(`re-register same DID rejected (409, got ${r.status})`, r.status === 409);

  // 4. whoami with valid token
  const token = makeToken(did, kp.secretKey);
  r = await fetch(`${BASE}/api/identity/whoami`, { headers: { Authorization: `Bearer ${token}` } });
  const wj = await r.json();
  check(`whoami accepts valid token (${r.status})`, r.status === 200 && wj.did === did);

  // 5. whoami replay of SAME token -> rejected (single-use)
  r = await fetch(`${BASE}/api/identity/whoami`, { headers: { Authorization: `Bearer ${token}` } });
  check(`token replay rejected (${r.status})`, r.status === 401);

  // 6. whoami with tampered token -> 401
  const tampered = b64url(`${did}|${Date.now()}|${'ab'.repeat(63)}ff`);
  r = await fetch(`${BASE}/api/identity/whoami`, { headers: { Authorization: `Bearer ${tampered}` } });
  check(`tampered token rejected (${r.status})`, r.status === 401);

  // 7. whoami with attacker-signed token -> 401
  const evil = nacl.sign.keyPair();
  const evilToken = makeToken(did, evil.secretKey);
  r = await fetch(`${BASE}/api/identity/whoami`, { headers: { Authorization: `Bearer ${evilToken}` } });
  check(`forged token (wrong key) rejected (${r.status})`, r.status === 401);

  // 8. publicKey must NOT leak from user endpoints
  r = await fetch(`${BASE}/api/users/${encodeURIComponent(did)}`);
  const u = await r.json();
  check(`GET /api/users/:did hides publicKey (${JSON.stringify(Object.keys(u))})`, !('publicKey' in u) && !('public_key' in u));
  r = await fetch(`${BASE}/api/users`);
  const ul = await r.json();
  const leaked = (ul.users || []).some((x) => 'publicKey' in x || 'public_key' in x);
  check(`GET /api/users hides publicKey for all users`, !leaked);

  // 9. Upload requires auth
  const fakeMp4 = Buffer.from('FAKE-MP4-E2E-'.repeat(500));
  const b64 = fakeMp4.toString('base64');
  r = await fetch(`${BASE}/api/videos/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoData: b64, filename: 'e2e.mp4', title: 'E2E Test' }) });
  check(`upload without token rejected (401, got ${r.status})`, r.status === 401);

  // 10. Upload WITH token -> 201, attributed to authenticated did
  const tok2 = makeToken(did, kp.secretKey);
  r = await fetch(`${BASE}/api/videos/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok2}` }, body: JSON.stringify({ videoData: b64, filename: 'e2e.mp4', title: 'E2E Test', did: 'did:plc:IMPOSTER' }) });
  const up = await r.json();
  check(`upload with token accepted (201, got ${r.status})`, r.status === 201);
  check(`upload attributed to authenticated did (NOT body.did imposter)`, up.did === did);

  // 11. Ownership: another user cannot PATCH/DELETE it
  const evil2 = nacl.sign.keyPair();
  const evil2Did = `did:plc:e2e${hex(evil2.publicKey).slice(0, 20)}`;
  const emsg = new TextEncoder().encode(`${evil2Did}|${hex(evil2.publicKey).toLowerCase()}|register`);
  const reg2 = await fetch(`${BASE}/api/identity/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ did: evil2Did, handle: 'e2eevil', publicKey: hex(evil2.publicKey), signatureHex: hex(nacl.sign.detached(emsg, evil2.secretKey)) }) });
  check(`attacker registered (${reg2.status})`, reg2.status === 201);
  const evilTok = makeToken(evil2Did, evil2.secretKey);
  r = await fetch(`${BASE}/api/videos/${up.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${evilTok}` } });
  check(`non-owner DELETE rejected (403, got ${r.status})`, r.status === 403);
  // NOTE: fresh token — tokens are single-use, reusing evilTok would (correctly) 401 as a replay
  const evilTok2 = makeToken(evil2Did, evil2.secretKey);
  r = await fetch(`${BASE}/api/videos/${up.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${evilTok2}` }, body: JSON.stringify({ title: 'HACKED' }) });
  check(`non-owner PATCH rejected (403, got ${r.status})`, r.status === 403);
  // and reusing the SAME token is rejected as a replay
  r = await fetch(`${BASE}/api/videos/${up.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${evilTok2}` }, body: JSON.stringify({ title: 'HACKED-AGAIN' }) });
  check(`reused token rejected as replay (401, got ${r.status})`, r.status === 401);

  // 12. Owner CAN delete their own video
  const ownTok = makeToken(did, kp.secretKey);
  r = await fetch(`${BASE}/api/videos/${up.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${ownTok}` } });
  check(`owner DELETE accepted (200, got ${r.status})`, r.status === 200);

  // 13. Challenge flow
  const c1 = await (await fetch(`${BASE}/api/identity/challenge?did=${encodeURIComponent(did)}`)).json();
  check(`challenge issued (${c1.challenge?.length} hex chars)`, typeof c1.challenge === 'string' && c1.challenge.length === 32);
  const cSig = hex(nacl.sign.detached(new TextEncoder().encode(c1.challenge), kp.secretKey));
  r = await fetch(`${BASE}/api/identity/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ did, challenge: c1.challenge, signatureHex: cSig }) });
  const vj = await r.json();
  check(`challenge verify OK (${r.status}, ${vj.ok})`, r.status === 200 && vj.ok === true);
  r = await fetch(`${BASE}/api/identity/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ did, challenge: c1.challenge, signatureHex: cSig }) });
  check(`challenge single-use (2nd verify ${r.status})`, r.status === 401);

  // 14. Direct user creation still blocked
  r = await fetch(`${BASE}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ did: 'did:plc:xxx', handle: 'h', publicKey: 'a'.repeat(64) }) });
  check(`direct POST /api/users returns 410 (${r.status})`, r.status === 410);

  console.log(`\n=== E2E: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('E2E crashed:', e); process.exit(1); });
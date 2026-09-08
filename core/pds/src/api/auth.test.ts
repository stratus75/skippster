/**
 * Ed25519 DID Authentication — Unit Tests
 * Run with:  npx ts-node --compilerOptions '{"module":"commonjs"}' core/pds/src/api/auth.test.ts
 * (or: node --experimental-strip-types in newer Node)
 */

import {
  parseAuthToken,
  verifyAuthToken,
  createAuthToken,
  authMessage,
  isTokenTimestampValid,
  __clearReplayCacheForTests,
  type AuthToken,
} from './auth';
import nacl from 'tweetnacl';

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean) {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ FAIL: ${name}`); }
}

function hex(b: Uint8Array): string {
  return Buffer.from(b).toString('hex');
}

async function main() {
  console.log('=== Ed25519 Auth Tests ===\n');

  // fresh identity
  const kp = nacl.sign.keyPair();
  const did = 'did:plc:testuser001';
  const publicKeyHex = hex(kp.publicKey);
  const secretKeyHex = hex(kp.secretKey); // 64 bytes: seed + public

  // ---- Test 1: round trip ----
  console.log('Test 1: Token create/parse/verify round trip');
  __clearReplayCacheForTests();
  const tokenB64 = createAuthToken(did, secretKeyHex);
  const token = parseAuthToken(`Bearer ${tokenB64}`);
  check('valid token parsed', token !== null);
  check('did round-trips (contains colons intact)', token?.did === did);
  check('signature is 128 hex chars', token ? /^[0-9a-f]{128}$/.test(token.signature) : false);
  const okValid = token ? await verifyAuthToken(token, publicKeyHex) : false;
  check('valid signature accepted', okValid);

  // ---- Test 2: tamper ----
  console.log('\nTest 2: Tamper rejection');
  __clearReplayCacheForTests();
  if (token) {
    // flip one bit of the signature
    const tampered: AuthToken = { ...token, signature: (token.signature[0] === 'a' ? 'b' : 'a') + token.signature.slice(1) };
    check('tampered signature rejected', !(await verifyAuthToken(tampered, publicKeyHex)));

    // wrong public key (not the signer's)
    const kp2 = nacl.sign.keyPair();
    check('wrong public key rejected', !(await verifyAuthToken(token, hex(kp2.publicKey))));

    // forged token: someone signs with their own key, claims our did
    __clearReplayCacheForTests();
    const forgedB64 = createAuthToken(did, hex(kp2.secretKey));
    const forged = parseAuthToken(`Bearer ${forgedB64}`);
    check('forged token (attacker key) rejected', forged ? !(await verifyAuthToken(forged, publicKeyHex)) : false);

    // did tampering: valid sig for didA presented as didB
    __clearReplayCacheForTests();
    const tokenA = parseAuthToken(`Bearer ${createAuthToken('did:plc:alice', secretKeyHex)}`);
    const swapped = tokenA ? { ...tokenA, did: 'did:plc:bob' } : null;
    check('signature/did swap rejected', swapped ? !(await verifyAuthToken(swapped, publicKeyHex)) : false);
  } else {
    check('token available for tamper tests', false);
  }

  // ---- Test 3: replay ----
  console.log('\nTest 3: Replay protection');
  __clearReplayCacheForTests();
  if (token) {
    check('first use accepted', await verifyAuthToken(token, publicKeyHex));
    check('immediate replay rejected', !(await verifyAuthToken(token, publicKeyHex)));
  }

  // ---- Test 4: timestamp ----
  console.log('\nTest 4: Timestamp window');
  __clearReplayCacheForTests();
  const now = Date.now();
  check('current ts valid', isTokenTimestampValid(now));
  check('1 min ago valid', isTokenTimestampValid(now - 60_000));
  check('10 min ago invalid', !isTokenTimestampValid(now - 600_000));
  check('future +1min valid', isTokenTimestampValid(now + 60_000));
  check('far future invalid', !isTokenTimestampValid(now + 600_000));

  const stale: AuthToken = token ? { ...token, timestamp: now - 600_000 } : { did, timestamp: now - 600_000, signature: 'a'.repeat(128) };
  check('expired timestamp rejected by verify', !(await verifyAuthToken(stale, publicKeyHex)));

  // ---- Test 5: malformed inputs ----
  console.log('\nTest 5: Malformed input handling');
  check('missing header rejected', parseAuthToken(undefined) === null);
  check('non-Bearer rejected', parseAuthToken('Basic abc') === null);
  check('garbage base64 rejected', parseAuthToken('Bearer !!!!') === null);
  check('too few fields rejected', parseAuthToken('Bearer ' + Buffer.from('onlydid|12345').toString('base64')) === null);
  check('short signature rejected', parseAuthToken('Bearer ' + Buffer.from(`${did}|123|abcd`).toString('base64')) === null);
  check('non-did token rejected', parseAuthToken('Bearer ' + Buffer.from(`notadid|123|${'a'.repeat(128)}`).toString('base64')) === null);

  // ---- Test 6: message binding ----
  console.log('\nTest 6: Message binding');
  const m1 = Buffer.from(authMessage(did, 12345)).toString();
  check('message includes did and timestamp', m1 === `${did}|12345`);

  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error('Test runner crashed:', e);
  process.exit(1);
});
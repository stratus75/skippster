/**
 * Test script for authentication module
 * Run with: npx ts-node core/pds/src/api/auth.test.ts
 */

const { parseAuthToken, isTokenTimestampValid, verifyAuthToken, createDevToken } = require('./auth');

// Mock user for testing
const mockUser = {
  did: 'did:plc:test-user-001',
  handle: 'testuser',
  publicKey: 'a'.repeat(64), // Mock 32-byte public key in hex
};

console.log('=== Authentication Module Tests ===\n');

// Test 1: Token parsing
console.log('Test 1: Token Parsing');
const validToken = parseAuthToken('Bearer ' + Buffer.from(`${mockUser.did}:${Date.now()}:abcdef123456`).toString('base64'));
console.log('  Valid token parsed:', validToken !== null);
console.log('  DID extracted correctly:', validToken?.did === mockUser.did);

const invalidToken = parseAuthToken('InvalidFormat');
console.log('  Invalid token rejected:', invalidToken === null);

const noBearer = parseAuthToken('Basic credentials');
console.log('  Non-Bearer auth rejected:', noBearer === null);

// Test 2: Timestamp validation
console.log('\nTest 2: Timestamp Validation');
const now = Date.now();
console.log('  Current timestamp valid:', isTokenTimestampValid(now));
console.log('  Timestamp 1 min ago valid:', isTokenTimestampValid(now - 60000));
console.log('  Timestamp 10 min ago invalid:', !isTokenTimestampValid(now - 600000));
console.log('  Future timestamp valid:', isTokenTimestampValid(now + 60000));
console.log('  Far future timestamp invalid:', !isTokenTimestampValid(now + 600000));

// Test 3: Development token creation
console.log('\nTest 3: Development Token Creation');
const devToken = createDevToken(mockUser.did, mockUser.publicKey);
console.log('  Dev token created:', devToken.length > 0);

const parsedDevToken = parseAuthToken('Bearer ' + devToken);
console.log('  Dev token parseable:', parsedDevToken !== null);
console.log('  Dev token DID correct:', parsedDevToken?.did === mockUser.did);

// Test 4: Signature verification
console.log('\nTest 4: Signature Verification');
async function testVerification() {
  if (!parsedDevToken) {
    console.log('  Cannot test verification: dev token not parsed');
    return;
  }

  const isValid = await verifyAuthToken(parsedDevToken, mockUser.publicKey);
  console.log('  Valid signature accepted:', isValid);

  const wrongKey = 'b'.repeat(64);
  const isInvalid = await verifyAuthToken(parsedDevToken, wrongKey);
  console.log('  Wrong key rejected:', !isInvalid);
}

testVerification().then(() => {
  console.log('\n=== Tests Complete ===');
});
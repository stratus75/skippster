/**
 * Skippster P2P Network Loop — full ESM harness.
 * Proves the REAL decentralized transfer loop with REAL production components:
 *
 *   Node A (WebTorrent client.seed) -> real bittorrent-tracker (DHT+HTTP+WS)
 *                                    -> Node B (fresh peer, pulls & verifies bytes)
 *
 * This is the loop the repo currently FAKES (the "torrent" layer is a hand-rolled
 * bencode/sha1 stub that never actually seeds or peers). Here everything is real.
 */
import { createHash, randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const log = (m) => console.log(`\x1b[36m[loop]\x1b[0m ${m}`);
const ok = (m) => console.log(`\x1b[32m  ✔ ${m}\x1b[0m`);
const fail = (m) => { console.error(`\x1b[31m  ✘ ${m}\x1b[0m`); process.exit(1); };

const Tracker = (await import('bittorrent-tracker/server')).default;
const WebTorrent = (await import('webtorrent')).default;

(async () => {
  // 1. real bytes
  const name = 'demo_skippster_video.mp4';
  const blob = randomBytes(1024 * 1024 + 2041);
  const filePath = join(tmpdir(), name);
  writeFileSync(filePath, blob);
  log(`Test file "${name}" = ${blob.length} bytes`);

  // 2. REAL bittorrent-tracker (HTTP) on :4001
  const tracker = new Tracker({ udp: false, ws: false, http: true, httpPort: 4001 });
  tracker.listen(4001);
  await new Promise((res) => tracker.on('listening', res));
  log(`Real bittorrent-tracker listening :4001 (http=${tracker.http ? 'on' : 'off'}, udp=${tracker.udp4 ? 'on' : 'off'}, ws=${tracker.ws ? 'on' : 'off'})`);

  // 3. Node A: REAL WebTorrent seeder announcing to that tracker
  const seeder = new WebTorrent({ tracker: { announce: ['http://127.0.0.1:4001/announce'] }, torrentPort: 4002 });
  const seeded = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('seed timeout')), 20000);
    seeder.seed(filePath, { announce: ['http://127.0.0.1:4001/announce'] }, (torr) => { clearTimeout(t); resolve(torr); });
  });
  ok(`Node A seeded with REAL WebTorrent: infoHash=${seeded.infoHash}`);
  ok(`Real magnet URI: ${seeded.magnetURI.slice(0, 72)}...`);

  // 4. Node B: fresh real WebTorrent client pulls it from the tracker
  const clientB = new WebTorrent({ tracker: { announce: ['http://127.0.0.1:4001/announce'] }, dht: false, lsd: false });
  log('Node B: retrieving via real P2P magnet...');
  const got = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT: node B could not retrieve within 30s')), 30000);
    clientB.add(seeded.magnetURI, (t) => {
      const file = t.files[0];
      const chunks = [];
      file.createReadStream()
        .on('data', (d) => chunks.push(d))
        .on('end', () => { clearTimeout(timer); resolve(Buffer.concat(chunks)); })
        .on('error', (e) => { clearTimeout(timer); reject(e); });
    });
  });
  ok(`Node B retrieved ${got.length} bytes via P2P`);

  // 5. verify identical
  const hA = createHash('sha256').update(blob).digest('hex');
  const hB = createHash('sha256').update(got).digest('hex');
  if (hA === hB) {
    ok(`BYTES IDENTICAL (sha256). ${(blob.length / 1024).toFixed(1)} KB A->B`);
    console.log('\n\x1b[32m============================================\x1b[0m');
    console.log('\x1b[32m  P2P NETWORK LOOP: WORKING ✓\x1b[0m');
    console.log('  seed -> real tracker -> peer B (bytes intact)');
    console.log('\x1b[32m============================================\x1b[0m');
  } else {
    fail(`BYTE MISMATCH hA=${hA.slice(0,16)} hB=${hB.slice(0,16)}`);
  }

  clientB.destroy();
  seeder.destroy();
  tracker.close();
  process.exit(0);
})().catch((e) => { console.error('\x1b[31m  ✘ FATAL:\x1b[0m', e); process.exit(1); });

/**
 * Cross-process P2P test: seeder in ONE process, leecher in ANOTHER.
 * Isolates whether "request was rejected" is a WebTorrent config issue
 * or a server-wiring issue. Run seeder first, then leecher.
 *
 *   node scripts/xproc-seeder.mjs   (starts seeder + tracker, prints magnet)
 *   node scripts/xproc-leecher.mjs  (fetches magnet, verifies bytes)
 */
import { createHash, randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const Tracker = (await import('bittorrent-tracker/server')).default;
const WebTorrent = (await import('webtorrent')).default;

const name = 'xproc_test.mp4';
const blob = randomBytes(512 * 1024 + 123);
const filePath = join(tmpdir(), name);
writeFileSync(filePath, blob);

// tracker
const tracker = new Tracker({ udp: false, ws: false, http: true, httpPort: 4011 });
tracker.listen(4011);
await new Promise((res) => tracker.on('listening', res));
console.log('[seeder] tracker on :4011');

// seeder
const seeder = new WebTorrent({ tracker: { announce: ['http://127.0.0.1:4011/announce'] }, torrentPort: 4012 });
const seeded = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('seed timeout')), 20000);
  seeder.seed(filePath, { announce: ['http://127.0.0.1:4011/announce'] }, (torr) => { clearTimeout(t); resolve(torr); });
});
console.log('[seeder] seeded infoHash=' + seeded.infoHash);
console.log('[seeder] magnet=' + seeded.magnetURI);
console.log('[seeder] pieces=' + seeded.pieces.length + ' length=' + seeded.length);

// keep alive, log peer events
seeded.on('peer', (addr) => console.log('[seeder] peer connected: ' + addr));
seeded.on('upload', (bytes) => console.log('[seeder] uploaded ' + bytes + ' bytes'));
seeded.on('warning', (e) => console.log('[seeder] WARN: ' + e.message));
seeded.on('error', (e) => console.log('[seeder] ERR: ' + e.message));

// write magnet to a file so leecher can read it
import { writeFileSync as wfs } from 'node:fs';
wfs('/tmp/xproc_magnet.txt', seeded.magnetURI);

// keep process alive 60s
await new Promise((r) => setTimeout(r, 60000));
process.exit(0);

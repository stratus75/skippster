/**
 * Isolate: seed from the EXACT uploads path the server uses, then leecher fetches.
 * If this works, the server wiring is the problem; if not, it's the path/content.
 */
import { createHash, randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const Tracker = (await import('bittorrent-tracker/server')).default;
const WebTorrent = (await import('webtorrent')).default;

// seed from the same dir the server uses
const uploadsDir = '/home/ubunt24/skippster/core/pds/uploads';
const name = 'iso_test.mp4';
const blob = randomBytes(34000);
const filePath = join(uploadsDir, name);
writeFileSync(filePath, blob);

const tracker = new Tracker({ udp: false, ws: false, http: true, httpPort: 4011 });
tracker.listen(4011);
await new Promise((res) => tracker.on('listening', res));

const seeder = new WebTorrent({ tracker: { announce: ['http://127.0.0.1:4011/announce'] }, torrentPort: 4012 });
const seeded = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('seed timeout')), 20000);
  seeder.seed(filePath, { name, announce: ['http://127.0.0.1:4011/announce'] }, (torr) => { clearTimeout(t); resolve(torr); });
});
console.log('[seeder] infoHash=' + seeded.infoHash + ' length=' + seeded.length);
seeded.on('peer', (a) => console.log('[seeder] peer: ' + a));
seeded.on('upload', (b) => console.log('[seeder] uploaded ' + b));
seeded.on('warning', (e) => console.log('[seeder] WARN: ' + e.message));
seeded.on('error', (e) => console.log('[seeder] ERR: ' + e.message));

import { writeFileSync as wfs } from 'node:fs';
wfs('/tmp/iso_magnet.txt', seeded.magnetURI);
console.log('[seeder] magnet written, keeping alive 60s');
await new Promise((r) => setTimeout(r, 60000));
process.exit(0);

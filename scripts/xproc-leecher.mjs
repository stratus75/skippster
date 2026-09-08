/**
 * Cross-process leecher: reads magnet from /tmp/xproc_magnet.txt, fetches, verifies.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const WebTorrent = (await import('webtorrent')).default;
const magnet = readFileSync('/tmp/xproc_magnet.txt', 'utf-8').trim();
console.log('[leecher] magnet=' + magnet.slice(0, 60) + '...');

const client = new WebTorrent({ tracker: { announce: ['http://127.0.0.1:4011/announce'] }, dht: false, lsd: false });
client.on('error', (e) => console.log('[leecher] CLIENT ERR: ' + e.message));

const t = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('TIMEOUT: no torrent ready')), 20000);
  client.add(magnet, (torr) => { clearTimeout(timer); resolve(torr); });
});
console.log('[leecher] torrent ready, peers=' + t.numPeers + ' progress=' + t.progress);
t.on('peer', (addr) => console.log('[leecher] peer: ' + addr));
t.on('warning', (e) => console.log('[leecher] WARN: ' + e.message));
t.on('error', (e) => console.log('[leecher] ERR: ' + e.message));

const got = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('TIMEOUT: no data')), 30000);
  const chunks = [];
  t.files[0].createReadStream()
    .on('data', (d) => chunks.push(d))
    .on('end', () => { clearTimeout(timer); resolve(Buffer.concat(chunks)); })
    .on('error', reject);
});
console.log('[leecher] got ' + got.length + ' bytes');
console.log('[leecher] sha256=' + createHash('sha256').update(got).digest('hex'));
client.destroy();
process.exit(0);

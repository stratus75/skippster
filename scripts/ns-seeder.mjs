/**
 * Test NetworkService class directly (seeder), leecher in separate process.
 * Isolates whether the piece-rejection bug is in NetworkService's client config.
 */
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { createNetworkService } from '../core/pds/network-service.mjs';

const uploadsDir = '/home/ubunt24/skippster/core/pds/uploads';
const name = 'ns_test.mp4';
const blob = randomBytes(34000);
const filePath = join(uploadsDir, name);
writeFileSync(filePath, blob);

const net = createNetworkService({ mode: 'private', trackerPort: 4011, torrentPort: 4012, uploadDir: uploadsDir });
await net.start();
const seeded = await net.seedFile(filePath, name);
console.log('[ns-seeder] infoHash=' + seeded.infoHash + ' length=' + seeded.size);
console.log('[ns-seeder] magnet=' + seeded.magnetURI);

import { writeFileSync as wfs } from 'node:fs';
wfs('/tmp/ns_magnet.txt', seeded.magnetURI);
console.log('[ns-seeder] keeping alive 60s');
await new Promise((r) => setTimeout(r, 60000));
process.exit(0);

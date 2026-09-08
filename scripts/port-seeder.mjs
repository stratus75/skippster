/**
 * Test NetworkService on the EXACT server ports (4001/4002).
 */
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { createNetworkService } from '../core/pds/network-service.mjs';

const uploadsDir = '/home/ubunt24/skippster/core/pds/uploads';
const name = 'port_test.mp4';
const blob = randomBytes(34000);
const filePath = join(uploadsDir, name);
writeFileSync(filePath, blob);

const net = createNetworkService({ mode: 'private', trackerPort: 4001, torrentPort: 4002, uploadDir: uploadsDir });
await net.start();
const seeded = await net.seedFile(filePath, name);
console.log('[port-seeder] infoHash=' + seeded.infoHash + ' length=' + seeded.size);
console.log('[port-seeder] magnet=' + seeded.magnetURI);
import { writeFileSync as wfs } from 'node:fs';
wfs('/tmp/port_magnet.txt', seeded.magnetURI);
console.log('[port-seeder] keeping alive 60s');
await new Promise((r) => setTimeout(r, 60000));
process.exit(0);

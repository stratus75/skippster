/**
 * Browser stub for bittorrent-dht.
 *
 * torrent-discovery imports `{ Client as DHT }` from 'bittorrent-dht' but
 * marks it browser:false (webtorrent ships it that way) — the module is
 * expected to be an empty object in browsers. Rollup fails on the named
 * import against Vite's empty-stub, so we provide a no-op Client class.
 *
 * Skippster browser clients do LAN seeding via the HTTP tracker + LSD.
 * DHT is intentionally disabled in the browser (private-network mode);
 * enabling public DHT from a browser would require WebRTC DHT integration.
 */
import { EventEmitter } from 'events';

export class Client extends EventEmitter {
  constructor() {
    super();
  }
  addListeningPort() {
    return false;
  }
  get() {
    return [];
  }
  lookup() {}
  announce() {}
  destroy() {}
}

export default Client;
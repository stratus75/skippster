export function getNetworkService(config: any): any;
export function createNetworkService(config: any): NetworkService;
export class NetworkService {
    constructor(config?: {});
    mode: any;
    trackerPort: any;
    torrentPort: any;
    uploadDir: any;
    tracker: any;
    client: any;
    torrents: Map<any, any>;
    started: boolean;
    get announceUrls(): string[];
    get dhtNodes(): string[];
    start(): Promise<void>;
    /**
     * Seed a file and return a REAL infoHash + magnet URI.
     */
    seedFile(filePath: any, name: any): Promise<{
        infoHash: any;
        magnetURI: any;
        name: any;
        size: any;
        filePath: any;
    }>;
    /**
     * Seed from an in-memory buffer (no temp file needed).
     */
    seedBuffer(buffer: any, name: any): Promise<{
        infoHash: any;
        magnetURI: any;
        name: any;
        size: any;
        filePath: string;
    }>;
    getTorrent(infoHash: any): any;
    getActiveTorrents(): any[];
    stopSeeding(infoHash: any): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=network-service.d.mts.map
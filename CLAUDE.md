# Skippster - Development Notes

## Project Overview

Skippster is a decentralized platform with two interconnected apps:
- **Skippster Tube**: YouTube-like video platform (upload, watch, subscribe, creator channels)
- **Skippster Social**: Facebook-like social network (posts, friends, groups, marketplace)

## Architecture

```
core/
├── identity/     DID, keys, seed phrase backup
├── pds/          Personal Data Server (SQLite + HTTP API)
├── p2p/          libp2p, WebRTC, WebTorrent
├── payments/     Lightning, Solana
└── agent/        Personal AI assistant

apps/
├── tube/         Video app (React + Video.js + WebTorrent)
└── social/       Social app (React + E2EE)

contracts/
└── escrow.rs     Solana smart contract for marketplace escrow
```

## Key Tech Stack

- **Core**: Node.js + TypeScript, SQLite, IPFS, libp2p, TweetNaCl
- **Tube App**: React, Video.js/Plyr, WebTorrent
- **Social App**: React, End-to-end encryption
- **Payments**: Lightning (lnd/CLN), Solana Web3.js

## Development Workflow

1. Start with core/shared layers (identity → PDS → P2P)
2. Build Skippster Tube first (MVP focus)
3. Build Skippster Social
4. Integrate cross-app features
5. Add AI agent capabilities

## Key Principles

1. **Local-first**: Your data on your device by default
2. **No central control**: P2P, no single point of failure
3. **One identity**: Same account across both apps
4. **Apps complement each other**: Tube creates, Social connects
5. **Agent-ready**: Pre-approved permissions, user in control
6. **Crypto-native**: Payments throughout, no fiat middlemen

## Important Notes

- Use Bun or Node.js 18+ for development
- All crypto operations use TweetNaCl for security
- DIDs use did:plc format (like Bluesky)
- Seed phrases are BIP39 24-word mnemonic
- P2P encryption uses X25519 key exchange + XSalsa20-Poly1305
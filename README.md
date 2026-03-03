# Skippster

A decentralized platform containing TWO separate apps that work together:

- **Skippster Tube** - A YouTube-like video platform (upload, watch, subscribe, creator channels)
- **Skippster Social** - A Facebook-like social network (posts, friends, groups, marketplace)

Both apps share the same identity, payments, and P2P network. Your data stays local unless you choose to share it.

## Project Structure

```
skippster/
├── core/                      # Shared platform code
│   ├── identity/              # DID, keys, recovery
│   ├── pds/                   # Personal Data Server
│   ├── p2p/                   # P2P networking
│   ├── payments/              # Lightning, Solana
│   └── agent/                 # AI assistant
│
├── apps/
│   ├── tube/                  # 📺 Video app
│   └── social/                # 👥 Social app
│
└── contracts/                 # Solana programs
```

## Getting Started

### Install dependencies

```bash
npm install
```

### Development

Run all apps together:
```bash
npm run dev
```

Run individual apps:
```bash
# Tube (port 3000)
npm run dev --workspace=apps/tube

# Social (port 3001)
npm run dev --workspace=apps/social

# PDS (port 4000)
npm run dev --workspace=core/pds
```

### Build

```bash
npm run build
```

## Key Principles

1. **Local-first:** Your data on your device by default
2. **No central control:** P2P, no single point of failure
3. **One identity:** Same account across both apps
4. **Apps complement each other:** Tube creates, Social connects
5. **Agent-ready:** Pre-approved permissions, user in control
6. **Crypto-native:** Payments throughout, no fiat middlemen

## Tech Stack

- **Core:** Node.js + TypeScript, SQLite, IPFS, libp2p
- **Apps:** React, Vite, Tailwind CSS
- **Payments:** Lightning Network, Solana
- **Crypto:** TweetNaCl, BIP39
# AptosGifts 🎁

AptosGifts is a decentralized digital gift card platform built on the Aptos blockchain. Send and receive crypto gift cards with personalized messages, powered by secure smart contracts.

## Features

- 🎉 Create digital gift cards with custom amounts and messages
- 💸 Send gifts to any Aptos wallet address
- 🔒 Secure redemption system with smart contract verification
- 📜 Gift history tracking and management
- ⚡ Real-time balance checking and notifications

## Tech Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Blockchain**: Aptos Network, Move Smart Contracts
- **Wallet**: Petra Wallet Integration
- **Development**: Node.js, ts-node

## Contract Information

- **Contract Address**: `0x349837d718a486ba72702b62c9229f0d4592438584a6f21bdc4daa940a8fe4b6`
- **Network**: Testnet
- **Explorer URL**: [View on Aptos Explorer](https://explorer.aptoslabs.com/account/0x349837d718a486ba72702b62c9229f0d4592438584a6f21bdc4daa940a8fe4b6?network=testnet)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Aptos CLI
- Petra Wallet (for testnet/mainnet)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/druxamb/aptos-gifts.git
cd aptos-gifts
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
npm run dev
```

### Smart Contract Deployment

1. Compile the Move contract:
```bash
cd move
aptos move compile
```

2. Deploy to testnet:
```bash
npm run deploy
```

## Usage

1. Connect your Petra wallet
2. Create a new gift card with amount and message
3. Send to recipient's address
4. Recipients can claim their gifts through the dApp

## Development

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run deploy` - Deploy smart contract
- `npm run test` - Run tests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

This project is in active development. Please report any security issues to [security@aptosgifts.com](mailto:security@aptosgifts.com).

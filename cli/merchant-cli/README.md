# P2M Merchant CLI

A command-line interface for merchants to interact with the P2M (Pay-to-Merchant) system on the Aptos blockchain. This CLI enables merchants to register their business, manage UPI IDs, and interact with the UPI Registry smart contract.

## Features

- 🏪 **Merchant Registration**: Register your business on the P2M system
- 💳 **UPI Management**: Add, remove, and sync UPI IDs with the blockchain
- 💰 **Balance Checking**: View wallet balance and fund accounts (testnet/devnet)
- 📜 **Transaction History**: View and export transaction history
- 🔍 **Status Monitoring**: Check CLI configuration and system status
- 🌐 **Multi-Network Support**: Works with Aptos mainnet, testnet, and devnet

## Installation

### Prerequisites

- Node.js 16+ and npm
- Aptos CLI (optional, for advanced operations)

### Install from Source

```bash
# Clone the repository
git clone <repository-url>
cd p2m-system/cli/merchant-cli

# Install dependencies
npm install

# Build the CLI
npm run build

# Link globally (optional)
npm link
```

### Install from NPM (when published)

```bash
npm install -g p2m-merchant-cli
```

## Quick Start

### 1. Initialize CLI

```bash
p2m-cli init
```

This will:
- Set up your network configuration (mainnet/testnet/devnet)
- Create or import your Aptos wallet
- Configure the UPI Registry contract address
- Optionally fund your account (testnet/devnet only)

### 2. Register as Merchant

```bash
p2m-cli register
```

Provide your business information:
- Business name
- Contact email
- Phone number
- Business address

### 3. Add UPI IDs

```bash
p2m-cli upi add merchant@paytm
p2m-cli upi add 9876543210@ybl
```

### 4. Check Status

```bash
p2m-cli status
```

## Commands

### `init`

Initialize the P2M CLI configuration.

```bash
p2m-cli init [options]

Options:
  --network <network>     Aptos network (mainnet|testnet|devnet)
  --contract <address>    UPI Registry contract address
  --import-key <key>      Import existing private key
```

### `register`

Register your business as a merchant on the P2M system.

```bash
p2m-cli register [options]

Options:
  --business-name <name>  Business name
  --email <email>         Contact email
  --phone <phone>         Phone number
  --address <address>     Business address
  --force                 Force re-registration
```

### `upi`

Manage UPI IDs associated with your merchant account.

#### Add UPI ID

```bash
p2m-cli upi add <upi-id> [options]

Options:
  --force    Force add even if UPI ID exists locally
```

#### Remove UPI ID

```bash
p2m-cli upi remove <upi-id> [options]

Options:
  --force    Skip confirmation prompt
```

#### List UPI IDs

```bash
p2m-cli upi list [options]

Options:
  --sync     Sync with blockchain before listing
  --remote   Show only blockchain data
```

#### Sync UPI IDs

```bash
p2m-cli upi sync
```

### `balance`

Check wallet balance and manage funds.

```bash
p2m-cli balance [options]

Options:
  --fund              Fund account (testnet/devnet only)
  --amount <amount>   Amount to fund (default: 1 APT)
  --all-tokens        Show all token balances
```

### `history`

View transaction history.

```bash
p2m-cli history [options]

Options:
  -l, --limit <number>    Limit number of transactions (default: 10)
  -t, --type <type>       Filter by type (register|upi_add|upi_remove)
  --export <format>       Export history (json|csv)
```

### `status`

Check CLI configuration and system status.

```bash
p2m-cli status [options]

Options:
  --detailed         Show detailed system information
  --check-contract   Verify contract deployment status
```

## Global Options

All commands support these global options:

```bash
--network <network>     Override network setting
--config <path>         Use custom config file
--verbose              Enable verbose logging
--help                 Show help information
```

## Configuration

The CLI stores configuration in:
- **Windows**: `%APPDATA%\p2m-cli\config.json`
- **macOS**: `~/Library/Preferences/p2m-cli/config.json`
- **Linux**: `~/.config/p2m-cli/config.json`

### Configuration Structure

```json
{
  "network": "testnet",
  "privateKey": "0x...",
  "contractAddress": "0x...",
  "merchantInfo": {
    "businessName": "My Business",
    "contactEmail": "contact@business.com",
    "phoneNumber": "+1234567890",
    "businessAddress": "123 Business St",
    "registrationDate": "2024-01-01T00:00:00.000Z"
  },
  "upiIds": ["merchant@paytm", "9876543210@ybl"],
  "lastSyncTimestamp": 1704067200000
}
```

## Network Configuration

### Mainnet
- **Network**: `mainnet`
- **RPC**: `https://fullnode.mainnet.aptoslabs.com/v1`
- **Faucet**: Not available

### Testnet
- **Network**: `testnet`
- **RPC**: `https://fullnode.testnet.aptoslabs.com/v1`
- **Faucet**: `https://faucet.testnet.aptoslabs.com`

### Devnet
- **Network**: `devnet`
- **RPC**: `https://fullnode.devnet.aptoslabs.com/v1`
- **Faucet**: `https://faucet.devnet.aptoslabs.com`

## Error Handling

The CLI provides helpful error messages and suggestions:

- **Network Issues**: Automatic retry with exponential backoff
- **Insufficient Balance**: Suggestions to fund account
- **Contract Errors**: Detailed error messages with solutions
- **Configuration Issues**: Step-by-step resolution guides

## Security

- Private keys are stored encrypted in the local configuration
- Network requests use HTTPS/WSS only
- Input validation for all UPI IDs and addresses
- No sensitive data is logged or transmitted

## Development

### Build from Source

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure

```
src/
├── commands/          # CLI command implementations
│   ├── init.ts
│   ├── register.ts
│   ├── upi.ts
│   ├── balance.ts
│   ├── history.ts
│   └── status.ts
├── config/            # Configuration management
│   └── ConfigManager.ts
├── services/          # Blockchain services
│   └── UPIRegistryService.ts
├── wallet/            # Wallet management
│   └── WalletManager.ts
└── index.ts           # Main CLI entry point
```

## Troubleshooting

### Common Issues

#### CLI Not Initialized
```bash
❌ CLI not initialized. Run `p2m-cli init` first.
```
**Solution**: Run `p2m-cli init` to set up the CLI.

#### Insufficient Balance
```bash
❌ Insufficient balance for transaction.
```
**Solution**: Fund your account with `p2m-cli balance --fund` (testnet/devnet) or transfer APT to your wallet.

#### Contract Not Found
```bash
❌ Contract not found at address.
```
**Solution**: Verify the contract address is correct and deployed on the selected network.

#### UPI ID Already Exists
```bash
❌ UPI ID already registered.
```
**Solution**: Use a different UPI ID or remove the existing one first.

### Debug Mode

Enable verbose logging for debugging:

```bash
p2m-cli --verbose <command>
```

### Reset Configuration

To reset the CLI configuration:

```bash
# Delete config file (varies by OS)
rm ~/.config/p2m-cli/config.json  # Linux/macOS
# Then run init again
p2m-cli init
```

## Support

- **Documentation**: [Project Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)

## License

MIT License - see [LICENSE](../../LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

---

**P2M System** - Bridging UPI and Cryptocurrency on Aptos Blockchain
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from './config/ConfigManager';
import { UPIRegistryService } from './services/UPIRegistryService';
import { WalletManager } from './wallet/WalletManager';
import { initAction } from './commands/init';
import { addUpiAction } from './commands/add-upi';
import { generateAction } from './commands/generate';
import { balanceAction } from './commands/balance';
import { historyAction } from './commands/history';
import { listPairsAction } from './commands/list-pairs';
import { exportAction } from './commands/export';
import { interactiveCommand } from './commands/interactive';

const program = new Command();

program
  .name('aptos-p2m')
  .description('P2M Merchant CLI for UPI registration and management on Aptos blockchain')
  .version('1.0.0');

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n❌ Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Initialize configuration and services
const configManager = new ConfigManager();
const walletManager = new WalletManager(configManager);
const upiRegistryService = new UPIRegistryService(configManager, walletManager);

// Add commands
program
  .command('init')
  .description('Initialize P2M CLI configuration')
  .option('-r, --reset', 'Reset existing configuration')
  .action((options) => initAction(configManager, walletManager, upiRegistryService, options));

program
  .command('add-upi <upi-id>')
  .description('Add a UPI ID to your merchant account')
  .option('-f, --force', 'Force add even if UPI ID already exists')
  .action((upiId, options) => addUpiAction(configManager, walletManager, upiRegistryService, upiId, options));

program
  .command('update-upi <old-upi-id> <new-upi-id>')
  .description('Update an existing UPI ID to a new one')
  .option('-f, --force', 'Force update without confirmation')
  .action(async (oldUpiId, newUpiId, options) => {
    const { updateUpiAction } = await import('./commands/update-upi');
    updateUpiAction(configManager, walletManager, upiRegistryService, oldUpiId, newUpiId, options);
  });

program
  .command('delete-upi <upi-id>')
  .description('Delete a UPI ID and its associated escrow wallet')
  .option('-f, --force', 'Force delete without confirmation')
  .action(async (upiId, options) => {
    const { deleteUpiAction } = await import('./commands/delete-upi');
    deleteUpiAction(configManager, walletManager, upiRegistryService, upiId, options);
  });

program
  .command('generate <upi-id>')
  .description('Generate escrow wallet for a UPI ID')
  .option('-r, --regenerate', 'Regenerate wallet even if one already exists')
  .action((upiId, options) => generateAction(configManager, walletManager, upiRegistryService, upiId, options));

program
  .command('balance <upi-id>')
  .description('Check balance of escrow wallet for a UPI ID')
  .option('-r, --refresh', 'Refresh balance from blockchain')
  .action((upiId, options) => balanceAction(configManager, walletManager, upiRegistryService, upiId, options));

program
  .command('history <upi-id>')
  .description('View transaction history for a UPI ID')
  .option('-l, --limit <number>', 'Limit number of transactions to show', '10')
  .option('-t, --type <type>', 'Filter by transaction type')
  .option('--export <format>', 'Export history (json, csv)')
  .action((upiId, options) => historyAction(configManager, walletManager, upiRegistryService, upiId, options));

program
  .command('list-pairs')
  .description('List all UPI-wallet pairs')
  .option('-d, --detailed', 'Show detailed information')
  .option('--export <format>', 'Export pairs (json, csv)')
  .action((options) => listPairsAction(configManager, walletManager, upiRegistryService, options));

program
  .command('export')
  .description('Export all data to JSON/CSV')
  .option('-f, --format <format>', 'Export format (json, csv)', 'json')
  .option('--include-private-keys', 'Include private keys in export (DANGEROUS)')
  .option('--include-history', 'Include transaction history in export')
  .action((options) => exportAction(configManager, walletManager, upiRegistryService, options));

// Add interactive command
program.addCommand(interactiveCommand);

// Add global options
program
  .option('-n, --network <network>', 'Aptos network (devnet, testnet, mainnet)', 'devnet')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--config <path>', 'Custom config file path');

// Handle global options
program.hook('preAction', (thisCommand, actionCommand) => {
  const options = thisCommand.opts();
  
  if (options.network) {
    configManager.setNetwork(options.network);
  }
  
  if (options.verbose) {
    process.env.VERBOSE = 'true';
  }
  
  if (options.config) {
    configManager.setConfigPath(options.config);
  }
});

// Show help if no command provided
if (process.argv.length <= 2) {
  console.log(chalk.cyan('\n🚀 P2M Merchant CLI'));
  console.log(chalk.gray('Manage your UPI registrations on Aptos blockchain\n'));
  program.help();
}

// Parse command line arguments
program.parse();
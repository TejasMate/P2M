#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const OnChainConfigManager_1 = require("./config/OnChainConfigManager");
const UPIRegistryService_1 = require("./services/UPIRegistryService");
const WalletManager_1 = require("./wallet/WalletManager");
const init_1 = require("./commands/init");
const add_upi_1 = require("./commands/add-upi");
const generate_1 = require("./commands/generate");
const balance_1 = require("./commands/balance");
const history_1 = require("./commands/history");
const list_pairs_1 = require("./commands/list-pairs");
const export_1 = require("./commands/export");
const interactive_1 = require("./commands/interactive");
const register_1 = require("./commands/register");
const program = new commander_1.Command();
program
    .name('aptos-p2m')
    .description('P2M Merchant CLI for UPI registration and management on Aptos blockchain')
    .version('1.0.0');
process.on('uncaughtException', (error) => {
    console.error(chalk_1.default.red('\n❌ Uncaught Exception:'), error.message);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk_1.default.red('\n❌ Unhandled Rejection at:'), promise, 'reason:', reason);
    process.exit(1);
});
const configManager = new OnChainConfigManager_1.OnChainConfigManager();
const walletManager = new WalletManager_1.WalletManager(configManager);
const upiRegistryService = new UPIRegistryService_1.UPIRegistryService(configManager, walletManager);
program
    .command('init')
    .description('Initialize P2M CLI configuration')
    .option('-r, --reset', 'Reset existing configuration')
    .option('-n, --network <network>', 'Network to use (devnet, testnet, mainnet)')
    .option('-c, --contract <address>', 'Contract address')
    .option('-k, --private-key <key>', 'Private key for merchant wallet')
    .option('--non-interactive', 'Run in non-interactive mode')
    .action((options) => (0, init_1.initAction)(configManager, walletManager, upiRegistryService, options));
program
    .command('add-upi <upi-id>')
    .description('Add a UPI ID to your merchant account')
    .option('-f, --force', 'Force add even if UPI ID already exists')
    .action((upiId, options) => (0, add_upi_1.addUpiAction)(configManager, walletManager, upiRegistryService, upiId, options));
program
    .command('update-upi <old-upi-id> <new-upi-id>')
    .description('Update an existing UPI ID to a new one')
    .option('-f, --force', 'Force update without confirmation')
    .action(async (oldUpiId, newUpiId, options) => {
    const { updateUpiAction } = await Promise.resolve().then(() => __importStar(require('./commands/update-upi')));
    updateUpiAction(configManager, walletManager, upiRegistryService, oldUpiId, newUpiId, options);
});
program
    .command('delete-upi <upi-id>')
    .description('Delete a UPI ID and its associated escrow wallet')
    .option('-f, --force', 'Force delete without confirmation')
    .action(async (upiId, options) => {
    const { deleteUpiAction } = await Promise.resolve().then(() => __importStar(require('./commands/delete-upi')));
    deleteUpiAction(configManager, walletManager, upiRegistryService, upiId, options);
});
program
    .command('generate <upi-id>')
    .description('Generate escrow wallet for a UPI ID')
    .option('-r, --regenerate', 'Regenerate wallet even if one already exists')
    .action((upiId, options) => (0, generate_1.generateAction)(configManager, walletManager, upiRegistryService, upiId, options));
program
    .command('balance <upi-id>')
    .description('Check balance of escrow wallet for a UPI ID')
    .option('-r, --refresh', 'Refresh balance from blockchain')
    .action((upiId, options) => (0, balance_1.balanceAction)(configManager, walletManager, upiRegistryService, upiId, options));
program
    .command('history <upi-id>')
    .description('View transaction history for a UPI ID')
    .option('-l, --limit <number>', 'Limit number of transactions to show', '10')
    .option('-t, --type <type>', 'Filter by transaction type')
    .option('--export <format>', 'Export history (json, csv)')
    .action((upiId, options) => (0, history_1.historyAction)(configManager, walletManager, upiRegistryService, upiId, options));
program
    .command('list-pairs')
    .description('List all UPI-wallet pairs')
    .option('-d, --detailed', 'Show detailed information')
    .option('--export <format>', 'Export pairs (json, csv)')
    .action((options) => (0, list_pairs_1.listPairsAction)(configManager, walletManager, upiRegistryService, options));
program
    .command('export')
    .description('Export all data to JSON/CSV')
    .option('-f, --format <format>', 'Export format (json, csv)', 'json')
    .option('--include-private-keys', 'Include private keys in export (DANGEROUS)')
    .option('--include-history', 'Include transaction history in export')
    .action((options) => (0, export_1.exportAction)(configManager, walletManager, upiRegistryService, options));
program.addCommand((0, register_1.registerCommand)(configManager, upiRegistryService));
program.addCommand(interactive_1.interactiveCommand);
program
    .option('-n, --network <network>', 'Aptos network (devnet, testnet, mainnet)', 'devnet')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('--config <path>', 'Custom config file path');
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
if (process.argv.length <= 2) {
    console.log(chalk_1.default.cyan('\n🚀 P2M Merchant CLI'));
    console.log(chalk_1.default.gray('Manage your UPI registrations on Aptos blockchain\n'));
    program.help();
}
program.parse();
//# sourceMappingURL=index.js.map
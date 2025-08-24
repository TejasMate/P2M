"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAction = exportAction;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
async function exportAction(configManager, walletManager, upiRegistryService, options) {
    try {
        console.log(chalk_1.default.cyan('\n📤 Export Data'));
        console.log(chalk_1.default.gray('Exporting P2M merchant data\n'));
        if (!configManager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CLI not initialized. Run `aptos-p2m init` first.'));
            return;
        }
        const config = configManager.exportConfig();
        const upiIds = await configManager.getUPIIds();
        const escrowWallets = await configManager.getEscrowWallets();
        if (upiIds.length === 0) {
            console.log(chalk_1.default.yellow('📭 No data to export. Add UPI IDs first.'));
            console.log(chalk_1.default.gray('Add your first UPI ID: aptos-p2m add-upi <upi-id>'));
            return;
        }
        const format = options.format || 'json';
        const includePrivateKeys = options.includePrivateKeys || false;
        const includeHistory = options.includeHistory || false;
        console.log(chalk_1.default.cyan('📋 Export Configuration:'));
        console.log(chalk_1.default.gray(`Format: ${format.toUpperCase()}`));
        console.log(chalk_1.default.gray(`Include Private Keys: ${includePrivateKeys ? chalk_1.default.red('Yes') : chalk_1.default.green('No')}`));
        console.log(chalk_1.default.gray(`Include Transaction History: ${includeHistory ? 'Yes' : 'No'}`));
        console.log(chalk_1.default.gray(`UPI IDs: ${upiIds.length}`));
        console.log(chalk_1.default.gray(`Escrow Wallets: ${Object.keys(escrowWallets).length}`));
        console.log();
        if (includePrivateKeys) {
            console.log(chalk_1.default.red('⚠️  WARNING: Export will include private keys!'));
            console.log(chalk_1.default.red('   Keep the exported file secure and never share it.'));
            console.log();
        }
        const spinner = (0, ora_1.default)('Preparing export data...').start();
        try {
            const exportData = {
                exportInfo: {
                    version: '1.0.0',
                    exportDate: new Date().toISOString(),
                    network: config.network,
                    contractAddress: config.contractAddress,
                    includesPrivateKeys: includePrivateKeys,
                    includesHistory: includeHistory
                },
                merchant: {
                    totalUpiIds: upiIds.length,
                    generatedWallets: escrowWallets.length,
                    registrationDate: new Date().toISOString()
                },
                upiIds: upiIds,
                pairs: []
            };
            for (const upiId of upiIds) {
                const escrowWallet = escrowWallets.find(w => w.upiId === upiId);
                const pairData = {
                    upiId,
                    hasEscrowWallet: !!escrowWallet
                };
                if (escrowWallet) {
                    pairData.escrowWallet = {
                        address: escrowWallet.escrowAddress,
                        merchantAddress: escrowWallet.merchantAddress,
                        createdAt: new Date(escrowWallet.creationTimestamp * 1000).toISOString()
                    };
                    if (includePrivateKeys) {
                        pairData.escrowWallet.note = 'Private keys not available in on-chain data';
                    }
                    if (includeHistory) {
                        spinner.text = `Fetching history for ${upiId}...`;
                        try {
                            const transactions = await upiRegistryService.getTransactionHistory(escrowWallet.escrowAddress, 100);
                            pairData.transactionHistory = {
                                totalTransactions: transactions.length,
                                transactions: transactions.map(tx => ({
                                    timestamp: tx.timestamp,
                                    type: tx.type,
                                    amount: tx.amount,
                                    success: tx.success,
                                    hash: tx.hash
                                }))
                            };
                        }
                        catch (error) {
                            pairData.transactionHistory = {
                                error: 'Failed to fetch transaction history',
                                totalTransactions: 0,
                                transactions: []
                            };
                        }
                    }
                }
                exportData.pairs.push(pairData);
            }
            spinner.succeed('Export data prepared');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const baseFilename = `p2m-export-${timestamp}`;
            const fs = require('fs');
            const path = require('path');
            if (format.toLowerCase() === 'json') {
                const filename = `${baseFilename}.json`;
                fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
                console.log(chalk_1.default.green(`\n✅ Data exported to ${filename}`));
                console.log(chalk_1.default.gray(`File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`));
            }
            else if (format.toLowerCase() === 'csv') {
                const filename = `${baseFilename}.csv`;
                let csvContent = 'UPI ID,Wallet Address,Public Key,Created At,Has Wallet';
                if (includePrivateKeys) {
                    csvContent += ',Private Key';
                }
                csvContent += '\n';
                exportData.pairs.forEach((pair) => {
                    const wallet = pair.escrowWallet;
                    let row = `${pair.upiId},${wallet?.address || 'N/A'},${wallet?.publicKey || 'N/A'},${wallet?.createdAt ? new Date(wallet.createdAt).toISOString() : 'N/A'},${pair.hasEscrowWallet}`;
                    if (includePrivateKeys) {
                        row += `,${wallet?.privateKey || 'N/A'}`;
                    }
                    csvContent += row + '\n';
                });
                fs.writeFileSync(filename, csvContent);
                console.log(chalk_1.default.green(`\n✅ Data exported to ${filename}`));
                console.log(chalk_1.default.gray(`File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`));
            }
            else {
                console.log(chalk_1.default.red('❌ Unsupported export format. Use json or csv.'));
                return;
            }
            console.log(chalk_1.default.cyan('\n📊 Export Summary:'));
            console.log(chalk_1.default.gray(`• UPI IDs exported: ${exportData.upiIds.length}`));
            console.log(chalk_1.default.gray(`• Escrow wallets: ${exportData.pairs.filter((p) => p.hasEscrowWallet).length}`));
            if (includeHistory) {
                const totalTransactions = exportData.pairs.reduce((sum, pair) => sum + (pair.transactionHistory?.totalTransactions || 0), 0);
                console.log(chalk_1.default.gray(`• Total transactions: ${totalTransactions}`));
            }
            if (includePrivateKeys) {
                console.log(chalk_1.default.red('\n🔐 SECURITY WARNING:'));
                console.log(chalk_1.default.red('   This export contains private keys!'));
                console.log(chalk_1.default.red('   • Store the file securely'));
                console.log(chalk_1.default.red('   • Never share or upload it'));
                console.log(chalk_1.default.red('   • Delete it when no longer needed'));
            }
            console.log(chalk_1.default.yellow('\n📥 Import Instructions:'));
            console.log(chalk_1.default.gray('To import this data on another machine:'));
            console.log(chalk_1.default.gray('1. Install the P2M CLI tool'));
            console.log(chalk_1.default.gray('2. Run: aptos-p2m init'));
            console.log(chalk_1.default.gray('3. Manually restore configuration from the export file'));
            console.log(chalk_1.default.yellow('\n🎯 Available Actions:'));
            console.log(chalk_1.default.gray('• Export with history: aptos-p2m export --include-history'));
            console.log(chalk_1.default.gray('• Export as CSV: aptos-p2m export --format csv'));
            console.log(chalk_1.default.gray('• List all pairs: aptos-p2m list-pairs'));
            console.log(chalk_1.default.gray('• Check balances: aptos-p2m balance <upi-id>'));
        }
        catch (error) {
            spinner.fail('Failed to prepare export data');
            throw error;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Failed to export data:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
//# sourceMappingURL=export.js.map
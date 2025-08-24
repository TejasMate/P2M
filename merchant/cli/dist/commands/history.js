"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyAction = historyAction;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const table_1 = require("table");
async function historyAction(configManager, walletManager, upiRegistryService, upiId, options) {
    try {
        console.log(chalk_1.default.cyan('\n📜 Transaction History'));
        console.log(chalk_1.default.gray(`Viewing history for UPI ID: ${upiId}\n`));
        if (!configManager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CLI not initialized. Run `aptos-p2m init` first.'));
            return;
        }
        if (!configManager.hasUPIId(upiId)) {
            console.log(chalk_1.default.red(`❌ UPI ID '${upiId}' not found in local configuration.`));
            console.log(chalk_1.default.gray(`Add it first: aptos-p2m add-upi ${upiId}`));
            return;
        }
        const escrowWallet = await configManager.getEscrowWallet(upiId);
        if (!escrowWallet) {
            console.log(chalk_1.default.red(`❌ No escrow wallet found for UPI ID '${upiId}'.`));
            console.log(chalk_1.default.gray(`Generate one first: aptos-p2m generate ${upiId}`));
            return;
        }
        console.log(chalk_1.default.cyan('📋 Wallet Information:'));
        console.log(chalk_1.default.gray(`UPI ID: ${upiId}`));
        console.log(chalk_1.default.gray(`Address: ${escrowWallet.escrowAddress}`));
        console.log(chalk_1.default.gray(`Network: ${configManager.getNetwork()}`));
        console.log();
        const spinner = (0, ora_1.default)('Fetching transaction history...').start();
        try {
            const limit = parseInt(options.limit || '10');
            const transactions = await upiRegistryService.getTransactionHistory(escrowWallet.escrowAddress, limit);
            spinner.succeed(`Found ${transactions.length} transactions`);
            if (transactions.length === 0) {
                console.log(chalk_1.default.yellow('📭 No transactions found for this wallet.'));
                console.log(chalk_1.default.gray('This wallet hasn\'t been used yet or is very new.'));
                return;
            }
            let filteredTransactions = transactions;
            if (options.type) {
                filteredTransactions = transactions.filter(tx => tx.type?.toLowerCase().includes(options.type.toLowerCase()));
                console.log(chalk_1.default.gray(`Filtered to ${filteredTransactions.length} transactions of type '${options.type}'`));
            }
            const tableData = [
                ['Date', 'Type', 'Amount', 'Status', 'Hash']
            ];
            filteredTransactions.forEach((tx) => {
                const date = new Date(tx.timestamp).toLocaleDateString();
                const time = new Date(tx.timestamp).toLocaleTimeString();
                const type = tx.type || 'Transfer';
                const amount = tx.amount ? `${tx.amount} APT` : 'N/A';
                const status = tx.success ? chalk_1.default.green('✅ Success') : chalk_1.default.red('❌ Failed');
                const hash = tx.hash.substring(0, 12) + '...';
                tableData.push([
                    `${date}\n${time}`,
                    type,
                    amount,
                    status,
                    hash
                ]);
            });
            console.log(chalk_1.default.cyan('\n📊 Transaction History:'));
            console.log((0, table_1.table)(tableData, {
                border: {
                    topBody: '─',
                    topJoin: '┬',
                    topLeft: '┌',
                    topRight: '┐',
                    bottomBody: '─',
                    bottomJoin: '┴',
                    bottomLeft: '└',
                    bottomRight: '┘',
                    bodyLeft: '│',
                    bodyRight: '│',
                    bodyJoin: '│',
                    joinBody: '─',
                    joinLeft: '├',
                    joinRight: '┤',
                    joinJoin: '┼'
                },
                columnDefault: {
                    width: 15,
                    wrapWord: true
                }
            }));
            const successfulTxs = filteredTransactions.filter(tx => tx.success).length;
            const failedTxs = filteredTransactions.filter(tx => !tx.success).length;
            const totalAmount = filteredTransactions
                .filter(tx => tx.amount && tx.success)
                .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
            console.log(chalk_1.default.cyan('\n📈 Summary:'));
            console.log(chalk_1.default.gray(`• Total Transactions: ${filteredTransactions.length}`));
            console.log(chalk_1.default.gray(`• Successful: ${chalk_1.default.green(successfulTxs)}`));
            console.log(chalk_1.default.gray(`• Failed: ${chalk_1.default.red(failedTxs)}`));
            console.log(chalk_1.default.gray(`• Total Volume: ${totalAmount.toFixed(4)} APT`));
            if (options.export) {
                const exportSpinner = (0, ora_1.default)('Exporting transaction history...').start();
                try {
                    const exportData = {
                        upiId,
                        walletAddress: escrowWallet.escrowAddress,
                        network: configManager.getNetwork(),
                        exportDate: new Date().toISOString(),
                        transactions: filteredTransactions
                    };
                    const fs = require('fs');
                    const path = require('path');
                    if (options.export.toLowerCase() === 'json') {
                        const filename = `history_${upiId.replace('@', '_')}_${Date.now()}.json`;
                        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
                        exportSpinner.succeed(`History exported to ${filename}`);
                    }
                    else if (options.export.toLowerCase() === 'csv') {
                        const filename = `history_${upiId.replace('@', '_')}_${Date.now()}.csv`;
                        const csvHeader = 'Date,Type,Amount,Status,Hash\n';
                        const csvRows = filteredTransactions.map(tx => `${new Date(tx.timestamp).toISOString()},${tx.type || 'Transfer'},${tx.amount || 'N/A'},${tx.success ? 'Success' : 'Failed'},${tx.hash}`).join('\n');
                        fs.writeFileSync(filename, csvHeader + csvRows);
                        exportSpinner.succeed(`History exported to ${filename}`);
                    }
                    else {
                        exportSpinner.fail('Unsupported export format. Use json or csv.');
                    }
                }
                catch (error) {
                    exportSpinner.fail('Failed to export history');
                    console.error(chalk_1.default.red('Export error:'), error);
                }
            }
            console.log(chalk_1.default.yellow('\n🎯 Available Actions:'));
            console.log(chalk_1.default.gray(`• Check balance: aptos-p2m balance ${upiId}`));
            console.log(chalk_1.default.gray('• List all pairs: aptos-p2m list-pairs'));
            console.log(chalk_1.default.gray('• Export history: aptos-p2m history ${upiId} --export json'));
        }
        catch (error) {
            spinner.fail('Failed to fetch transaction history');
            throw error;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Failed to fetch transaction history:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
//# sourceMappingURL=history.js.map
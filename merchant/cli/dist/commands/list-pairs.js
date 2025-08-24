"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPairsAction = listPairsAction;
const chalk_1 = __importDefault(require("chalk"));
const table_1 = require("table");
async function listPairsAction(configManager, walletManager, upiRegistryService, options) {
    try {
        console.log(chalk_1.default.cyan('\n📋 UPI-Wallet Pairs'));
        console.log(chalk_1.default.gray('Listing all registered UPI IDs and their escrow wallets\n'));
        if (!configManager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CLI not initialized. Run `aptos-p2m init` first.'));
            return;
        }
        const config = configManager.exportConfig();
        const upiIds = await configManager.getUPIIds();
        const escrowWallets = await configManager.getEscrowWallets();
        if (upiIds.length === 0) {
            console.log(chalk_1.default.yellow('📭 No UPI IDs found on blockchain.'));
            console.log(chalk_1.default.gray('Add your first UPI ID: aptos-p2m add-upi <upi-id>'));
            return;
        }
        console.log(chalk_1.default.cyan('📊 Configuration Summary:'));
        console.log(chalk_1.default.gray(`Network: ${config.network}`));
        console.log(chalk_1.default.gray(`Contract: ${config.contractAddress}`));
        console.log(chalk_1.default.gray(`Total UPI IDs: ${upiIds.length}`));
        console.log(chalk_1.default.gray(`Escrow Wallets: ${escrowWallets.length}`));
        console.log();
        const tableData = [
            ['UPI ID', 'Escrow Wallet', 'Status', 'Actions']
        ];
        for (const upiId of upiIds) {
            const escrowWallet = escrowWallets.find(w => w.upiId === upiId);
            let status = '';
            let actions = '';
            if (escrowWallet) {
                status = chalk_1.default.green('✅ Generated');
                actions = 'balance, history';
            }
            else {
                status = chalk_1.default.yellow('⚠️ No Wallet');
                actions = 'generate';
            }
            const walletAddress = escrowWallet ?
                `${escrowWallet.escrowAddress.substring(0, 8)}...${escrowWallet.escrowAddress.substring(escrowWallet.escrowAddress.length - 6)}` :
                chalk_1.default.gray('Not generated');
            tableData.push([
                upiId,
                walletAddress,
                status,
                chalk_1.default.gray(actions)
            ]);
        }
        console.log(chalk_1.default.cyan('🔗 UPI-Wallet Pairs:'));
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
                width: 20,
                wrapWord: true
            },
            columns: {
                0: { width: 25 },
                1: { width: 20 },
                2: { width: 15 },
                3: { width: 20 }
            }
        }));
        if (options.detailed) {
            console.log(chalk_1.default.cyan('\n🔍 Detailed Information:'));
            for (const upiId of upiIds) {
                const escrowWallet = escrowWallets.find(w => w.upiId === upiId);
                console.log(chalk_1.default.yellow(`\n📌 ${upiId}`));
                if (escrowWallet) {
                    console.log(chalk_1.default.gray(`  Address: ${escrowWallet.escrowAddress}`));
                    console.log(chalk_1.default.gray(`  Merchant: ${escrowWallet.merchantAddress}`));
                    console.log(chalk_1.default.gray(`  Created: ${new Date(escrowWallet.creationTimestamp * 1000).toLocaleString()}`));
                    console.log(chalk_1.default.gray('  Available Commands:'));
                    console.log(chalk_1.default.gray(`    • aptos-p2m balance ${upiId}`));
                    console.log(chalk_1.default.gray(`    • aptos-p2m history ${upiId}`));
                }
                else {
                    console.log(chalk_1.default.gray('  Status: No escrow wallet generated'));
                    console.log(chalk_1.default.gray('  Available Commands:'));
                    console.log(chalk_1.default.gray(`    • aptos-p2m generate ${upiId}`));
                }
            }
        }
        const generatedWallets = Object.keys(escrowWallets).length;
        const pendingGeneration = upiIds.length - generatedWallets;
        console.log(chalk_1.default.cyan('\n📈 Statistics:'));
        console.log(chalk_1.default.gray(`• Total UPI IDs: ${upiIds.length}`));
        console.log(chalk_1.default.gray(`• Generated Wallets: ${chalk_1.default.green(generatedWallets)}`));
        console.log(chalk_1.default.gray(`• Pending Generation: ${chalk_1.default.yellow(pendingGeneration)}`));
        if (pendingGeneration > 0) {
            console.log(chalk_1.default.yellow('\n⚠️ Some UPI IDs don\'t have escrow wallets yet.'));
            console.log(chalk_1.default.gray('Generate wallets for:'));
            upiIds.forEach(upiId => {
                const hasWallet = escrowWallets.find(w => w.upiId === upiId);
                if (!hasWallet) {
                    console.log(chalk_1.default.gray(`  • aptos-p2m generate ${upiId}`));
                }
            });
        }
        if (options.export) {
            try {
                const exportData = {
                    network: config.network,
                    contractAddress: config.contractAddress,
                    exportDate: new Date().toISOString(),
                    totalUpiIds: upiIds.length,
                    generatedWallets: generatedWallets,
                    pairs: upiIds.map(upiId => {
                        const wallet = escrowWallets.find(w => w.upiId === upiId);
                        return {
                            upiId,
                            escrowWallet: wallet || null,
                            hasWallet: !!wallet
                        };
                    })
                };
                const fs = require('fs');
                if (options.export.toLowerCase() === 'json') {
                    const filename = `pairs_${Date.now()}.json`;
                    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
                    console.log(chalk_1.default.green(`\n✅ Pairs exported to ${filename}`));
                }
                else if (options.export.toLowerCase() === 'csv') {
                    const filename = `pairs_${Date.now()}.csv`;
                    const csvHeader = 'UPI ID,Wallet Address,Public Key,Created At,Has Wallet\n';
                    const csvRows = upiIds.map(upiId => {
                        const wallet = escrowWallets.find(w => w.upiId === upiId);
                        return `${upiId},${wallet?.escrowAddress || 'N/A'},${wallet?.merchantAddress || 'N/A'},${wallet ? new Date(wallet.creationTimestamp * 1000).toISOString() : 'N/A'},${!!wallet}`;
                    }).join('\n');
                    fs.writeFileSync(filename, csvHeader + csvRows);
                    console.log(chalk_1.default.green(`\n✅ Pairs exported to ${filename}`));
                }
                else {
                    console.log(chalk_1.default.red('❌ Unsupported export format. Use json or csv.'));
                }
            }
            catch (error) {
                console.error(chalk_1.default.red('❌ Failed to export pairs:'), error);
            }
        }
        console.log(chalk_1.default.yellow('\n🎯 Available Actions:'));
        console.log(chalk_1.default.gray('• Add new UPI ID: aptos-p2m add-upi <upi-id>'));
        console.log(chalk_1.default.gray('• Generate wallet: aptos-p2m generate <upi-id>'));
        console.log(chalk_1.default.gray('• Check balance: aptos-p2m balance <upi-id>'));
        console.log(chalk_1.default.gray('• View detailed info: aptos-p2m list-pairs --detailed'));
        console.log(chalk_1.default.gray('• Export data: aptos-p2m list-pairs --export json'));
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Failed to list pairs:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
//# sourceMappingURL=list-pairs.js.map
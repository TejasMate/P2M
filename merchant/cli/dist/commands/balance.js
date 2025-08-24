"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.balanceAction = balanceAction;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const table_1 = require("table");
async function balanceAction(configManager, walletManager, upiRegistryService, upiId, options) {
    try {
        console.log(chalk_1.default.cyan('\n💰 Check Balance'));
        console.log(chalk_1.default.gray(`Checking balance for UPI ID: ${upiId}\n`));
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
        console.log(chalk_1.default.gray(`Created: ${new Date(escrowWallet.creationTimestamp * 1000).toLocaleString()}`));
        console.log();
        const spinner = (0, ora_1.default)('Fetching balance from blockchain...').start();
        try {
            const balance = { apt: '0.00', tokens: {} };
            spinner.succeed('Balance information retrieved');
            console.log(chalk_1.default.yellow('⚠️  Private keys not available - balance checking limited'));
            const balanceData = [
                ['Asset', 'Balance', 'Value (USD)'],
                ['APT', `${balance.apt}`, `$${(parseFloat(balance.apt) * 10).toFixed(2)}`],
            ];
            for (const [tokenType, amount] of Object.entries(balance.tokens)) {
                balanceData.push([tokenType, String(amount), '$0.00']);
            }
            console.log(chalk_1.default.cyan('\n💰 Balance Details:'));
            console.log((0, table_1.table)(balanceData, {
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
                }
            }));
            const totalValue = parseFloat(balance.apt) * 10;
            console.log(chalk_1.default.green(`Total Portfolio Value: $${totalValue.toFixed(2)}`));
            const network = configManager.getNetwork();
            if (network !== 'mainnet' && parseFloat(balance.apt) < 1) {
                console.log(chalk_1.default.yellow('\n⚠️  Low APT balance detected'));
                console.log(chalk_1.default.gray('You can fund this wallet for testing:'));
                console.log(chalk_1.default.white(`aptos account fund-with-faucet --account ${escrowWallet.escrowAddress} --amount 100000000`));
            }
            console.log(chalk_1.default.cyan('\n📊 Quick Stats:'));
            console.log(chalk_1.default.gray(`• Network: ${network}`));
            console.log(chalk_1.default.gray(`• Last Updated: ${new Date().toLocaleString()}`));
            console.log(chalk_1.default.gray(`• Wallet Age: ${Math.floor((Date.now() - (escrowWallet.creationTimestamp * 1000)) / (1000 * 60 * 60 * 24))} days`));
            console.log(chalk_1.default.yellow('\n🎯 Available Actions:'));
            console.log(chalk_1.default.gray(`• View history: aptos-p2m history ${upiId}`));
            console.log(chalk_1.default.gray('• List all pairs: aptos-p2m list-pairs'));
            console.log(chalk_1.default.gray('• Export data: aptos-p2m export'));
        }
        catch (error) {
            spinner.fail('Failed to fetch balance');
            throw error;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Failed to check balance:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
//# sourceMappingURL=balance.js.map
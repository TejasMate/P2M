"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = statusCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const table_1 = require("table");
function statusCommand(configManager, walletManager, upiRegistryService) {
    const command = new commander_1.Command('status');
    command
        .description('Check CLI and system status')
        .option('--detailed', 'Show detailed system information')
        .option('--check-contract', 'Verify contract deployment status')
        .action(async (options) => {
        try {
            console.log(chalk_1.default.cyan('\n🔍 P2M CLI Status Check'));
            console.log(chalk_1.default.gray('='.repeat(50)));
            const isInitialized = configManager.isInitialized();
            console.log(chalk_1.default.bold('\n📋 CLI Configuration'));
            console.log(chalk_1.default.gray('Initialized:'), isInitialized ? chalk_1.default.green('✅ Yes') : chalk_1.default.red('❌ No'));
            if (!isInitialized) {
                console.log(chalk_1.default.yellow('\n⚠️  CLI not initialized. Run `p2m-cli init` to get started.'));
                return;
            }
            const config = configManager.exportConfig();
            console.log(chalk_1.default.gray('Network:'), chalk_1.default.white(config.network));
            console.log(chalk_1.default.gray('Config File:'), chalk_1.default.white(configManager.getConfigPath()));
            console.log(chalk_1.default.bold('\n💼 Wallet Information'));
            const hasWallet = !!config.privateKey;
            console.log(chalk_1.default.gray('Wallet Configured:'), hasWallet ? chalk_1.default.green('✅ Yes') : chalk_1.default.red('❌ No'));
            if (hasWallet) {
                try {
                    const accountInfo = await walletManager.exportAccountInfo();
                    if (!accountInfo) {
                        console.log(chalk_1.default.red('❌ Failed to get account information'));
                        return;
                    }
                    console.log(chalk_1.default.gray('Address:'), chalk_1.default.white(accountInfo.address));
                    console.log(chalk_1.default.gray('Public Key:'), chalk_1.default.white(accountInfo.publicKey));
                    const spinner = (0, ora_1.default)('Checking wallet balance...').start();
                    try {
                        const balance = await walletManager.getBalance();
                        spinner.succeed(`Balance: ${balance.apt} APT`);
                        const balanceNum = parseFloat(balance.apt);
                        if (balanceNum < 0.01) {
                            console.log(chalk_1.default.red('⚠️  Low balance! You may need more APT for transactions.'));
                            if (config.network !== 'mainnet') {
                                console.log(chalk_1.default.gray('💡 Fund your account: '), chalk_1.default.white('p2m-cli balance --fund'));
                            }
                        }
                    }
                    catch (error) {
                        spinner.fail('Failed to fetch balance');
                        console.log(chalk_1.default.red('❌ Balance check failed:'), error);
                    }
                }
                catch (error) {
                    console.log(chalk_1.default.red('❌ Wallet error:'), error);
                }
            }
            console.log(chalk_1.default.bold('\n📜 Smart Contract'));
            const contractAddress = config.contractAddress;
            console.log(chalk_1.default.gray('Contract Address:'), contractAddress ? chalk_1.default.white(contractAddress) : chalk_1.default.red('Not set'));
            if (options.checkContract && contractAddress) {
                const spinner = (0, ora_1.default)('Verifying contract deployment...').start();
                try {
                    const stats = await upiRegistryService.getRegistryStats();
                    spinner.succeed('Contract is deployed and accessible');
                    console.log(chalk_1.default.gray('Total Merchants:'), chalk_1.default.white(stats.total_merchants));
                    console.log(chalk_1.default.gray('Total UPI IDs:'), chalk_1.default.white(stats.total_upi_mappings));
                }
                catch (error) {
                    spinner.fail('Contract verification failed');
                    console.log(chalk_1.default.red('❌ Contract issue:'), error);
                    console.log(chalk_1.default.yellow('💡 Make sure the contract address is correct and deployed.'));
                }
            }
            console.log(chalk_1.default.bold('\n🏪 Merchant Registration'));
            const merchantInfo = await configManager.getMerchantInfo();
            const isRegistered = !!merchantInfo;
            console.log(chalk_1.default.gray('Registered:'), isRegistered ? chalk_1.default.green('✅ Yes') : chalk_1.default.red('❌ No'));
            if (isRegistered && merchantInfo) {
                console.log(chalk_1.default.gray('Business Name:'), chalk_1.default.white(merchantInfo.businessName));
                console.log(chalk_1.default.gray('Contact Info:'), chalk_1.default.white(merchantInfo.contactInfo));
                console.log(chalk_1.default.gray('Registration Date:'), chalk_1.default.white('Available on-chain'));
                if (contractAddress && hasWallet) {
                    const spinner = (0, ora_1.default)('Verifying on-chain registration...').start();
                    try {
                        const accountInfo = await walletManager.exportAccountInfo();
                        if (!accountInfo) {
                            spinner.fail('Failed to get account information');
                            return;
                        }
                        const onChainMerchant = await upiRegistryService.getMerchantInfo(accountInfo.address);
                        if (onChainMerchant) {
                            spinner.succeed('On-chain registration verified');
                        }
                        else {
                            spinner.warn('Local registration found but not on-chain');
                            console.log(chalk_1.default.yellow('💡 Complete registration: '), chalk_1.default.white('p2m-cli register'));
                        }
                    }
                    catch (error) {
                        spinner.fail('Failed to verify on-chain registration');
                    }
                }
            }
            else {
                console.log(chalk_1.default.yellow('💡 Register as merchant: '), chalk_1.default.white('p2m-cli register'));
            }
            console.log(chalk_1.default.bold('\n💳 UPI IDs'));
            const upiIds = await configManager.getUPIIds();
            console.log(chalk_1.default.gray('Local UPI IDs:'), chalk_1.default.white(upiIds.length));
            if (upiIds.length > 0) {
                console.log(chalk_1.default.gray('UPI IDs:'));
                upiIds.forEach((upiId, index) => {
                    console.log(chalk_1.default.gray(`  ${index + 1}.`), chalk_1.default.white(upiId));
                });
                console.log(chalk_1.default.gray('Data Source:'), chalk_1.default.white('On-chain (always current)'));
                if (false) {
                    console.log(chalk_1.default.yellow('💡 Consider syncing: '), chalk_1.default.white('p2m-cli upi sync'));
                }
            }
            else {
                console.log(chalk_1.default.yellow('💡 Add UPI ID: '), chalk_1.default.white('p2m-cli upi add <upi-id>'));
            }
            if (options.detailed) {
                console.log(chalk_1.default.bold('\n🔧 System Information'));
                const tableData = [
                    [chalk_1.default.bold('Component'), chalk_1.default.bold('Status'), chalk_1.default.bold('Details')]
                ];
                tableData.push(['Node.js', chalk_1.default.green('✅'), process.version]);
                try {
                    const packageJson = require('../../package.json');
                    tableData.push(['CLI Version', chalk_1.default.green('✅'), packageJson.version]);
                }
                catch {
                    tableData.push(['CLI Version', chalk_1.default.yellow('⚠️'), 'Unknown']);
                }
                tableData.push(['Network', chalk_1.default.green('✅'), config.network]);
                try {
                    const fs = require('fs');
                    const configPath = configManager.getConfigPath();
                    const stats = fs.statSync(configPath);
                    tableData.push(['Config File', chalk_1.default.green('✅'), `${stats.size} bytes`]);
                }
                catch {
                    tableData.push(['Config File', chalk_1.default.red('❌'), 'Not accessible']);
                }
                console.log('\n' + (0, table_1.table)(tableData, {
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
            }
            console.log(chalk_1.default.bold('\n📊 Overall Status'));
            const statusItems = [
                { name: 'CLI Initialized', status: isInitialized },
                { name: 'Wallet Configured', status: hasWallet },
                { name: 'Contract Set', status: !!contractAddress },
                { name: 'Merchant Registered', status: isRegistered },
                { name: 'UPI IDs Added', status: upiIds.length > 0 }
            ];
            const completedItems = statusItems.filter(item => item.status).length;
            const totalItems = statusItems.length;
            const completionPercentage = Math.round((completedItems / totalItems) * 100);
            console.log(chalk_1.default.gray('Setup Progress:'), chalk_1.default.white(`${completedItems}/${totalItems} (${completionPercentage}%)`));
            const progressBarLength = 20;
            const filledLength = Math.round((completedItems / totalItems) * progressBarLength);
            const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);
            console.log(chalk_1.default.gray('Progress:'), chalk_1.default.green(progressBar));
            if (completionPercentage < 100) {
                console.log(chalk_1.default.bold('\n🎯 Next Steps'));
                statusItems.forEach(item => {
                    if (!item.status) {
                        switch (item.name) {
                            case 'CLI Initialized':
                                console.log(chalk_1.default.gray('•'), chalk_1.default.white('p2m-cli init'));
                                break;
                            case 'Merchant Registered':
                                console.log(chalk_1.default.gray('•'), chalk_1.default.white('p2m-cli register'));
                                break;
                            case 'UPI IDs Added':
                                console.log(chalk_1.default.gray('•'), chalk_1.default.white('p2m-cli upi add <upi-id>'));
                                break;
                        }
                    }
                });
            }
            else {
                console.log(chalk_1.default.green('\n🎉 All setup complete! Your P2M CLI is ready to use.'));
            }
            console.log(chalk_1.default.gray('\n' + '='.repeat(50)));
        }
        catch (error) {
            console.error(chalk_1.default.red('\n❌ Status check failed:'), error);
            process.exit(1);
        }
    });
    return command;
}
//# sourceMappingURL=status.js.map
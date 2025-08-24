"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upiCommand = upiCommand;
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const table_1 = require("table");
function upiCommand(configManager, upiRegistryService) {
    const command = new commander_1.Command('upi');
    command.description('Manage UPI IDs for your merchant account');
    command
        .command('add <upi-id>')
        .description('Add a new UPI ID to your merchant account')
        .option('-f, --force', 'Force add even if UPI ID exists')
        .action(async (upiId, options) => {
        try {
            console.log(chalk_1.default.cyan('\n💳 Add UPI ID'));
            console.log(chalk_1.default.gray(`Adding UPI ID: ${upiId}\n`));
            if (!configManager.isInitialized()) {
                console.log(chalk_1.default.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
                return;
            }
            if (!configManager.isMerchantRegistered()) {
                console.log(chalk_1.default.red('❌ Merchant not registered. Run `p2m-cli register` first.'));
                return;
            }
            if (!isValidUPIId(upiId)) {
                console.log(chalk_1.default.red('❌ Invalid UPI ID format.'));
                console.log(chalk_1.default.gray('Expected format: username@bank (e.g., john.doe@paytm)'));
                return;
            }
            if (await configManager.hasUPIId(upiId) && !options.force) {
                console.log(chalk_1.default.yellow('⚠️  UPI ID already exists in local config.'));
                const { shouldContinue } = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'shouldContinue',
                        message: 'Continue with blockchain registration?',
                        default: true,
                    },
                ]);
                if (!shouldContinue)
                    return;
            }
            const spinner = (0, ora_1.default)('Checking UPI ID availability...').start();
            try {
                const exists = await upiRegistryService.upiExists(upiId);
                if (exists && !options.force) {
                    spinner.fail('UPI ID already registered');
                    try {
                        const ownerAddress = await upiRegistryService.getMerchantByUPI(upiId);
                        const currentAddress = configManager.exportConfig().privateKey ?
                            require('@aptos-labs/ts-sdk').Account.fromPrivateKey({
                                privateKey: new (require('@aptos-labs/ts-sdk').Ed25519PrivateKey)(configManager.getPrivateKey())
                            }).accountAddress.toString() : 'unknown';
                        if (ownerAddress.toLowerCase() === currentAddress.toLowerCase()) {
                            console.log(chalk_1.default.yellow('\n⚠️  This UPI ID is already registered to your account.'));
                            console.log(chalk_1.default.green('✅ UPI ID confirmed in on-chain registry.'));
                            return;
                        }
                        else {
                            console.log(chalk_1.default.red('\n❌ This UPI ID is registered to another merchant.'));
                            console.log(chalk_1.default.gray('Owner Address:'), chalk_1.default.white(ownerAddress));
                            return;
                        }
                    }
                    catch (error) {
                        console.log(chalk_1.default.red('\n❌ UPI ID is registered but owner details unavailable.'));
                        return;
                    }
                }
                spinner.succeed('UPI ID available');
            }
            catch (error) {
                spinner.warn('Could not check UPI ID availability, proceeding...');
            }
            console.log(chalk_1.default.blue('\n📋 Registration Details:'));
            console.log(chalk_1.default.gray('UPI ID:'), chalk_1.default.white(upiId));
            console.log(chalk_1.default.gray('Network:'), chalk_1.default.white(configManager.getNetwork()));
            console.log(chalk_1.default.gray('Contract:'), chalk_1.default.white(upiRegistryService.getContractAddress()));
            const { confirmed } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirmed',
                    message: 'Register this UPI ID on blockchain?',
                    default: true,
                },
            ]);
            if (!confirmed) {
                console.log(chalk_1.default.yellow('\n⚠️  Registration cancelled.'));
                return;
            }
            const regSpinner = (0, ora_1.default)('Registering UPI ID on blockchain...').start();
            try {
                const result = await upiRegistryService.registerUPI(upiId);
                if (result.success) {
                    regSpinner.succeed('UPI ID registered successfully!');
                    console.log(chalk_1.default.green('\n🎉 UPI ID registered!'));
                    console.log(chalk_1.default.gray('UPI ID:'), chalk_1.default.white(upiId));
                    console.log(chalk_1.default.gray('Transaction Hash:'), chalk_1.default.white(result.hash));
                    console.log(chalk_1.default.gray('Gas Used:'), chalk_1.default.white(result.gas_used || 'N/A'));
                    console.log(chalk_1.default.gray('Explorer:'), chalk_1.default.blue(upiRegistryService.getTransactionUrl(result.hash)));
                }
                else {
                    regSpinner.fail('UPI ID registration failed');
                    console.log(chalk_1.default.red('\n❌ Registration failed:'));
                    console.log(chalk_1.default.gray('Transaction Hash:'), chalk_1.default.white(result.hash));
                    console.log(chalk_1.default.gray('VM Status:'), chalk_1.default.white(result.vm_status || 'Unknown'));
                    console.log(chalk_1.default.gray('Explorer:'), chalk_1.default.blue(upiRegistryService.getTransactionUrl(result.hash)));
                }
            }
            catch (error) {
                regSpinner.fail('UPI ID registration failed');
                throw error;
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('\n❌ Failed to add UPI ID:'), error);
            const errorMessage = error.toString().toLowerCase();
            if (errorMessage.includes('already_registered')) {
                console.log(chalk_1.default.yellow('\n💡 Tip: This UPI ID is already registered. Use --force to override.'));
            }
            else if (errorMessage.includes('insufficient')) {
                console.log(chalk_1.default.yellow('\n💡 Tip: You may need more APT for gas fees.'));
                console.log(chalk_1.default.gray('Check balance: '), chalk_1.default.white('p2m-cli balance'));
            }
            process.exit(1);
        }
    });
    command
        .command('remove <upi-id>')
        .alias('rm')
        .description('Remove a UPI ID from your merchant account')
        .option('-f, --force', 'Force removal without confirmation')
        .action(async (upiId, options) => {
        try {
            console.log(chalk_1.default.cyan('\n🗑️  Remove UPI ID'));
            console.log(chalk_1.default.gray(`Removing UPI ID: ${upiId}\n`));
            if (!configManager.isInitialized()) {
                console.log(chalk_1.default.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
                return;
            }
            if (!configManager.hasUPIId(upiId)) {
                console.log(chalk_1.default.yellow('⚠️  UPI ID not found in local config.'));
            }
            const spinner = (0, ora_1.default)('Checking UPI ID on blockchain...').start();
            try {
                const exists = await upiRegistryService.upiExists(upiId);
                if (!exists) {
                    spinner.warn('UPI ID not found on blockchain');
                    console.log(chalk_1.default.yellow('\n⚠️  UPI ID not registered on blockchain.'));
                    console.log(chalk_1.default.gray('No action needed - UPI ID not registered.'));
                    return;
                }
                const ownerAddress = await upiRegistryService.getMerchantByUPI(upiId);
                const currentAddress = require('@aptos-labs/ts-sdk').Account.fromPrivateKey({
                    privateKey: new (require('@aptos-labs/ts-sdk').Ed25519PrivateKey)(configManager.getPrivateKey())
                }).accountAddress.toString();
                if (ownerAddress.toLowerCase() !== currentAddress.toLowerCase()) {
                    spinner.fail('Not authorized to remove this UPI ID');
                    console.log(chalk_1.default.red('\n❌ You are not the owner of this UPI ID.'));
                    console.log(chalk_1.default.gray('Owner Address:'), chalk_1.default.white(ownerAddress));
                    console.log(chalk_1.default.gray('Your Address:'), chalk_1.default.white(currentAddress));
                    return;
                }
                spinner.succeed('UPI ID found and verified');
            }
            catch (error) {
                spinner.fail('Failed to verify UPI ID');
                throw error;
            }
            if (!options.force) {
                const { confirmed } = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmed',
                        message: `Are you sure you want to remove UPI ID "${upiId}"?`,
                        default: false,
                    },
                ]);
                if (!confirmed) {
                    console.log(chalk_1.default.yellow('\n⚠️  Removal cancelled.'));
                    return;
                }
            }
            const remSpinner = (0, ora_1.default)('Removing UPI ID from blockchain...').start();
            try {
                const result = await upiRegistryService.removeUPI(upiId);
                if (result.success) {
                    remSpinner.succeed('UPI ID removed successfully!');
                    console.log(chalk_1.default.green('\n🗑️  UPI ID removed!'));
                    console.log(chalk_1.default.gray('UPI ID:'), chalk_1.default.white(upiId));
                    console.log(chalk_1.default.gray('Transaction Hash:'), chalk_1.default.white(result.hash));
                    console.log(chalk_1.default.gray('Gas Used:'), chalk_1.default.white(result.gas_used || 'N/A'));
                    console.log(chalk_1.default.gray('Explorer:'), chalk_1.default.blue(upiRegistryService.getTransactionUrl(result.hash)));
                }
                else {
                    remSpinner.fail('UPI ID removal failed');
                    console.log(chalk_1.default.red('\n❌ Removal failed:'));
                    console.log(chalk_1.default.gray('Transaction Hash:'), chalk_1.default.white(result.hash));
                    console.log(chalk_1.default.gray('VM Status:'), chalk_1.default.white(result.vm_status || 'Unknown'));
                }
            }
            catch (error) {
                remSpinner.fail('UPI ID removal failed');
                throw error;
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('\n❌ Failed to remove UPI ID:'), error);
            process.exit(1);
        }
    });
    command
        .command('list')
        .alias('ls')
        .description('List all registered UPI IDs')
        .option('-s, --sync', 'Sync with blockchain before listing')
        .option('-r, --remote', 'Show only blockchain data')
        .action(async (options) => {
        try {
            console.log(chalk_1.default.cyan('\n📋 UPI IDs List'));
            if (!configManager.isInitialized()) {
                console.log(chalk_1.default.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
                return;
            }
            let localUPIs = await configManager.getUPIIds();
            let blockchainUPIs = [];
            if (options.sync || options.remote) {
                const spinner = (0, ora_1.default)('Fetching UPI IDs from blockchain...').start();
                try {
                    blockchainUPIs = await upiRegistryService.getMerchantUPIs();
                    spinner.succeed(`Found ${blockchainUPIs.length} UPI IDs on blockchain`);
                    if (options.sync) {
                        localUPIs = blockchainUPIs;
                        console.log(chalk_1.default.green('✅ Local config synced with blockchain'));
                    }
                }
                catch (error) {
                    spinner.fail('Failed to fetch from blockchain');
                    if (options.remote) {
                        throw error;
                    }
                    console.log(chalk_1.default.yellow('⚠️  Using local data only'));
                }
            }
            const upisToShow = options.remote ? blockchainUPIs : localUPIs;
            if (upisToShow.length === 0) {
                console.log(chalk_1.default.yellow('\n⚠️  No UPI IDs found.'));
                console.log(chalk_1.default.gray('Add a UPI ID: '), chalk_1.default.white('p2m-cli upi add <upi-id>'));
                return;
            }
            const tableData = [
                [chalk_1.default.bold('Index'), chalk_1.default.bold('UPI ID'), chalk_1.default.bold('Status')]
            ];
            for (let i = 0; i < upisToShow.length; i++) {
                const upiId = upisToShow[i];
                let status = 'Local';
                if (options.sync || options.remote) {
                    status = blockchainUPIs.includes(upiId) ? chalk_1.default.green('✅ Registered') : chalk_1.default.yellow('⚠️  Local Only');
                }
                else if (blockchainUPIs.length > 0) {
                    status = blockchainUPIs.includes(upiId) ? chalk_1.default.green('✅ Registered') : chalk_1.default.gray('Unknown');
                }
                tableData.push([
                    (i + 1).toString(),
                    upiId,
                    status
                ]);
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
            console.log(chalk_1.default.gray(`\nTotal: ${upisToShow.length} UPI ID(s)`));
            if (!options.sync && !options.remote && localUPIs.length > 0) {
                console.log(chalk_1.default.gray('\n💡 Tip: Use --sync to verify with blockchain'));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('\n❌ Failed to list UPI IDs:'), error);
            process.exit(1);
        }
    });
    command
        .command('sync')
        .description('Sync local UPI IDs with blockchain')
        .action(async () => {
        try {
            console.log(chalk_1.default.cyan('\n🔄 Syncing UPI IDs'));
            if (!configManager.isInitialized()) {
                console.log(chalk_1.default.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
                return;
            }
            const spinner = (0, ora_1.default)('Syncing with blockchain...').start();
            try {
                await upiRegistryService.syncWithBlockchain();
                spinner.succeed('Sync completed');
                const upiIds = await configManager.getUPIIds();
                console.log(chalk_1.default.green(`\n✅ Synced ${upiIds.length} UPI ID(s) from blockchain`));
                if (upiIds.length > 0) {
                    console.log(chalk_1.default.gray('\nSynced UPI IDs:'));
                    upiIds.forEach((upiId, index) => {
                        console.log(chalk_1.default.gray(`${index + 1}. `), chalk_1.default.white(upiId));
                    });
                }
            }
            catch (error) {
                spinner.fail('Sync failed');
                throw error;
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('\n❌ Sync failed:'), error);
            process.exit(1);
        }
    });
    return command;
}
function isValidUPIId(upiId) {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upiId);
}
//# sourceMappingURL=upi.js.map
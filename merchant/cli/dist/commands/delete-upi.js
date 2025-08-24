"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUpiAction = deleteUpiAction;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const inquirer_1 = __importDefault(require("inquirer"));
function isValidUPIId(upiId) {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upiId);
}
async function deleteUpiAction(configManager, walletManager, upiRegistryService, upiId, options) {
    try {
        console.log(chalk_1.default.cyan('\n🗑️  Delete UPI ID & Escrow Wallet'));
        console.log(chalk_1.default.gray(`Deleting: ${upiId}\n`));
        if (!configManager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
            return;
        }
        if (!isValidUPIId(upiId)) {
            console.log(chalk_1.default.red('❌ Invalid UPI ID format.'));
            console.log(chalk_1.default.gray('Expected format: user@provider (e.g., john@paytm)'));
            return;
        }
        const hasLocalUPI = await configManager.hasUPIId(upiId);
        if (!hasLocalUPI) {
            console.log(chalk_1.default.yellow('⚠️  UPI ID not found in local config.'));
        }
        const spinner = (0, ora_1.default)('Checking UPI ID on blockchain...').start();
        let blockchainExists = false;
        try {
            const exists = await upiRegistryService.upiExists(upiId);
            if (!exists) {
                spinner.warn('UPI ID not found on blockchain');
                if (hasLocalUPI) {
                    console.log(chalk_1.default.yellow('\n⚠️  UPI ID exists locally but not on blockchain.'));
                    const { removeLocal } = await inquirer_1.default.prompt([
                        {
                            type: 'confirm',
                            name: 'removeLocal',
                            message: 'Remove from local configuration only?',
                            default: true,
                        },
                    ]);
                    if (removeLocal) {
                        const escrowWallet = await configManager.getEscrowWallet(upiId);
                        if (escrowWallet) {
                            configManager.removeEscrowWallet(upiId);
                            console.log(chalk_1.default.green('✅ Local escrow wallet removed.'));
                        }
                        else {
                            console.log(chalk_1.default.green('✅ No local escrow wallet to remove.'));
                        }
                    }
                    else {
                        console.log(chalk_1.default.yellow('❌ Deletion cancelled.'));
                    }
                }
                else {
                    console.log(chalk_1.default.red('❌ UPI ID not found anywhere.'));
                }
                return;
            }
            blockchainExists = true;
            const ownerAddress = await upiRegistryService.getMerchantByUPI(upiId);
            const currentAddress = walletManager.getAddress();
            if (ownerAddress.toLowerCase() !== currentAddress?.toLowerCase()) {
                spinner.fail('Not authorized to delete this UPI ID');
                console.log(chalk_1.default.red('❌ You are not the owner of this UPI ID.'));
                console.log(chalk_1.default.gray('Owner Address:'), chalk_1.default.white(ownerAddress));
                console.log(chalk_1.default.gray('Your Address:'), chalk_1.default.white(currentAddress));
                return;
            }
            spinner.succeed('UPI ID found and verified');
        }
        catch (error) {
            spinner.fail('Failed to verify UPI ID');
            console.log(chalk_1.default.red('❌ Error checking UPI ID:'), error);
            return;
        }
        const escrowWallet = await configManager.getEscrowWallet(upiId);
        console.log(chalk_1.default.red('\n⚠️  DELETION WARNING'));
        console.log(chalk_1.default.gray('UPI ID:'), chalk_1.default.white(upiId));
        console.log(chalk_1.default.gray('Network:'), chalk_1.default.white(configManager.getNetwork()));
        console.log(chalk_1.default.gray('Contract:'), chalk_1.default.white(configManager.getContractAddress()));
        if (escrowWallet) {
            console.log(chalk_1.default.yellow('Escrow Wallet:'), chalk_1.default.white(escrowWallet.escrowAddress));
            console.log(chalk_1.default.red('⚠️  This will also delete the associated escrow wallet!'));
            console.log(chalk_1.default.red('⚠️  Make sure to withdraw any funds before deletion!'));
            try {
                console.log(chalk_1.default.yellow('⚠️  Could not check escrow wallet balance'));
                console.log(chalk_1.default.red('⚠️  If this wallet has funds, they will be lost!'));
            }
            catch (error) {
                console.log(chalk_1.default.yellow('⚠️  Could not check wallet balance'));
            }
        }
        console.log(chalk_1.default.red('\n🚨 This action cannot be undone!'));
        if (!options.force) {
            const { confirmDelete } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirmDelete',
                    message: 'Are you absolutely sure you want to delete this UPI ID and its wallet?',
                    default: false,
                },
            ]);
            if (!confirmDelete) {
                console.log(chalk_1.default.yellow('❌ Deletion cancelled.'));
                return;
            }
            const { doubleConfirm } = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'doubleConfirm',
                    message: `Type "DELETE ${upiId}" to confirm:`,
                    validate: (input) => {
                        return input === `DELETE ${upiId}` ? true : 'Please type the exact confirmation text';
                    },
                },
            ]);
        }
        console.log(chalk_1.default.red('\n🗑️  Deleting UPI ID and escrow wallet...'));
        let blockchainSuccess = false;
        if (blockchainExists) {
            const removeSpinner = (0, ora_1.default)('1. Removing UPI ID from blockchain...').start();
            try {
                const removeResult = await upiRegistryService.removeUPI(upiId);
                if (!removeResult.success) {
                    removeSpinner.fail('Failed to remove UPI ID from blockchain');
                    console.log(chalk_1.default.red('❌ Failed to remove UPI ID from blockchain'));
                    console.log(chalk_1.default.gray('Error:'), removeResult.vm_status);
                    console.log(chalk_1.default.yellow('💡 You can still remove it locally, but it will remain on blockchain'));
                    const { proceedLocal } = await inquirer_1.default.prompt([
                        {
                            type: 'confirm',
                            name: 'proceedLocal',
                            message: 'Remove from local configuration only?',
                            default: false,
                        },
                    ]);
                    if (!proceedLocal) {
                        console.log(chalk_1.default.yellow('❌ Deletion cancelled.'));
                        return;
                    }
                }
                else {
                    removeSpinner.succeed('UPI ID removed from blockchain');
                    console.log(chalk_1.default.gray('Transaction Hash:'), chalk_1.default.blue(removeResult.hash));
                    console.log(chalk_1.default.gray('Gas Used:'), chalk_1.default.white(removeResult.gas_used));
                    blockchainSuccess = true;
                }
            }
            catch (error) {
                removeSpinner.fail('Failed to remove UPI ID from blockchain');
                console.log(chalk_1.default.red('❌ Error removing UPI ID:'), error);
                const { proceedLocal } = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'proceedLocal',
                        message: 'Remove from local configuration only?',
                        default: false,
                    },
                ]);
                if (!proceedLocal) {
                    console.log(chalk_1.default.yellow('❌ Deletion cancelled.'));
                    return;
                }
            }
        }
        const configSpinner = (0, ora_1.default)('2. Removing escrow wallet from local storage...').start();
        try {
            if (escrowWallet) {
                configManager.removeEscrowWallet(upiId);
                configSpinner.succeed('Local escrow wallet removed');
            }
            else {
                configSpinner.succeed('No local escrow wallet to remove');
            }
        }
        catch (error) {
            configSpinner.fail('Failed to update local configuration');
            console.log(chalk_1.default.red('❌ Error updating local config:'), error);
        }
        console.log(chalk_1.default.green('\n🎉 UPI ID and escrow wallet deleted successfully!'));
        console.log(chalk_1.default.gray('Deleted UPI ID:'), chalk_1.default.white(upiId));
        if (blockchainSuccess) {
            const explorerUrl = upiRegistryService.getTransactionUrl('');
            if (explorerUrl) {
                console.log(chalk_1.default.blue('🔗 View on Explorer:'));
                console.log(chalk_1.default.blue(explorerUrl.replace('transaction/', 'account/')));
            }
        }
        if (escrowWallet) {
            console.log(chalk_1.default.yellow('\n💡 Remember: If the escrow wallet had funds, they are now inaccessible'));
            console.log(chalk_1.default.yellow('💡 Always withdraw funds before deleting UPI IDs'));
        }
        const remainingUPIs = await configManager.getUPIIds();
        if (remainingUPIs.length > 0) {
            console.log(chalk_1.default.blue('\n📋 Remaining UPI IDs:'));
            for (const id of remainingUPIs) {
                const wallet = await configManager.getEscrowWallet(id);
                const status = wallet ? '💼 Has Wallet' : '⚠️  No Wallet';
                console.log(chalk_1.default.gray(`  • ${id} - ${status}`));
            }
        }
        else {
            console.log(chalk_1.default.yellow('\n📋 No UPI IDs remaining in your account'));
            console.log(chalk_1.default.blue('💡 Add a new UPI ID using: p2m-cli add-upi <upi-id>'));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red('\n❌ Failed to delete UPI ID:'), error.message || error);
        process.exit(1);
    }
}
//# sourceMappingURL=delete-upi.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUpiAction = updateUpiAction;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const inquirer_1 = __importDefault(require("inquirer"));
function isValidUPIId(upiId) {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upiId);
}
async function updateUpiAction(configManager, walletManager, upiRegistryService, oldUpiId, newUpiId, options) {
    try {
        console.log(chalk_1.default.cyan('\n✏️  Update UPI ID'));
        console.log(chalk_1.default.gray(`Updating: ${oldUpiId} → ${newUpiId}\n`));
        if (!configManager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
            return;
        }
        if (!isValidUPIId(oldUpiId)) {
            console.log(chalk_1.default.red('❌ Invalid old UPI ID format.'));
            console.log(chalk_1.default.gray('Expected format: user@provider (e.g., john@paytm)'));
            return;
        }
        if (!isValidUPIId(newUpiId)) {
            console.log(chalk_1.default.red('❌ Invalid new UPI ID format.'));
            console.log(chalk_1.default.gray('Expected format: user@provider (e.g., john@paytm)'));
            return;
        }
        if (oldUpiId === newUpiId) {
            console.log(chalk_1.default.red('❌ New UPI ID must be different from the current one.'));
            return;
        }
        if (!configManager.hasUPIId(oldUpiId)) {
            console.log(chalk_1.default.yellow('⚠️  Old UPI ID not found in local config.'));
            const spinner = (0, ora_1.default)('Checking old UPI ID on blockchain...').start();
            try {
                const exists = await upiRegistryService.upiExists(oldUpiId);
                if (!exists) {
                    spinner.fail('Old UPI ID not found on blockchain');
                    console.log(chalk_1.default.red('❌ Old UPI ID does not exist.'));
                    return;
                }
                const ownerAddress = await upiRegistryService.getMerchantByUPI(oldUpiId);
                const currentAddress = walletManager.getAddress();
                if (ownerAddress.toLowerCase() !== currentAddress?.toLowerCase()) {
                    spinner.fail('Not authorized to update this UPI ID');
                    console.log(chalk_1.default.red('❌ You are not the owner of this UPI ID.'));
                    console.log(chalk_1.default.gray('Owner Address:'), chalk_1.default.white(ownerAddress));
                    console.log(chalk_1.default.gray('Your Address:'), chalk_1.default.white(currentAddress));
                    return;
                }
                spinner.succeed('Old UPI ID found and verified');
            }
            catch (error) {
                spinner.fail('Failed to verify old UPI ID');
                console.log(chalk_1.default.red('❌ Error checking old UPI ID:'), error);
                return;
            }
        }
        if (await configManager.hasUPIId(newUpiId)) {
            console.log(chalk_1.default.red('❌ New UPI ID already exists in your account.'));
            return;
        }
        const spinner = (0, ora_1.default)('Checking new UPI ID availability...').start();
        try {
            const exists = await upiRegistryService.upiExists(newUpiId);
            if (exists) {
                const owner = await upiRegistryService.getMerchantByUPI(newUpiId);
                const currentAddress = walletManager.getAddress();
                if (owner.toLowerCase() !== currentAddress?.toLowerCase()) {
                    spinner.fail('New UPI ID is already registered');
                    console.log(chalk_1.default.red('❌ New UPI ID is already registered to another merchant.'));
                    console.log(chalk_1.default.gray('Owner Address:'), chalk_1.default.white(owner));
                    return;
                }
            }
            spinner.succeed('New UPI ID is available');
        }
        catch (error) {
            spinner.fail('Failed to check new UPI ID availability');
            console.log(chalk_1.default.red('❌ Error checking new UPI ID:'), error);
            return;
        }
        console.log(chalk_1.default.blue('\n📋 Update Details:'));
        console.log(chalk_1.default.gray('Current UPI ID:'), chalk_1.default.white(oldUpiId));
        console.log(chalk_1.default.gray('New UPI ID:'), chalk_1.default.white(newUpiId));
        console.log(chalk_1.default.gray('Network:'), chalk_1.default.white(configManager.getNetwork()));
        console.log(chalk_1.default.gray('Contract:'), chalk_1.default.white(configManager.getContractAddress()));
        const escrowWallet = await configManager.getEscrowWallet(oldUpiId);
        if (escrowWallet) {
            console.log(chalk_1.default.gray('Escrow Wallet:'), chalk_1.default.white(escrowWallet.escrowAddress));
            console.log(chalk_1.default.green('✅ Escrow wallet will be transferred to new UPI ID'));
        }
        else {
            console.log(chalk_1.default.yellow('⚠️  No escrow wallet associated with old UPI ID'));
        }
        if (!options.force) {
            const { confirmed } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirmed',
                    message: 'Proceed with UPI ID update?',
                    default: true,
                },
            ]);
            if (!confirmed) {
                console.log(chalk_1.default.yellow('❌ Update cancelled.'));
                return;
            }
        }
        console.log(chalk_1.default.blue('\n🔄 Updating UPI ID...'));
        const removeSpinner = (0, ora_1.default)('1. Removing old UPI ID from blockchain...').start();
        try {
            const removeResult = await upiRegistryService.removeUPI(oldUpiId);
            if (!removeResult.success) {
                removeSpinner.fail('Failed to remove old UPI ID');
                console.log(chalk_1.default.red('❌ Failed to remove old UPI ID from blockchain'));
                console.log(chalk_1.default.gray('Error:'), removeResult.vm_status);
                return;
            }
            removeSpinner.succeed('Old UPI ID removed from blockchain');
            console.log(chalk_1.default.gray('Transaction Hash:'), chalk_1.default.blue(removeResult.hash));
        }
        catch (error) {
            removeSpinner.fail('Failed to remove old UPI ID');
            console.log(chalk_1.default.red('❌ Error removing old UPI ID:'), error);
            return;
        }
        const registerSpinner = (0, ora_1.default)('2. Registering new UPI ID on blockchain...').start();
        try {
            const registerResult = await upiRegistryService.registerUPI(newUpiId);
            if (!registerResult.success) {
                registerSpinner.fail('Failed to register new UPI ID');
                console.log(chalk_1.default.red('❌ Failed to register new UPI ID on blockchain'));
                console.log(chalk_1.default.gray('Error:'), registerResult.vm_status);
                console.log(chalk_1.default.yellow('🔄 Attempting to restore old UPI ID...'));
                try {
                    const restoreResult = await upiRegistryService.registerUPI(oldUpiId);
                    if (restoreResult.success) {
                        console.log(chalk_1.default.green('✅ Old UPI ID restored successfully'));
                    }
                    else {
                        console.log(chalk_1.default.red('❌ Failed to restore old UPI ID. Manual intervention required.'));
                    }
                }
                catch (restoreError) {
                    console.log(chalk_1.default.red('❌ Failed to restore old UPI ID:'), restoreError);
                }
                return;
            }
            registerSpinner.succeed('New UPI ID registered on blockchain');
            console.log(chalk_1.default.gray('Transaction Hash:'), chalk_1.default.blue(registerResult.hash));
        }
        catch (error) {
            registerSpinner.fail('Failed to register new UPI ID');
            console.log(chalk_1.default.red('❌ Error registering new UPI ID:'), error);
            console.log(chalk_1.default.yellow('🔄 Attempting to restore old UPI ID...'));
            try {
                await upiRegistryService.registerUPI(oldUpiId);
                console.log(chalk_1.default.green('✅ Old UPI ID restored successfully'));
            }
            catch (restoreError) {
                console.log(chalk_1.default.red('❌ Failed to restore old UPI ID:'), restoreError);
            }
            return;
        }
        const configSpinner = (0, ora_1.default)('3. Updating local configuration...').start();
        try {
            if (escrowWallet) {
                configManager.removeEscrowWallet(oldUpiId);
                configManager.setEscrowWallet(newUpiId, {
                    address: escrowWallet.escrowAddress,
                    privateKey: '',
                    publicKey: '',
                    createdAt: new Date().toISOString(),
                });
            }
            configSpinner.succeed('Local escrow wallet updated');
        }
        catch (error) {
            configSpinner.fail('Failed to update local escrow wallet');
            console.log(chalk_1.default.red('❌ Error updating local config:'), error);
        }
        console.log(chalk_1.default.green('\n🎉 UPI ID updated successfully!'));
        console.log(chalk_1.default.gray('Old UPI ID:'), chalk_1.default.white(oldUpiId));
        console.log(chalk_1.default.gray('New UPI ID:'), chalk_1.default.white(newUpiId));
        if (escrowWallet) {
            console.log(chalk_1.default.green('✅ Escrow wallet transferred to new UPI ID'));
            console.log(chalk_1.default.gray('Wallet Address:'), chalk_1.default.white(escrowWallet.escrowAddress));
        }
        else {
            console.log(chalk_1.default.yellow('💡 Generate escrow wallet for the new UPI ID using:'));
            console.log(chalk_1.default.blue(`   p2m-cli generate ${newUpiId}`));
        }
        const explorerUrl = upiRegistryService.getTransactionUrl('');
        if (explorerUrl) {
            console.log(chalk_1.default.blue('\n🔗 View on Explorer:'));
            console.log(chalk_1.default.blue(explorerUrl.replace('transaction/', 'account/')));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red('\n❌ Failed to update UPI ID:'), error.message || error);
        process.exit(1);
    }
}
//# sourceMappingURL=update-upi.js.map
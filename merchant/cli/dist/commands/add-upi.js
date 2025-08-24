"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUpiAction = addUpiAction;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const inquirer_1 = __importDefault(require("inquirer"));
function isValidUPIId(upiId) {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upiId);
}
async function addUpiAction(configManager, walletManager, upiRegistryService, upiId, options) {
    try {
        console.log(chalk_1.default.cyan('\n💳 Add UPI ID'));
        console.log(chalk_1.default.gray(`Adding UPI ID: ${upiId}\n`));
        if (!configManager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CLI not initialized. Run `aptos-p2m init` first.'));
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
                    default: false,
                },
            ]);
            if (!shouldContinue) {
                console.log(chalk_1.default.yellow('Operation cancelled.'));
                return;
            }
        }
        const spinner = (0, ora_1.default)('Checking UPI ID availability...').start();
        try {
            const exists = await upiRegistryService.upiExists(upiId);
            if (exists && !options.force) {
                spinner.fail('UPI ID already registered on blockchain');
                console.log(chalk_1.default.red(`❌ UPI ID '${upiId}' is already registered by another merchant.`));
                return;
            }
            spinner.succeed('UPI ID is available');
        }
        catch (error) {
            spinner.fail('Failed to check UPI ID availability');
            throw error;
        }
        const registerSpinner = (0, ora_1.default)('Registering UPI ID on blockchain...').start();
        try {
            const txHash = await upiRegistryService.registerUPI(upiId);
            registerSpinner.succeed('UPI ID registered successfully');
            console.log(chalk_1.default.green('\n✅ UPI ID registered successfully!'));
            console.log(chalk_1.default.gray(`Transaction Hash: ${txHash}`));
            console.log(chalk_1.default.gray(`UPI ID: ${upiId}`));
            console.log(chalk_1.default.green('✅ UPI ID registered on blockchain'));
            console.log(chalk_1.default.yellow('\n🎯 Next Steps:'));
            console.log(chalk_1.default.gray(`1. Generate escrow wallet: aptos-p2m generate ${upiId}`));
            console.log(chalk_1.default.gray(`2. Check balance: aptos-p2m balance ${upiId}`));
            console.log(chalk_1.default.gray('3. View all pairs: aptos-p2m list-pairs'));
        }
        catch (error) {
            registerSpinner.fail('Failed to register UPI ID');
            throw error;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Failed to add UPI ID:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
//# sourceMappingURL=add-upi.js.map
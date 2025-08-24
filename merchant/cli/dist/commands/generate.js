"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAction = generateAction;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const inquirer_1 = __importDefault(require("inquirer"));
const qrcode = require('qrcode-terminal');
async function generateAction(configManager, walletManager, upiRegistryService, upiId, options) {
    try {
        console.log(chalk_1.default.cyan('\n🔐 Generate Escrow Wallet'));
        console.log(chalk_1.default.gray(`Generating escrow wallet for UPI ID: ${upiId}\n`));
        if (!configManager.isInitialized()) {
            console.log(chalk_1.default.red('❌ CLI not initialized. Run `aptos-p2m init` first.'));
            return;
        }
        if (!configManager.hasUPIId(upiId)) {
            console.log(chalk_1.default.red(`❌ UPI ID '${upiId}' not found in local configuration.`));
            console.log(chalk_1.default.gray(`Add it first: aptos-p2m add-upi ${upiId}`));
            return;
        }
        const existingWallet = await configManager.getEscrowWallet(upiId);
        if (existingWallet) {
            console.log(chalk_1.default.yellow('⚠️  Escrow wallet already exists for this UPI ID.'));
            const { shouldRegenerate } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'shouldRegenerate',
                    message: 'Do you want to generate a new escrow wallet? (This will replace the existing one)',
                    default: false,
                },
            ]);
            if (!shouldRegenerate) {
                console.log(chalk_1.default.yellow('Operation cancelled.'));
                console.log(chalk_1.default.cyan('\n📋 Existing Escrow Wallet:'));
                console.log(chalk_1.default.gray(`Address: ${existingWallet.escrowAddress}`));
                console.log(chalk_1.default.gray(`UPI ID: ${upiId}`));
                return;
            }
        }
        console.log(chalk_1.default.cyan('\n🔍 UPI ID Verification:'));
        console.log(chalk_1.default.yellow('UPI ID verification skip'));
        const spinner = (0, ora_1.default)('Generating escrow wallet...').start();
        try {
            const escrowWallet = await walletManager.generateEscrowWallet(upiId);
            spinner.succeed('Escrow wallet generated successfully');
            configManager.setEscrowWallet(upiId, {
                address: escrowWallet.accountAddress.toString(),
                privateKey: escrowWallet.privateKey.toString(),
                publicKey: escrowWallet.publicKey.toString(),
                createdAt: new Date().toISOString()
            });
            const blockchainSpinner = (0, ora_1.default)('Creating escrow wallet on blockchain...').start();
            try {
                const result = await upiRegistryService.createEscrowWallet(upiId, escrowWallet.accountAddress.toString());
                if (result.success) {
                    blockchainSpinner.succeed('Escrow wallet created on blockchain successfully');
                    console.log(chalk_1.default.gray(`Transaction hash: ${result.hash}`));
                }
                else {
                    blockchainSpinner.warn('Failed to create escrow wallet on blockchain');
                    console.log(chalk_1.default.yellow('⚠️  Escrow wallet generated locally but not registered on blockchain'));
                    console.log(chalk_1.default.gray('You can manually register it later using the admin CLI'));
                }
            }
            catch (error) {
                blockchainSpinner.warn('Failed to create escrow wallet on blockchain');
                console.log(chalk_1.default.yellow('⚠️  Escrow wallet generated locally but not registered on blockchain'));
                console.log(chalk_1.default.gray(`Error: ${error instanceof Error ? error.message : error}`));
                console.log(chalk_1.default.gray('You can manually register it later using the admin CLI'));
            }
            console.log(chalk_1.default.green('\n✅ Escrow wallet generated successfully!'));
            console.log(chalk_1.default.cyan('\n📋 Escrow Wallet Details:'));
            console.log(chalk_1.default.gray(`UPI ID: ${upiId}`));
            console.log(chalk_1.default.gray(`Address: ${escrowWallet.accountAddress.toString()}`));
            console.log(chalk_1.default.gray(`Public Key: ${escrowWallet.publicKey.toString()}`));
            console.log(chalk_1.default.cyan('\n📱 QR Code for Escrow Address:'));
            qrcode.generate(escrowWallet.accountAddress.toString(), { small: true });
            console.log(chalk_1.default.yellow('\n⚠️  SECURITY WARNING:'));
            console.log(chalk_1.default.red('• The private key is stored locally in your configuration'));
            console.log(chalk_1.default.red('• Keep your configuration file secure'));
            console.log(chalk_1.default.red('• Consider backing up your configuration'));
            const { showPrivateKey } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'showPrivateKey',
                    message: 'Do you want to display the private key? (Not recommended for production)',
                    default: false,
                },
            ]);
            if (showPrivateKey) {
                console.log(chalk_1.default.red('\n🔑 Private Key (KEEP SECURE):'));
                console.log(chalk_1.default.white(escrowWallet.privateKey.toString()));
            }
            console.log(chalk_1.default.yellow('\n🎯 Next Steps:'));
            console.log(chalk_1.default.gray(`1. Check balance: aptos-p2m balance ${upiId}`));
            console.log(chalk_1.default.gray(`2. View transaction history: aptos-p2m history ${upiId}`));
            console.log(chalk_1.default.gray('3. List all pairs: aptos-p2m list-pairs'));
        }
        catch (error) {
            spinner.fail('Failed to generate escrow wallet');
            throw error;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Failed to generate escrow wallet:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
//# sourceMappingURL=generate.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommand = registerCommand;
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
function registerCommand(configManager, upiRegistryService) {
    const command = new commander_1.Command('register');
    command
        .description('Register as a merchant on the P2M system')
        .option('-b, --business-name <name>', 'Business name')
        .option('-c, --contact <info>', 'Contact information')
        .option('-f, --force', 'Force re-registration')
        .action(async (options) => {
        try {
            console.log(chalk_1.default.cyan('\n🏪 Merchant Registration'));
            console.log(chalk_1.default.gray('Register your business on the P2M system\n'));
            if (!configManager.isInitialized()) {
                console.log(chalk_1.default.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
                return;
            }
            if (await configManager.isMerchantRegistered() && !options.force) {
                const merchantInfo = await configManager.getMerchantInfo();
                console.log(chalk_1.default.yellow('⚠️  Already registered as merchant:'));
                console.log(chalk_1.default.gray('Business Name:'), chalk_1.default.white(merchantInfo?.businessName));
                console.log(chalk_1.default.gray('Contact Info:'), chalk_1.default.white(merchantInfo?.contactInfo));
                console.log(chalk_1.default.gray('Registration Date:'), chalk_1.default.white('Available on-chain'));
                const { shouldReregister } = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'shouldReregister',
                        message: 'Do you want to re-register with new information?',
                        default: false,
                    },
                ]);
                if (!shouldReregister) {
                    console.log(chalk_1.default.yellow('\n⚠️  Registration cancelled.'));
                    return;
                }
            }
            let businessName = options.businessName;
            let contactInfo = options.contact;
            if (!businessName || !contactInfo) {
                console.log(chalk_1.default.blue('📝 Please provide your business information:'));
                const responses = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'businessName',
                        message: 'Business Name:',
                        default: businessName,
                        validate: (input) => {
                            if (!input || input.trim().length < 2) {
                                return 'Business name must be at least 2 characters long';
                            }
                            if (input.length > 100) {
                                return 'Business name must be less than 100 characters';
                            }
                            return true;
                        },
                    },
                    {
                        type: 'input',
                        name: 'contactInfo',
                        message: 'Contact Information (email/phone):',
                        default: contactInfo,
                        validate: (input) => {
                            if (!input || input.trim().length < 5) {
                                return 'Contact information must be at least 5 characters long';
                            }
                            if (input.length > 200) {
                                return 'Contact information must be less than 200 characters';
                            }
                            return true;
                        },
                    },
                ]);
                businessName = responses.businessName.trim();
                contactInfo = responses.contactInfo.trim();
            }
            console.log(chalk_1.default.blue('\n📋 Registration Details:'));
            console.log(chalk_1.default.gray('Business Name:'), chalk_1.default.white(businessName));
            console.log(chalk_1.default.gray('Contact Info:'), chalk_1.default.white(contactInfo));
            console.log(chalk_1.default.gray('Network:'), chalk_1.default.white(configManager.getNetwork()));
            console.log(chalk_1.default.gray('Contract:'), chalk_1.default.white(upiRegistryService.getContractAddress()));
            const { confirmed } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirmed',
                    message: 'Confirm merchant registration?',
                    default: true,
                },
            ]);
            if (!confirmed) {
                console.log(chalk_1.default.yellow('\n⚠️  Registration cancelled.'));
                return;
            }
            const spinner = (0, ora_1.default)('Checking existing registration...').start();
            try {
                const existingInfo = await upiRegistryService.getMerchantInfo();
                if (existingInfo && !options.force) {
                    spinner.warn('Merchant already registered on blockchain');
                    console.log(chalk_1.default.yellow('\n⚠️  You are already registered on the blockchain:'));
                    console.log(chalk_1.default.gray('Business Name:'), chalk_1.default.white(existingInfo.business_name));
                    console.log(chalk_1.default.gray('Contact Info:'), chalk_1.default.white(existingInfo.contact_info));
                    console.log(chalk_1.default.gray('Registration Date:'), chalk_1.default.white(new Date(parseInt(existingInfo.registration_timestamp) * 1000).toLocaleString()));
                    console.log(chalk_1.default.gray('Status:'), existingInfo.is_active ? chalk_1.default.green('Active') : chalk_1.default.red('Inactive'));
                    console.log(chalk_1.default.gray('KYC Verified:'), existingInfo.kyc_verified ? chalk_1.default.green('Yes') : chalk_1.default.yellow('No'));
                    return;
                }
            }
            catch (error) {
                spinner.text = 'Proceeding with new registration...';
            }
            spinner.text = 'Registering merchant on blockchain...';
            try {
                const result = await upiRegistryService.registerMerchant(businessName, contactInfo);
                if (result.success) {
                    spinner.succeed('Merchant registered successfully!');
                    console.log(chalk_1.default.green('\n🎉 Registration completed!'));
                    console.log(chalk_1.default.gray('Transaction Hash:'), chalk_1.default.white(result.hash));
                    console.log(chalk_1.default.gray('Gas Used:'), chalk_1.default.white(result.gas_used || 'N/A'));
                    console.log(chalk_1.default.gray('Explorer:'), chalk_1.default.blue(upiRegistryService.getTransactionUrl(result.hash)));
                    const syncSpinner = (0, ora_1.default)('Syncing with blockchain...').start();
                    try {
                        await upiRegistryService.syncWithBlockchain();
                        syncSpinner.succeed('Synced with blockchain');
                    }
                    catch (syncError) {
                        syncSpinner.warn('Sync failed, but registration was successful');
                    }
                    console.log(chalk_1.default.cyan('\nNext steps:'));
                    console.log(chalk_1.default.gray('1. Add UPI ID: '), chalk_1.default.white('p2m-cli upi add <upi-id>'));
                    console.log(chalk_1.default.gray('2. Check status: '), chalk_1.default.white('p2m-cli status'));
                    console.log(chalk_1.default.gray('3. View balance: '), chalk_1.default.white('p2m-cli balance'));
                }
                else {
                    spinner.fail('Registration failed');
                    console.log(chalk_1.default.red('\n❌ Registration failed:'));
                    console.log(chalk_1.default.gray('Transaction Hash:'), chalk_1.default.white(result.hash));
                    console.log(chalk_1.default.gray('VM Status:'), chalk_1.default.white(result.vm_status || 'Unknown'));
                    console.log(chalk_1.default.gray('Explorer:'), chalk_1.default.blue(upiRegistryService.getTransactionUrl(result.hash)));
                }
            }
            catch (error) {
                spinner.fail('Registration failed');
                throw error;
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('\n❌ Registration failed:'), error);
            const errorMessage = error.toString().toLowerCase();
            if (errorMessage.includes('insufficient')) {
                console.log(chalk_1.default.yellow('\n💡 Tip: You may need more APT for gas fees.'));
                console.log(chalk_1.default.gray('Run: '), chalk_1.default.white('p2m-cli balance'));
                if (configManager.getNetwork() !== 'mainnet') {
                    console.log(chalk_1.default.gray('Fund account: '), chalk_1.default.white('p2m-cli init --reset'));
                }
            }
            else if (errorMessage.includes('already_exists')) {
                console.log(chalk_1.default.yellow('\n💡 Tip: You may already be registered. Use --force to re-register.'));
            }
            else if (errorMessage.includes('not_found')) {
                console.log(chalk_1.default.yellow('\n💡 Tip: Check if the contract address is correct.'));
                console.log(chalk_1.default.gray('Current contract: '), chalk_1.default.white(upiRegistryService.getContractAddress()));
            }
            process.exit(1);
        }
    });
    return command;
}
//# sourceMappingURL=register.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAction = initAction;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const shared_1 = require("@p2m/shared");
async function initAction(configManager, walletManager, upiRegistryService, options) {
    try {
        console.log(chalk_1.default.cyan('\n🚀 P2M CLI Initialization'));
        console.log(chalk_1.default.gray('Setting up your merchant CLI environment\n'));
        if (configManager.isInitialized() && !options.reset) {
            const { shouldReset } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'shouldReset',
                    message: 'CLI is already initialized. Do you want to reset the configuration?',
                    default: false,
                },
            ]);
            if (!shouldReset) {
                console.log(chalk_1.default.yellow('\n⚠️  Initialization cancelled.'));
                console.log(configManager.getConfigSummary());
                return;
            }
        }
        if (options.reset || configManager.isInitialized()) {
            const spinner = (0, ora_1.default)('Resetting configuration...').start();
            configManager.reset();
            spinner.succeed('Configuration reset');
        }
        let network = options.network || shared_1.EnvUtils.getDefaultNetwork();
        console.log(chalk_1.default.gray(`Using network: ${network}`));
        let contractAddress = options.contract || shared_1.EnvUtils.getContractAddress();
        if (!contractAddress) {
            const defaultContracts = {
                testnet: process.env.CONTRACT_ADDRESS || '',
                devnet: process.env.CONTRACT_ADDRESS || '',
                mainnet: '0x789...',
            };
            contractAddress = defaultContracts[network];
        }
        console.log(chalk_1.default.gray(`Using contract address: ${contractAddress}`));
        let privateKey = options.privateKey || shared_1.EnvUtils.getMerchantPrivateKey();
        if (!privateKey && !options.nonInteractive) {
            const { walletChoice } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'walletChoice',
                    message: 'Wallet setup:',
                    choices: [
                        { name: 'Generate new wallet', value: 'generate' },
                        { name: 'Import existing private key', value: 'import' },
                    ],
                },
            ]);
            if (walletChoice === 'import') {
                const { importedKey } = await inquirer_1.default.prompt([
                    {
                        type: 'password',
                        name: 'importedKey',
                        message: 'Enter your private key:',
                        mask: '*',
                        validate: (input) => {
                            if (!input || input.length < 64) {
                                return 'Please enter a valid private key';
                            }
                            return true;
                        },
                    },
                ]);
                privateKey = importedKey;
            }
        }
        else if (!privateKey && options.nonInteractive) {
            throw new Error('Private key is required for non-interactive initialization');
        }
        else if (privateKey && privateKey === shared_1.EnvUtils.getMerchantPrivateKey()) {
            console.log(chalk_1.default.gray('Using merchant private key from .env file'));
        }
        const spinner = (0, ora_1.default)('Initializing configuration...').start();
        try {
            configManager.setNetwork(network);
            configManager.setContractAddress(contractAddress);
            if (privateKey) {
                walletManager.importAccount(privateKey);
                spinner.text = 'Wallet imported successfully';
            }
            else {
                await walletManager.createNewAccount();
                spinner.text = 'New wallet generated';
            }
            spinner.succeed('Configuration initialized successfully');
            console.log(chalk_1.default.cyan('\n🔍 KYC Process:'));
            console.log(chalk_1.default.yellow('Skipping KYC'));
            console.log(chalk_1.default.green('\n✅ P2M CLI initialized successfully!'));
            console.log(chalk_1.default.cyan('\n📋 Configuration Summary:'));
            console.log(configManager.getConfigSummary());
            const walletInfo = walletManager.getWalletInfo();
            if (walletInfo) {
                console.log(chalk_1.default.cyan('\n💼 Wallet Information:'));
                console.log(chalk_1.default.gray(`Address: ${walletInfo.address}`));
                console.log(chalk_1.default.gray(`Network: ${network}`));
            }
            console.log(chalk_1.default.yellow('\n🎯 Next Steps:'));
            console.log(chalk_1.default.gray('1. Add UPI ID: aptos-p2m add-upi <your-upi-id>'));
            console.log(chalk_1.default.gray('2. Generate escrow wallet: aptos-p2m generate <upi-id>'));
            console.log(chalk_1.default.gray('3. Check balance: aptos-p2m balance <upi-id>'));
        }
        catch (error) {
            spinner.fail('Initialization failed');
            throw error;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Initialization failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
//# sourceMappingURL=init.js.map
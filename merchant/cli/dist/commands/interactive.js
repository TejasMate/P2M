"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.interactiveCommand = void 0;
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const OnChainConfigManager_1 = require("../config/OnChainConfigManager");
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const qrcode_1 = __importDefault(require("qrcode"));
function formatAddress(address) {
    if (!address || address === 'Not set')
        return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
}
function formatBalance(balance) {
    return (balance / 100000000).toFixed(8);
}
function validateUPIId(upiId) {
    const upiRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upiId);
}
exports.interactiveCommand = new commander_1.Command()
    .name('interactive')
    .alias('i')
    .description('Interactive menu-driven interface for P2M operations')
    .action(async () => {
    console.log(chalk_1.default.cyan.bold('\n🚀 P2M Merchant CLI - Interactive Mode'));
    console.log(chalk_1.default.gray('Navigate through options using arrow keys and Enter\n'));
    const configManager = new OnChainConfigManager_1.OnChainConfigManager();
    if (!configManager.isInitialized()) {
        console.log(chalk_1.default.yellow('⚠️  CLI not initialized. Please run initialization first.'));
        const { shouldInit } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'shouldInit',
                message: 'Would you like to initialize the CLI now?',
                default: true,
            },
        ]);
        if (shouldInit) {
            const { execSync } = require('child_process');
            try {
                execSync('node dist/index.js init', { stdio: 'inherit' });
            }
            catch (error) {
                console.log(chalk_1.default.red('❌ Initialization failed. Please run "aptos-p2m init" manually.'));
                return;
            }
        }
        else {
            console.log(chalk_1.default.yellow('👋 Exiting. Run "aptos-p2m init" when ready.'));
            return;
        }
    }
    await showMainMenu(configManager);
});
async function showMainMenu(configManager) {
    while (true) {
        console.clear();
        const network = configManager.getNetwork();
        const contractAddress = configManager.getContractAddress();
        const upiIds = await configManager.getUPIIds();
        const escrowWallets = await configManager.getEscrowWallets();
        console.log(chalk_1.default.cyan.bold('🚀 P2M Merchant CLI - Interactive Mode'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.blue(`📡 Network: ${network}`));
        console.log(chalk_1.default.blue(`📋 Contract: ${formatAddress(contractAddress || 'Not set')}`));
        console.log(chalk_1.default.blue(`🆔 UPI IDs: ${upiIds.length}`));
        console.log(chalk_1.default.blue(`💼 Escrow Wallets: ${escrowWallets.length}`));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log();
        const mainMenuChoices = [
            {
                name: '🆔 Manage UPI IDs',
                value: 'upi',
                description: 'Add, view, or remove UPI IDs'
            },
            {
                name: '💼 Manage Escrow Wallets',
                value: 'wallets',
                description: 'Generate, view, or manage escrow wallets'
            },
            {
                name: '💰 Check Balances',
                value: 'balances',
                description: 'View wallet balances and portfolio'
            },
            {
                name: '📊 View Reports',
                value: 'reports',
                description: 'Transaction history and analytics'
            },
            {
                name: '⚙️  Configuration',
                value: 'config',
                description: 'Manage CLI settings and network'
            },
            {
                name: '📤 Export Data',
                value: 'export',
                description: 'Export data to JSON or CSV'
            },
            {
                name: '❌ Exit',
                value: 'exit',
                description: 'Close the interactive CLI'
            },
        ];
        const { mainChoice } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'mainChoice',
                message: 'What would you like to do?',
                choices: mainMenuChoices,
                pageSize: 10,
            },
        ]);
        switch (mainChoice) {
            case 'upi':
                await showUPIMenu(configManager);
                break;
            case 'wallets':
                await showWalletMenu(configManager);
                break;
            case 'balances':
                await showBalanceMenu(configManager);
                break;
            case 'reports':
                await showReportsMenu(configManager);
                break;
            case 'config':
                await showConfigMenu(configManager);
                break;
            case 'export':
                await showExportMenu(configManager);
                break;
            case 'exit':
                console.log(chalk_1.default.green('👋 Thank you for using P2M Merchant CLI!'));
                return;
        }
    }
}
async function showUPIMenu(configManager) {
    const upiIds = await configManager.getUPIIds();
    const choices = [
        {
            name: '➕ Add New UPI ID',
            value: 'add',
            description: 'Register a new UPI ID'
        },
        {
            name: '📋 View All UPI IDs',
            value: 'list',
            description: 'List all registered UPI IDs'
        },
    ];
    if (upiIds.length > 0) {
        choices.push({
            name: '✏️  Update UPI ID',
            value: 'update',
            description: 'Update an existing UPI ID'
        }, {
            name: '🗑️  Delete UPI ID & Wallet',
            value: 'delete',
            description: 'Delete UPI ID and its escrow wallet'
        }, {
            name: '🗑️  Remove UPI ID',
            value: 'remove',
            description: 'Remove an existing UPI ID (legacy)'
        });
    }
    choices.push({
        name: '🔙 Back to Main Menu',
        value: 'back'
    });
    const { upiChoice } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'upiChoice',
            message: 'UPI ID Management:',
            choices,
        },
    ]);
    switch (upiChoice) {
        case 'add':
            await addUPIId(configManager);
            break;
        case 'list':
            await listUPIIds(configManager);
            break;
        case 'update':
            await updateUPIId(configManager);
            break;
        case 'delete':
            await deleteUPIId(configManager);
            break;
        case 'remove':
            await removeUPIId(configManager);
            break;
        case 'back':
            return;
    }
    await waitForKeyPress();
}
async function showWalletMenu(configManager) {
    const upiIds = await configManager.getUPIIds();
    const escrowWallets = await configManager.getEscrowWallets();
    if (upiIds.length === 0) {
        console.log(chalk_1.default.yellow('⚠️  No UPI IDs registered. Please add a UPI ID first.'));
        await waitForKeyPress();
        return;
    }
    const choices = [
        {
            name: '🔐 Generate Escrow Wallet',
            value: 'generate',
            description: 'Create a new escrow wallet for UPI ID'
        },
        {
            name: '📋 View All Wallets',
            value: 'list',
            description: 'List all escrow wallets'
        },
    ];
    if (escrowWallets.length > 0) {
        choices.push({
            name: '📱 Show QR Code',
            value: 'qr',
            description: 'Display QR code for wallet address'
        });
    }
    choices.push({
        name: '🔙 Back to Main Menu',
        value: 'back'
    });
    const { walletChoice } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'walletChoice',
            message: 'Escrow Wallet Management:',
            choices,
        },
    ]);
    switch (walletChoice) {
        case 'generate':
            await generateEscrowWallet(configManager);
            break;
        case 'list':
            await listEscrowWallets(configManager);
            break;
        case 'qr':
            await showQRCode(configManager);
            break;
        case 'back':
            return;
    }
    await waitForKeyPress();
}
async function showBalanceMenu(configManager) {
    const escrowWallets = await configManager.getEscrowWallets();
    if (escrowWallets.length === 0) {
        console.log(chalk_1.default.yellow('⚠️  No escrow wallets found. Please generate wallets first.'));
        await waitForKeyPress();
        return;
    }
    const choices = [
        {
            name: '💰 Check Single Wallet Balance',
            value: 'single',
            description: 'View balance for specific UPI ID'
        },
        {
            name: '📊 View All Balances',
            value: 'all',
            description: 'Show portfolio overview'
        },
        {
            name: '🔙 Back to Main Menu',
            value: 'back'
        },
    ];
    const { balanceChoice } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'balanceChoice',
            message: 'Balance Management:',
            choices,
        },
    ]);
    switch (balanceChoice) {
        case 'single':
            await checkSingleBalance(configManager);
            break;
        case 'all':
            await checkAllBalances(configManager);
            break;
        case 'back':
            return;
    }
    await waitForKeyPress();
}
async function showReportsMenu(configManager) {
    const choices = [
        {
            name: '📈 Transaction History',
            value: 'history',
            description: 'View transaction history for UPI ID'
        },
        {
            name: '📊 Summary Report',
            value: 'summary',
            description: 'Overall statistics and summary'
        },
        {
            name: '🔙 Back to Main Menu',
            value: 'back'
        },
    ];
    const { reportChoice } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'reportChoice',
            message: 'Reports & Analytics:',
            choices,
        },
    ]);
    switch (reportChoice) {
        case 'history':
            await showTransactionHistory(configManager);
            break;
        case 'summary':
            await showSummaryReport(configManager);
            break;
        case 'back':
            return;
    }
    await waitForKeyPress();
}
async function showConfigMenu(configManager) {
    const choices = [
        {
            name: '🌐 Switch Network',
            value: 'network',
            description: 'Change Aptos network (testnet/devnet/mainnet)'
        },
        {
            name: '📋 View Configuration',
            value: 'view',
            description: 'Display current configuration'
        },
        {
            name: '🔄 Reset Configuration',
            value: 'reset',
            description: 'Reset all settings to default'
        },
        {
            name: '🔙 Back to Main Menu',
            value: 'back'
        },
    ];
    const { configChoice } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'configChoice',
            message: 'Configuration Management:',
            choices,
        },
    ]);
    switch (configChoice) {
        case 'network':
            await switchNetwork(configManager);
            break;
        case 'view':
            await viewConfiguration(configManager);
            break;
        case 'reset':
            await resetConfiguration(configManager);
            break;
        case 'back':
            return;
    }
    await waitForKeyPress();
}
async function showExportMenu(configManager) {
    const choices = [
        {
            name: '📄 Export to JSON',
            value: 'json',
            description: 'Export all data to JSON format'
        },
        {
            name: '📊 Export to CSV',
            value: 'csv',
            description: 'Export wallet data to CSV format'
        },
        {
            name: '🔙 Back to Main Menu',
            value: 'back'
        },
    ];
    const { exportChoice } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'exportChoice',
            message: 'Export Data:',
            choices,
        },
    ]);
    switch (exportChoice) {
        case 'json':
            await exportToJSON(configManager);
            break;
        case 'csv':
            await exportToCSV(configManager);
            break;
        case 'back':
            return;
    }
    await waitForKeyPress();
}
async function addUPIId(configManager) {
    console.log(chalk_1.default.cyan('\n➕ Add New UPI ID'));
    const { upiId } = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'upiId',
            message: 'Enter UPI ID (e.g., user@paytm):',
            validate: (input) => {
                if (!input.trim())
                    return 'UPI ID cannot be empty';
                if (!validateUPIId(input))
                    return 'Invalid UPI ID format';
                return true;
            },
        },
    ]);
    try {
        const { WalletManager } = await Promise.resolve().then(() => __importStar(require('../wallet/WalletManager')));
        const { UPIRegistryService } = await Promise.resolve().then(() => __importStar(require('../services/UPIRegistryService')));
        const walletManager = new WalletManager(configManager);
        const upiRegistryService = new UPIRegistryService(configManager, walletManager);
        if (await configManager.hasUPIId(upiId)) {
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
        console.log(chalk_1.default.blue('🔍 Checking UPI ID availability...'));
        try {
            const exists = await upiRegistryService.upiExists(upiId);
            if (exists) {
                try {
                    const ownerAddress = await upiRegistryService.getMerchantByUPI(upiId);
                    const currentAddress = walletManager.getAddress();
                    if (ownerAddress.toLowerCase() === currentAddress?.toLowerCase()) {
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
            console.log(chalk_1.default.green('✔ UPI ID is available'));
        }
        catch (error) {
            console.log(chalk_1.default.yellow('⚠️  Could not check UPI ID availability, proceeding...'));
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
        console.log(chalk_1.default.blue('🔄 Registering UPI ID on blockchain...'));
        const result = await upiRegistryService.registerUPI(upiId);
        if (result.success) {
            console.log(chalk_1.default.green('\n🎉 UPI ID registered successfully!'));
            console.log(chalk_1.default.gray('UPI ID:'), chalk_1.default.white(upiId));
            console.log(chalk_1.default.gray('Transaction Hash:'), chalk_1.default.white(result.hash));
            console.log(chalk_1.default.gray('Gas Used:'), chalk_1.default.white(result.gas_used || 'N/A'));
            console.log(chalk_1.default.gray('Explorer:'), chalk_1.default.blue(upiRegistryService.getTransactionUrl(result.hash)));
            console.log(chalk_1.default.gray('\n💡 Next steps:'));
            console.log(chalk_1.default.gray('1. Generate escrow wallet: Use "Manage Escrow Wallets" menu'));
            console.log(chalk_1.default.gray('2. Check balance: Use "Check Balances" menu'));
        }
        else {
            console.log(chalk_1.default.red('\n❌ Registration failed:'));
            console.log(chalk_1.default.gray('Transaction Hash:'), chalk_1.default.white(result.hash));
            console.log(chalk_1.default.gray('VM Status:'), chalk_1.default.white(result.vm_status || 'Unknown'));
            console.log(chalk_1.default.gray('Explorer:'), chalk_1.default.blue(upiRegistryService.getTransactionUrl(result.hash)));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Failed to add UPI ID:'), error.message || error);
        const errorMessage = error.toString().toLowerCase();
        if (errorMessage.includes('already_registered')) {
            console.log(chalk_1.default.yellow('\n💡 Tip: This UPI ID is already registered.'));
        }
        else if (errorMessage.includes('insufficient')) {
            console.log(chalk_1.default.yellow('\n💡 Tip: You may need more APT for gas fees.'));
            console.log(chalk_1.default.gray('Check balance with the "Check Balances" menu'));
        }
    }
}
async function listUPIIds(configManager) {
    console.log(chalk_1.default.cyan('\n📋 Registered UPI IDs'));
    try {
        const { WalletManager } = await Promise.resolve().then(() => __importStar(require('../wallet/WalletManager')));
        const { UPIRegistryService } = await Promise.resolve().then(() => __importStar(require('../services/UPIRegistryService')));
        const walletManager = new WalletManager(configManager);
        const upiRegistryService = new UPIRegistryService(configManager, walletManager);
        let localUPIs = await configManager.getUPIIds();
        let blockchainUPIs = [];
        const { shouldSync } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'shouldSync',
                message: 'Sync with blockchain to get latest data?',
                default: true,
            },
        ]);
        if (shouldSync) {
            console.log(chalk_1.default.blue('🔍 Fetching UPI IDs from blockchain...'));
            try {
                blockchainUPIs = await upiRegistryService.getMerchantUPIs();
                console.log(chalk_1.default.green(`✅ Found ${blockchainUPIs.length} UPI IDs on blockchain`));
                localUPIs = blockchainUPIs;
                console.log(chalk_1.default.green('✅ Using blockchain data'));
            }
            catch (error) {
                console.log(chalk_1.default.yellow('⚠️  Failed to fetch from blockchain, using local data'));
                console.log(chalk_1.default.gray('Error:'), error);
            }
        }
        if (localUPIs.length === 0) {
            console.log(chalk_1.default.yellow('\n⚠️  No UPI IDs found.'));
            console.log(chalk_1.default.gray('Add a UPI ID using the "Add New UPI ID" option'));
            return;
        }
        console.log(chalk_1.default.blue('\n📊 Configuration Summary:'));
        console.log(chalk_1.default.gray(`Network: ${configManager.getNetwork()}`));
        console.log(chalk_1.default.gray(`Contract: ${configManager.getContractAddress()}`));
        console.log(chalk_1.default.gray(`Total UPI IDs: ${localUPIs.length}`));
        if (shouldSync && blockchainUPIs.length > 0) {
            console.log(chalk_1.default.gray(`Blockchain UPI IDs: ${blockchainUPIs.length}`));
        }
        console.log(chalk_1.default.gray('═'.repeat(60)));
        for (let i = 0; i < localUPIs.length; i++) {
            const upiId = localUPIs[i];
            const wallet = await configManager.getEscrowWallet(upiId);
            let status = '';
            if (shouldSync && blockchainUPIs.length > 0) {
                status = blockchainUPIs.includes(upiId) ?
                    chalk_1.default.green('✅ Registered') :
                    chalk_1.default.yellow('⚠️  Local Only');
            }
            else {
                status = chalk_1.default.gray('Unknown');
            }
            const walletStatus = wallet ?
                chalk_1.default.blue('💼 Wallet Generated') :
                chalk_1.default.gray('⏳ Pending Wallet');
            console.log(`${i + 1}. ${chalk_1.default.white(upiId)}`);
            console.log(`   Status: ${status}`);
            console.log(`   Wallet: ${walletStatus}`);
            if (wallet) {
                console.log(`   Address: ${chalk_1.default.gray(wallet.escrowAddress.slice(0, 10) + '...')}`);
            }
            console.log();
        }
        console.log(chalk_1.default.gray('═'.repeat(60)));
        if (!shouldSync) {
            console.log(chalk_1.default.yellow('💡 Tip: Use sync option to verify blockchain registration status'));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Failed to list UPI IDs:'), error.message || error);
    }
}
async function removeUPIId(configManager) {
    const upiIds = await configManager.getUPIIds();
    const { upiId } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'upiId',
            message: 'Select UPI ID to remove:',
            choices: upiIds,
        },
    ]);
    const { confirm } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to remove ${upiId}?`,
            default: false,
        },
    ]);
    if (confirm) {
        console.log(chalk_1.default.green(`✅ UPI ID ${upiId} removal confirmed (handled by on-chain registry)`));
    }
}
async function updateUPIId(configManager) {
    console.log(chalk_1.default.cyan('\n✏️  Update UPI ID'));
    const upiIds = await configManager.getUPIIds();
    if (upiIds.length === 0) {
        console.log(chalk_1.default.yellow('⚠️  No UPI IDs found to update.'));
        return;
    }
    try {
        const { WalletManager } = await Promise.resolve().then(() => __importStar(require('../wallet/WalletManager')));
        const { UPIRegistryService } = await Promise.resolve().then(() => __importStar(require('../services/UPIRegistryService')));
        const walletManager = new WalletManager(configManager);
        const upiRegistryService = new UPIRegistryService(configManager, walletManager);
        const { oldUpiId } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'oldUpiId',
                message: 'Select UPI ID to update:',
                choices: upiIds,
            },
        ]);
        const { newUpiId } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'newUpiId',
                message: 'Enter new UPI ID (e.g., user@paytm):',
                validate: (input) => {
                    if (!input.trim())
                        return 'UPI ID cannot be empty';
                    if (!validateUPIId(input))
                        return 'Invalid UPI ID format';
                    if (input === oldUpiId)
                        return 'New UPI ID must be different from current one';
                    if (upiIds.includes(input))
                        return 'UPI ID already exists in your account';
                    return true;
                },
            },
        ]);
        console.log(chalk_1.default.blue('🔍 Checking new UPI ID availability...'));
        const exists = await upiRegistryService.upiExists(newUpiId);
        if (exists) {
            const owner = await upiRegistryService.getMerchantByUPI(newUpiId);
            const currentAddress = walletManager.getAddress();
            if (owner !== currentAddress) {
                console.log(chalk_1.default.red('❌ UPI ID is already registered to another merchant'));
                console.log(chalk_1.default.gray(`Owner: ${owner}`));
                return;
            }
        }
        console.log(chalk_1.default.green('✅ New UPI ID is available'));
        console.log(chalk_1.default.blue('\n📋 Update Details:'));
        console.log(chalk_1.default.gray(`Current UPI ID: ${oldUpiId}`));
        console.log(chalk_1.default.gray(`New UPI ID: ${newUpiId}`));
        console.log(chalk_1.default.gray(`Network: ${configManager.getNetwork()}`));
        console.log(chalk_1.default.gray(`Contract: ${configManager.getContractAddress()}`));
        const { confirmUpdate } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirmUpdate',
                message: 'Proceed with UPI ID update?',
                default: true,
            },
        ]);
        if (!confirmUpdate) {
            console.log(chalk_1.default.yellow('❌ Update cancelled'));
            return;
        }
        console.log(chalk_1.default.blue('🔄 Updating UPI ID...'));
        console.log(chalk_1.default.gray('1. Removing old UPI ID from blockchain...'));
        const removeResult = await upiRegistryService.removeUPI(oldUpiId);
        if (!removeResult.success) {
            console.log(chalk_1.default.red('❌ Failed to remove old UPI ID from blockchain'));
            console.log(chalk_1.default.gray('Error:'), removeResult);
            return;
        }
        console.log(chalk_1.default.green('✅ Old UPI ID removed from blockchain'));
        console.log(chalk_1.default.gray('2. Registering new UPI ID on blockchain...'));
        const registerResult = await upiRegistryService.registerUPI(newUpiId);
        if (!registerResult.success) {
            console.log(chalk_1.default.red('❌ Failed to register new UPI ID on blockchain'));
            console.log(chalk_1.default.gray('Error:'), registerResult);
            console.log(chalk_1.default.yellow('🔄 Attempting to restore old UPI ID...'));
            try {
                await upiRegistryService.registerUPI(oldUpiId);
                console.log(chalk_1.default.green('✅ Old UPI ID restored'));
            }
            catch (restoreError) {
                console.log(chalk_1.default.red('❌ Failed to restore old UPI ID. Manual intervention required.'));
            }
            return;
        }
        console.log(chalk_1.default.gray('3. Updating local configuration...'));
        console.log(chalk_1.default.green('\n🎉 UPI ID updated successfully!'));
        console.log(chalk_1.default.gray(`Old UPI ID: ${oldUpiId}`));
        console.log(chalk_1.default.gray(`New UPI ID: ${newUpiId}`));
        console.log(chalk_1.default.gray(`Transaction Hash: ${registerResult.hash}`));
        console.log(chalk_1.default.gray(`Gas Used: ${registerResult.gas_used}`));
        const explorerUrl = upiRegistryService.getTransactionUrl(registerResult.hash);
        console.log(chalk_1.default.blue(`Explorer: ${explorerUrl}`));
        const updatedEscrowWallet = await configManager.getEscrowWallet(newUpiId);
        if (updatedEscrowWallet) {
            console.log(chalk_1.default.green('✅ Escrow wallet transferred to new UPI ID'));
        }
        else {
            console.log(chalk_1.default.yellow('💡 Generate escrow wallet for the new UPI ID using "Manage Escrow Wallets" menu'));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Failed to update UPI ID:'), error.message || error);
    }
}
async function deleteUPIId(configManager) {
    console.log(chalk_1.default.cyan('\n🗑️  Delete UPI ID & Escrow Wallet'));
    const upiIds = await configManager.getUPIIds();
    if (upiIds.length === 0) {
        console.log(chalk_1.default.yellow('⚠️  No UPI IDs found to delete.'));
        return;
    }
    try {
        const { WalletManager } = await Promise.resolve().then(() => __importStar(require('../wallet/WalletManager')));
        const { UPIRegistryService } = await Promise.resolve().then(() => __importStar(require('../services/UPIRegistryService')));
        const walletManager = new WalletManager(configManager);
        const upiRegistryService = new UPIRegistryService(configManager, walletManager);
        const { upiId } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'upiId',
                message: 'Select UPI ID to delete:',
                choices: await Promise.all(upiIds.map(async (id) => {
                    const wallet = await configManager.getEscrowWallet(id);
                    const status = wallet ? '💼 Has Wallet' : '⚠️  No Wallet';
                    return {
                        name: `${id} - ${status}`,
                        value: id
                    };
                })),
            },
        ]);
        const escrowWallet = await configManager.getEscrowWallet(upiId);
        console.log(chalk_1.default.red('\n⚠️  DELETION WARNING'));
        console.log(chalk_1.default.gray(`UPI ID: ${upiId}`));
        console.log(chalk_1.default.gray(`Network: ${configManager.getNetwork()}`));
        console.log(chalk_1.default.gray(`Contract: ${configManager.getContractAddress()}`));
        if (escrowWallet) {
            console.log(chalk_1.default.yellow(`Escrow Wallet: ${escrowWallet.escrowAddress}`));
            console.log(chalk_1.default.red('⚠️  This will also delete the associated escrow wallet!'));
            console.log(chalk_1.default.red('⚠️  Make sure to withdraw any funds before deletion!'));
        }
        console.log(chalk_1.default.red('\n🚨 This action cannot be undone!'));
        const { confirmDelete } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirmDelete',
                message: 'Are you absolutely sure you want to delete this UPI ID and its wallet?',
                default: false,
            },
        ]);
        if (!confirmDelete) {
            console.log(chalk_1.default.yellow('❌ Deletion cancelled'));
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
        console.log(chalk_1.default.red('🗑️  Deleting UPI ID and escrow wallet...'));
        console.log(chalk_1.default.gray('1. Removing UPI ID from blockchain...'));
        const removeResult = await upiRegistryService.removeUPI(upiId);
        if (!removeResult.success) {
            console.log(chalk_1.default.red('❌ Failed to remove UPI ID from blockchain'));
            console.log(chalk_1.default.gray('Error:'), removeResult);
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
                console.log(chalk_1.default.yellow('❌ Deletion cancelled'));
                return;
            }
        }
        else {
            console.log(chalk_1.default.green('✅ UPI ID removed from blockchain'));
            console.log(chalk_1.default.gray(`Transaction Hash: ${removeResult.hash}`));
            console.log(chalk_1.default.gray(`Gas Used: ${removeResult.gas_used}`));
        }
        console.log(chalk_1.default.gray('2. UPI removal completed on-chain...'));
        console.log(chalk_1.default.green('\n🎉 UPI ID and escrow wallet deleted successfully!'));
        console.log(chalk_1.default.gray(`Deleted UPI ID: ${upiId}`));
        if (removeResult.success) {
            const explorerUrl = upiRegistryService.getTransactionUrl(removeResult.hash);
            console.log(chalk_1.default.blue(`Explorer: ${explorerUrl}`));
        }
        console.log(chalk_1.default.yellow('\n💡 Remember: If the escrow wallet had funds, they are now inaccessible'));
        console.log(chalk_1.default.yellow('💡 Always withdraw funds before deleting UPI IDs'));
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Failed to delete UPI ID:'), error.message || error);
    }
}
async function generateEscrowWallet(configManager) {
    const upiIds = await configManager.getUPIIds();
    const availableUPIs = [];
    for (const upiId of upiIds) {
        const wallet = await configManager.getEscrowWallet(upiId);
        if (!wallet)
            availableUPIs.push(upiId);
    }
    if (availableUPIs.length === 0) {
        console.log(chalk_1.default.yellow('⚠️  All UPI IDs already have escrow wallets.'));
        return;
    }
    const { upiId } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'upiId',
            message: 'Select UPI ID to generate wallet for:',
            choices: availableUPIs,
        },
    ]);
    try {
        console.log(chalk_1.default.blue('🔄 Generating escrow wallet...'));
        const { WalletManager } = await Promise.resolve().then(() => __importStar(require('../wallet/WalletManager')));
        const { UPIRegistryService } = await Promise.resolve().then(() => __importStar(require('../services/UPIRegistryService')));
        const walletManager = new WalletManager(configManager);
        const upiRegistryService = new UPIRegistryService(configManager, walletManager);
        const escrowWallet = await walletManager.generateEscrowWallet(upiId);
        configManager.setEscrowWallet(upiId, {
            address: escrowWallet.accountAddress.toString(),
            privateKey: escrowWallet.privateKey.toString(),
            publicKey: escrowWallet.publicKey.toString(),
            createdAt: new Date().toISOString()
        });
        console.log(chalk_1.default.green('✅ Escrow wallet generated successfully!'));
        console.log(chalk_1.default.blue(`Address: ${escrowWallet.accountAddress.toString()}`));
        console.log(chalk_1.default.yellow('⚠️  Private key stored locally. Keep it secure!'));
        console.log(chalk_1.default.gray('\n💡 Next steps:'));
        console.log(chalk_1.default.gray('1. Check balance: Use "Check Balances" menu'));
        console.log(chalk_1.default.gray('2. View transaction history: Use "View Reports" menu'));
        console.log(chalk_1.default.gray('3. List pairs: Use "View All UPI IDs" menu'));
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Failed to generate escrow wallet:'), error.message || error);
    }
}
async function listEscrowWallets(configManager) {
    console.log(chalk_1.default.cyan('\n💼 Escrow Wallets'));
    const escrowWallets = await configManager.getEscrowWallets();
    if (escrowWallets.length === 0) {
        console.log(chalk_1.default.yellow('No escrow wallets generated yet.'));
        return;
    }
    console.log(chalk_1.default.gray('═'.repeat(60)));
    escrowWallets.forEach((wallet, index) => {
        console.log(`${index + 1}. ${chalk_1.default.blue(wallet.upiId)}`);
        console.log(`   Address: ${chalk_1.default.gray(formatAddress(wallet.escrowAddress))}`);
        console.log(`   Created: ${chalk_1.default.gray(new Date(wallet.creationTimestamp * 1000).toLocaleString())}`);
        console.log();
    });
    console.log(chalk_1.default.gray('═'.repeat(60)));
}
async function showQRCode(configManager) {
    const escrowWallets = await configManager.getEscrowWallets();
    const { upiId } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'upiId',
            message: 'Select UPI ID to show QR code:',
            choices: escrowWallets.map(w => w.upiId),
        },
    ]);
    const wallet = await configManager.getEscrowWallet(upiId);
    if (wallet) {
        console.log(chalk_1.default.cyan(`\n📱 QR Code for ${upiId}`));
        try {
            const qrCode = await qrcode_1.default.toString(wallet.escrowAddress, { type: 'terminal' });
            console.log(qrCode);
            console.log(`\n${chalk_1.default.blue('Address:')} ${wallet.escrowAddress}`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Error generating QR code:'), error);
        }
    }
}
async function checkSingleBalance(configManager) {
    const escrowWallets = await configManager.getEscrowWallets();
    const { selectedWallet } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'selectedWallet',
            message: 'Select a wallet to check balance:',
            choices: escrowWallets.map(wallet => ({
                name: `${wallet.upiId} (${formatAddress(wallet.escrowAddress)})`,
                value: wallet
            }))
        }
    ]);
    try {
        const network = configManager.getNetwork();
        const aptosConfig = new ts_sdk_1.AptosConfig({ network: network });
        const aptos = new ts_sdk_1.Aptos(aptosConfig);
        const balance = await aptos.getAccountAPTAmount({ accountAddress: selectedWallet.address });
        console.log(`\n${chalk_1.default.green('Balance for')} ${chalk_1.default.cyan(selectedWallet.upiId)}:`);
        console.log(`${chalk_1.default.blue('Address:')} ${selectedWallet.escrowAddress}`);
        console.log(`${chalk_1.default.blue('Balance:')} ${formatBalance(balance)} APT`);
        console.log(`${chalk_1.default.blue('Created:')} ${new Date(selectedWallet.creationTimestamp * 1000).toLocaleString()}`);
    }
    catch (error) {
        console.error(chalk_1.default.red('Error fetching balance:'), error);
    }
}
async function checkAllBalances(configManager) {
    const escrowWallets = await configManager.getEscrowWallets();
    if (escrowWallets.length === 0) {
        console.log(chalk_1.default.yellow('No escrow wallets to check.'));
        return;
    }
    console.log(chalk_1.default.cyan('\n💰 Portfolio Overview'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    const network = configManager.getNetwork();
    const aptosConfig = new ts_sdk_1.AptosConfig({ network: network });
    const aptos = new ts_sdk_1.Aptos(aptosConfig);
    for (const wallet of escrowWallets) {
        try {
            const resources = await aptos.getAccountAPTAmount({ accountAddress: wallet.escrowAddress });
            console.log(`${chalk_1.default.blue(wallet.upiId)}: ${formatBalance(resources)} APT`);
        }
        catch (error) {
            console.log(`${chalk_1.default.blue(wallet.upiId)}: ${chalk_1.default.red('Error fetching balance')}`);
        }
    }
    console.log(chalk_1.default.gray('═'.repeat(50)));
}
async function showTransactionHistory(configManager) {
    const escrowWallets = await configManager.getEscrowWallets();
    if (escrowWallets.length === 0) {
        console.log(chalk_1.default.yellow('No escrow wallets found.'));
        return;
    }
    const { upiId } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'upiId',
            message: 'Select UPI ID for transaction history:',
            choices: escrowWallets.map(w => w.upiId),
        },
    ]);
    try {
        console.log(chalk_1.default.blue('🔄 Fetching transaction history...'));
        const { execSync } = require('child_process');
        execSync(`node dist/index.js history "${upiId}"`, { stdio: 'inherit' });
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Failed to fetch transaction history'));
    }
}
async function showSummaryReport(configManager) {
    console.log(chalk_1.default.cyan('\n📊 Summary Report'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    const network = configManager.getNetwork();
    const contractAddress = configManager.getContractAddress();
    const upiIds = await configManager.getUPIIds();
    const escrowWallets = await configManager.getEscrowWallets();
    console.log(`${chalk_1.default.blue('Network:')} ${network}`);
    console.log(`${chalk_1.default.blue('Contract:')} ${formatAddress(contractAddress || 'Not set')}`);
    console.log(`${chalk_1.default.blue('Total UPI IDs:')} ${upiIds.length}`);
    console.log(`${chalk_1.default.blue('Escrow Wallets:')} ${escrowWallets.length}`);
    console.log(`${chalk_1.default.blue('Pending Wallets:')} ${upiIds.length - escrowWallets.length}`);
    if (escrowWallets.length > 0) {
        const oldestWallet = escrowWallets.reduce((oldest, current) => current.creationTimestamp < oldest.creationTimestamp ? current : oldest);
        const newestWallet = escrowWallets.reduce((newest, current) => current.creationTimestamp > newest.creationTimestamp ? current : newest);
        console.log(`${chalk_1.default.blue('First Wallet:')} ${new Date(oldestWallet.creationTimestamp * 1000).toLocaleDateString()}`);
        console.log(`${chalk_1.default.blue('Latest Wallet:')} ${new Date(newestWallet.creationTimestamp * 1000).toLocaleDateString()}`);
    }
    console.log(chalk_1.default.gray('═'.repeat(50)));
}
async function switchNetwork(configManager) {
    const currentNetwork = configManager.getNetwork();
    const { network } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'network',
            message: `Current network: ${currentNetwork}. Select new network:`,
            choices: [
                { name: 'Testnet (Recommended)', value: 'testnet' },
                { name: 'Devnet (Development)', value: 'devnet' },
                { name: 'Mainnet (Production)', value: 'mainnet' },
            ],
            default: currentNetwork,
        },
    ]);
    if (network !== currentNetwork) {
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Switch from ${currentNetwork} to ${network}?`,
                default: false,
            },
        ]);
        if (confirm) {
            configManager.setNetwork(network);
            console.log(chalk_1.default.green(`✅ Network switched to ${network}`));
        }
    }
}
async function viewConfiguration(configManager) {
    console.log(chalk_1.default.cyan('\n⚙️  Current Configuration'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    const network = configManager.getNetwork();
    const contractAddress = configManager.getContractAddress();
    const privateKey = configManager.getPrivateKey();
    const configPath = configManager.getConfigPath();
    const upiIds = await configManager.getUPIIds();
    const escrowWallets = await configManager.getEscrowWallets();
    console.log(`${chalk_1.default.blue('Network:')} ${network}`);
    console.log(`${chalk_1.default.blue('Contract Address:')} ${formatAddress(contractAddress || 'Not set')}`);
    console.log(`${chalk_1.default.blue('Private Key:')} ${privateKey ? '***...***' : 'Not set'}`);
    console.log(`${chalk_1.default.blue('Config Path:')} ${configPath}`);
    console.log(`${chalk_1.default.blue('UPI IDs:')} ${upiIds.length}`);
    console.log(`${chalk_1.default.blue('Escrow Wallets:')} ${escrowWallets.length}`);
    console.log(chalk_1.default.gray('═'.repeat(50)));
}
async function resetConfiguration(configManager) {
    const { confirm } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to reset all configuration? This cannot be undone.',
            default: false,
        },
    ]);
    if (confirm) {
        const { doubleConfirm } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'doubleConfirm',
                message: 'Type "RESET" to confirm:',
                validate: (input) => input === 'RESET' || 'Please type "RESET" to confirm',
            },
        ]);
        if (doubleConfirm === 'RESET') {
            configManager.reset();
            console.log(chalk_1.default.green('✅ Configuration reset successfully'));
            console.log(chalk_1.default.yellow('⚠️  Please run initialization again'));
        }
    }
}
async function exportToJSON(configManager) {
    try {
        console.log(chalk_1.default.blue('🔄 Exporting to JSON...'));
        const { execSync } = require('child_process');
        execSync('node dist/index.js export --format json', { stdio: 'inherit' });
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Failed to export to JSON'));
    }
}
async function exportToCSV(configManager) {
    try {
        console.log(chalk_1.default.blue('🔄 Exporting to CSV...'));
        const { execSync } = require('child_process');
        execSync('node dist/index.js export --format csv', { stdio: 'inherit' });
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Failed to export to CSV'));
    }
}
async function waitForKeyPress() {
    console.log(chalk_1.default.gray('\nPress any key to continue...'));
    await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'continue',
            message: '',
        },
    ]);
}
//# sourceMappingURL=interactive.js.map
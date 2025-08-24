import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigManager } from '../config/ConfigManager.js';
import { UPIRegistryService } from '../services/UPIRegistryService.js';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import QRCode from 'qrcode';

// Utility functions
function formatAddress(address: string): string {
  if (!address || address === 'Not set') return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function formatBalance(balance: number): string {
  return (balance / 100000000).toFixed(8); // Convert from Octas to APT
}

function validateUPIId(upiId: string): boolean {
  const upiRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$/;
  return upiRegex.test(upiId);
}

interface MenuChoice {
  name: string;
  value: string;
  description?: string;
}

export const interactiveCommand = new Command()
  .name('interactive')
  .alias('i')
  .description('Interactive menu-driven interface for P2M operations')
  .action(async () => {
    console.log(chalk.cyan.bold('\n🚀 P2M Merchant CLI - Interactive Mode'));
    console.log(chalk.gray('Navigate through options using arrow keys and Enter\n'));

    const configManager = new ConfigManager();
    
    // Check if CLI is initialized
    if (!configManager.isInitialized()) {
      console.log(chalk.yellow('⚠️  CLI not initialized. Please run initialization first.'));
      const { shouldInit } = await inquirer.prompt([
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
        } catch (error) {
          console.log(chalk.red('❌ Initialization failed. Please run "aptos-p2m init" manually.'));
          return;
        }
      } else {
        console.log(chalk.yellow('👋 Exiting. Run "aptos-p2m init" when ready.'));
        return;
      }
    }

    await showMainMenu(configManager);
  });

async function showMainMenu(configManager: ConfigManager): Promise<void> {
  while (true) {
    console.clear();
    
    // Display current configuration status
    const network = configManager.getNetwork();
    const contractAddress = configManager.getContractAddress();
    const upiIds = configManager.getUPIIds();
    const escrowWalletsRecord = configManager.getAllEscrowWallets();
    const escrowWallets = Object.entries(escrowWalletsRecord).map(([upiId, wallet]) => ({ upiId, ...wallet }));
    
    console.log(chalk.cyan.bold('🚀 P2M Merchant CLI - Interactive Mode'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.blue(`📡 Network: ${network}`));
    console.log(chalk.blue(`📋 Contract: ${formatAddress(contractAddress || 'Not set')}`));
    console.log(chalk.blue(`🆔 UPI IDs: ${upiIds.length}`));
    console.log(chalk.blue(`💼 Escrow Wallets: ${escrowWallets.length}`));
    console.log(chalk.gray('═'.repeat(50)));
    console.log();

    const mainMenuChoices: MenuChoice[] = [
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

    const { mainChoice } = await inquirer.prompt([
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
        console.log(chalk.green('👋 Thank you for using P2M Merchant CLI!'));
        return;
    }
  }
}

async function showUPIMenu(configManager: ConfigManager): Promise<void> {
  const upiIds = configManager.getUPIIds();
  
  const choices: MenuChoice[] = [
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
    choices.push(
      {
        name: '✏️  Update UPI ID',
        value: 'update',
        description: 'Update an existing UPI ID'
      },
      {
        name: '🗑️  Delete UPI ID & Wallet',
        value: 'delete',
        description: 'Delete UPI ID and its escrow wallet'
      },
      {
        name: '🗑️  Remove UPI ID',
        value: 'remove',
        description: 'Remove an existing UPI ID (legacy)'
      }
    );
  }

  choices.push({
    name: '🔙 Back to Main Menu',
    value: 'back'
  });

  const { upiChoice } = await inquirer.prompt([
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

async function showWalletMenu(configManager: ConfigManager): Promise<void> {
  const upiIds = configManager.getUPIIds();
  const escrowWalletsRecord = configManager.getAllEscrowWallets();
  const escrowWallets = Object.entries(escrowWalletsRecord).map(([upiId, wallet]) => ({ upiId, ...wallet }));
  
  if (upiIds.length === 0) {
    console.log(chalk.yellow('⚠️  No UPI IDs registered. Please add a UPI ID first.'));
    await waitForKeyPress();
    return;
  }

  const choices: MenuChoice[] = [
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

  const { walletChoice } = await inquirer.prompt([
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

async function showBalanceMenu(configManager: ConfigManager): Promise<void> {
  const escrowWalletsRecord = configManager.getAllEscrowWallets();
  const escrowWallets = Object.entries(escrowWalletsRecord).map(([upiId, wallet]) => ({ upiId, ...wallet }));
  
  if (escrowWallets.length === 0) {
    console.log(chalk.yellow('⚠️  No escrow wallets found. Please generate wallets first.'));
    await waitForKeyPress();
    return;
  }

  const choices: MenuChoice[] = [
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

  const { balanceChoice } = await inquirer.prompt([
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

async function showReportsMenu(configManager: ConfigManager): Promise<void> {
  const choices: MenuChoice[] = [
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

  const { reportChoice } = await inquirer.prompt([
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

async function showConfigMenu(configManager: ConfigManager): Promise<void> {
  const choices: MenuChoice[] = [
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

  const { configChoice } = await inquirer.prompt([
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

async function showExportMenu(configManager: ConfigManager): Promise<void> {
  const choices: MenuChoice[] = [
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

  const { exportChoice } = await inquirer.prompt([
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

// Implementation functions
async function addUPIId(configManager: ConfigManager): Promise<void> {
  console.log(chalk.cyan('\n➕ Add New UPI ID'));
  
  const { upiId } = await inquirer.prompt([
    {
      type: 'input',
      name: 'upiId',
      message: 'Enter UPI ID (e.g., user@paytm):',
      validate: (input: string) => {
        if (!input.trim()) return 'UPI ID cannot be empty';
        if (!validateUPIId(input)) return 'Invalid UPI ID format';
        return true;
      },
    },
  ]);

  try {
    // Import required modules
    const { WalletManager } = await import('../wallet/WalletManager.js');
    const { UPIRegistryService } = await import('../services/UPIRegistryService.js');
    
    // Create instances
    const walletManager = new WalletManager(configManager);
    const upiRegistryService = new UPIRegistryService(configManager, walletManager);
    
    // Check if UPI ID already exists locally
    if (configManager.hasUPIId(upiId)) {
      console.log(chalk.yellow('⚠️  UPI ID already exists in local config.'));
      const { shouldContinue } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldContinue',
          message: 'Continue with blockchain registration?',
          default: true,
        },
      ]);
      if (!shouldContinue) return;
    }

    // Check if UPI ID exists on blockchain
    console.log(chalk.blue('🔍 Checking UPI ID availability...'));
    try {
      const exists = await upiRegistryService.upiExists(upiId);
      if (exists) {
        try {
          const ownerAddress = await upiRegistryService.getMerchantByUPI(upiId);
          const currentAddress = walletManager.getAddress();
          
          if (ownerAddress.toLowerCase() === currentAddress?.toLowerCase()) {
            console.log(chalk.yellow('\n⚠️  This UPI ID is already registered to your account.'));
            configManager.addUPIId(upiId); // Update local config
            console.log(chalk.green('✅ Added to local config.'));
            return;
          } else {
            console.log(chalk.red('\n❌ This UPI ID is registered to another merchant.'));
            console.log(chalk.gray('Owner Address:'), chalk.white(ownerAddress));
            return;
          }
        } catch (error) {
          console.log(chalk.red('\n❌ UPI ID is registered but owner details unavailable.'));
          return;
        }
      }
      console.log(chalk.green('✔ UPI ID is available'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not check UPI ID availability, proceeding...'));
    }

    // Confirm registration
    console.log(chalk.blue('\n📋 Registration Details:'));
    console.log(chalk.gray('UPI ID:'), chalk.white(upiId));
    console.log(chalk.gray('Network:'), chalk.white(configManager.getNetwork()));
    console.log(chalk.gray('Contract:'), chalk.white(upiRegistryService.getContractAddress()));

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Register this UPI ID on blockchain?',
        default: true,
      },
    ]);

    if (!confirmed) {
      console.log(chalk.yellow('\n⚠️  Registration cancelled.'));
      return;
    }
    
    // Register UPI ID
    console.log(chalk.blue('🔄 Registering UPI ID on blockchain...'));
    const result = await upiRegistryService.registerUPI(upiId);
    
    if (result.success) {
      console.log(chalk.green('\n🎉 UPI ID registered successfully!'));
      console.log(chalk.gray('UPI ID:'), chalk.white(upiId));
      console.log(chalk.gray('Transaction Hash:'), chalk.white(result.hash));
      console.log(chalk.gray('Gas Used:'), chalk.white(result.gas_used || 'N/A'));
      console.log(chalk.gray('Explorer:'), chalk.blue(upiRegistryService.getTransactionUrl(result.hash)));
      
      console.log(chalk.gray('\n💡 Next steps:'));
      console.log(chalk.gray('1. Generate escrow wallet: Use "Manage Escrow Wallets" menu'));
      console.log(chalk.gray('2. Check balance: Use "Check Balances" menu'));
    } else {
      console.log(chalk.red('\n❌ Registration failed:'));
      console.log(chalk.gray('Transaction Hash:'), chalk.white(result.hash));
      console.log(chalk.gray('VM Status:'), chalk.white(result.vm_status || 'Unknown'));
      console.log(chalk.gray('Explorer:'), chalk.blue(upiRegistryService.getTransactionUrl(result.hash)));
    }
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to add UPI ID:'), error.message || error);
    
    // Provide helpful error messages
    const errorMessage = error.toString().toLowerCase();
    if (errorMessage.includes('already_registered')) {
      console.log(chalk.yellow('\n💡 Tip: This UPI ID is already registered.'));
    } else if (errorMessage.includes('insufficient')) {
      console.log(chalk.yellow('\n💡 Tip: You may need more APT for gas fees.'));
      console.log(chalk.gray('Check balance with the "Check Balances" menu'));
    }
  }
}

async function listUPIIds(configManager: ConfigManager): Promise<void> {
  console.log(chalk.cyan('\n📋 Registered UPI IDs'));
  
  try {
    // Import required modules
    const { WalletManager } = await import('../wallet/WalletManager.js');
    const { UPIRegistryService } = await import('../services/UPIRegistryService.js');
    
    // Create instances
    const walletManager = new WalletManager(configManager);
    const upiRegistryService = new UPIRegistryService(configManager, walletManager);
    
    let localUPIs = configManager.getUPIIds();
    let blockchainUPIs: string[] = [];

    // Ask user if they want to sync with blockchain
    const { shouldSync } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldSync',
        message: 'Sync with blockchain to get latest data?',
        default: true,
      },
    ]);

    // Fetch from blockchain if requested
    if (shouldSync) {
      console.log(chalk.blue('🔍 Fetching UPI IDs from blockchain...'));
      try {
        blockchainUPIs = await upiRegistryService.getMerchantUPIs();
        console.log(chalk.green(`✅ Found ${blockchainUPIs.length} UPI IDs on blockchain`));
        
        // Sync local config with blockchain data
        configManager.importConfig({ upiIds: blockchainUPIs });
        localUPIs = blockchainUPIs;
        console.log(chalk.green('✅ Local config synced with blockchain'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Failed to fetch from blockchain, using local data'));
        console.log(chalk.gray('Error:'), error);
      }
    }

    if (localUPIs.length === 0) {
      console.log(chalk.yellow('\n⚠️  No UPI IDs found.'));
      console.log(chalk.gray('Add a UPI ID using the "Add New UPI ID" option'));
      return;
    }

    // Display UPI IDs with status
    console.log(chalk.blue('\n📊 Configuration Summary:'));
    console.log(chalk.gray(`Network: ${configManager.getNetwork()}`));
    console.log(chalk.gray(`Contract: ${configManager.getContractAddress()}`));
    console.log(chalk.gray(`Total UPI IDs: ${localUPIs.length}`));
    
    if (shouldSync && blockchainUPIs.length > 0) {
      console.log(chalk.gray(`Blockchain UPI IDs: ${blockchainUPIs.length}`));
    }
    
    console.log(chalk.gray('═'.repeat(60)));
    
    for (let i = 0; i < localUPIs.length; i++) {
      const upiId = localUPIs[i];
      const wallet = configManager.getEscrowWallet(upiId);
      
      let status = '';
      if (shouldSync && blockchainUPIs.length > 0) {
        status = blockchainUPIs.includes(upiId) ? 
          chalk.green('✅ Registered') : 
          chalk.yellow('⚠️  Local Only');
      } else {
        status = chalk.gray('Unknown');
      }
      
      const walletStatus = wallet ? 
        chalk.blue('💼 Wallet Generated') : 
        chalk.gray('⏳ Pending Wallet');
      
      console.log(`${i + 1}. ${chalk.white(upiId)}`);
      console.log(`   Status: ${status}`);
      console.log(`   Wallet: ${walletStatus}`);
      if (wallet) {
        console.log(`   Address: ${chalk.gray(wallet.address.slice(0, 10) + '...')}`);
      }
      console.log();
    }
    
    console.log(chalk.gray('═'.repeat(60)));
    
    if (!shouldSync) {
      console.log(chalk.yellow('💡 Tip: Use sync option to verify blockchain registration status'));
    }
    
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to list UPI IDs:'), error.message || error);
  }
}

async function removeUPIId(configManager: ConfigManager): Promise<void> {
  const upiIds = configManager.getUPIIds();
  
  const { upiId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'upiId',
      message: 'Select UPI ID to remove:',
      choices: upiIds,
    },
  ]);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to remove ${upiId}?`,
      default: false,
    },
  ]);

  if (confirm) {
    configManager.removeUPIId(upiId);
    configManager.removeEscrowWallet(upiId);
    console.log(chalk.green(`✅ UPI ID ${upiId} removed successfully`));
  }
}

async function updateUPIId(configManager: ConfigManager): Promise<void> {
  console.log(chalk.cyan('\n✏️  Update UPI ID'));
  
  const upiIds = configManager.getUPIIds();
  if (upiIds.length === 0) {
    console.log(chalk.yellow('⚠️  No UPI IDs found to update.'));
    return;
  }

  try {
    // Import required modules
    const { WalletManager } = await import('../wallet/WalletManager.js');
    const { UPIRegistryService } = await import('../services/UPIRegistryService.js');
    
    // Create instances
    const walletManager = new WalletManager(configManager);
    const upiRegistryService = new UPIRegistryService(configManager, walletManager);

    // Select UPI ID to update
    const { oldUpiId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'oldUpiId',
        message: 'Select UPI ID to update:',
        choices: upiIds,
      },
    ]);

    // Get new UPI ID
    const { newUpiId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newUpiId',
        message: 'Enter new UPI ID (e.g., user@paytm):',
        validate: (input: string) => {
          if (!input.trim()) return 'UPI ID cannot be empty';
          if (!validateUPIId(input)) return 'Invalid UPI ID format';
          if (input === oldUpiId) return 'New UPI ID must be different from current one';
          if (upiIds.includes(input)) return 'UPI ID already exists in your account';
          return true;
        },
      },
    ]);

    console.log(chalk.blue('🔍 Checking new UPI ID availability...'));
    
    // Check if new UPI ID exists on blockchain
    const exists = await upiRegistryService.upiExists(newUpiId);
    if (exists) {
      const owner = await upiRegistryService.getMerchantByUPI(newUpiId);
      const currentAddress = walletManager.getAddress();
      
      if (owner !== currentAddress) {
        console.log(chalk.red('❌ UPI ID is already registered to another merchant'));
        console.log(chalk.gray(`Owner: ${owner}`));
        return;
      }
    }

    console.log(chalk.green('✅ New UPI ID is available'));

    // Show update details
    console.log(chalk.blue('\n📋 Update Details:'));
    console.log(chalk.gray(`Current UPI ID: ${oldUpiId}`));
    console.log(chalk.gray(`New UPI ID: ${newUpiId}`));
    console.log(chalk.gray(`Network: ${configManager.getNetwork()}`));
    console.log(chalk.gray(`Contract: ${configManager.getContractAddress()}`));

    const { confirmUpdate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmUpdate',
        message: 'Proceed with UPI ID update?',
        default: true,
      },
    ]);

    if (!confirmUpdate) {
      console.log(chalk.yellow('❌ Update cancelled'));
      return;
    }

    console.log(chalk.blue('🔄 Updating UPI ID...'));
    
    // Step 1: Remove old UPI ID from blockchain
    console.log(chalk.gray('1. Removing old UPI ID from blockchain...'));
    const removeResult = await upiRegistryService.removeUPI(oldUpiId);
    
    if (!removeResult.success) {
      console.log(chalk.red('❌ Failed to remove old UPI ID from blockchain'));
      console.log(chalk.gray('Error:'), removeResult);
      return;
    }
    
    console.log(chalk.green('✅ Old UPI ID removed from blockchain'));
    
    // Step 2: Register new UPI ID on blockchain
    console.log(chalk.gray('2. Registering new UPI ID on blockchain...'));
    const registerResult = await upiRegistryService.registerUPI(newUpiId);
    
    if (!registerResult.success) {
      console.log(chalk.red('❌ Failed to register new UPI ID on blockchain'));
      console.log(chalk.gray('Error:'), registerResult);
      
      // Try to re-register the old UPI ID
      console.log(chalk.yellow('🔄 Attempting to restore old UPI ID...'));
      try {
        await upiRegistryService.registerUPI(oldUpiId);
        console.log(chalk.green('✅ Old UPI ID restored'));
      } catch (restoreError) {
        console.log(chalk.red('❌ Failed to restore old UPI ID. Manual intervention required.'));
      }
      return;
    }
    
    // Step 3: Update local configuration
    console.log(chalk.gray('3. Updating local configuration...'));
    const escrowWallet = configManager.getEscrowWallet(oldUpiId);
    
    configManager.removeUPIId(oldUpiId);
    configManager.addUPIId(newUpiId);
    
    if (escrowWallet) {
      configManager.removeEscrowWallet(oldUpiId);
      configManager.setEscrowWallet(newUpiId, escrowWallet);
    }
    
    console.log(chalk.green('\n🎉 UPI ID updated successfully!'));
    console.log(chalk.gray(`Old UPI ID: ${oldUpiId}`));
    console.log(chalk.gray(`New UPI ID: ${newUpiId}`));
    console.log(chalk.gray(`Transaction Hash: ${registerResult.hash}`));
    console.log(chalk.gray(`Gas Used: ${registerResult.gas_used}`));
    
    const explorerUrl = upiRegistryService.getTransactionUrl(registerResult.hash);
    console.log(chalk.blue(`Explorer: ${explorerUrl}`));
    
    if (escrowWallet) {
      console.log(chalk.green('✅ Escrow wallet transferred to new UPI ID'));
    } else {
      console.log(chalk.yellow('💡 Generate escrow wallet for the new UPI ID using "Manage Escrow Wallets" menu'));
    }
    
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to update UPI ID:'), error.message || error);
  }
}

async function deleteUPIId(configManager: ConfigManager): Promise<void> {
  console.log(chalk.cyan('\n🗑️  Delete UPI ID & Escrow Wallet'));
  
  const upiIds = configManager.getUPIIds();
  if (upiIds.length === 0) {
    console.log(chalk.yellow('⚠️  No UPI IDs found to delete.'));
    return;
  }

  try {
    // Import required modules
    const { WalletManager } = await import('../wallet/WalletManager.js');
    const { UPIRegistryService } = await import('../services/UPIRegistryService.js');
    
    // Create instances
    const walletManager = new WalletManager(configManager);
    const upiRegistryService = new UPIRegistryService(configManager, walletManager);

    // Select UPI ID to delete
    const { upiId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'upiId',
        message: 'Select UPI ID to delete:',
        choices: upiIds.map(id => {
          const wallet = configManager.getEscrowWallet(id);
          const status = wallet ? '💼 Has Wallet' : '⚠️  No Wallet';
          return {
            name: `${id} - ${status}`,
            value: id
          };
        }),
      },
    ]);

    const escrowWallet = configManager.getEscrowWallet(upiId);
    
    // Show deletion details
    console.log(chalk.red('\n⚠️  DELETION WARNING'));
    console.log(chalk.gray(`UPI ID: ${upiId}`));
    console.log(chalk.gray(`Network: ${configManager.getNetwork()}`));
    console.log(chalk.gray(`Contract: ${configManager.getContractAddress()}`));
    
    if (escrowWallet) {
      console.log(chalk.yellow(`Escrow Wallet: ${escrowWallet.address}`));
      console.log(chalk.red('⚠️  This will also delete the associated escrow wallet!'));
      console.log(chalk.red('⚠️  Make sure to withdraw any funds before deletion!'));
    }
    
    console.log(chalk.red('\n🚨 This action cannot be undone!'));

    const { confirmDelete } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmDelete',
        message: 'Are you absolutely sure you want to delete this UPI ID and its wallet?',
        default: false,
      },
    ]);

    if (!confirmDelete) {
      console.log(chalk.yellow('❌ Deletion cancelled'));
      return;
    }

    // Double confirmation for safety
    const { doubleConfirm } = await inquirer.prompt([
      {
        type: 'input',
        name: 'doubleConfirm',
        message: `Type "DELETE ${upiId}" to confirm:`,
        validate: (input: string) => {
          return input === `DELETE ${upiId}` ? true : 'Please type the exact confirmation text';
        },
      },
    ]);

    console.log(chalk.red('🗑️  Deleting UPI ID and escrow wallet...'));
    
    // Step 1: Remove UPI ID from blockchain
    console.log(chalk.gray('1. Removing UPI ID from blockchain...'));
    const removeResult = await upiRegistryService.removeUPI(upiId);
    
    if (!removeResult.success) {
      console.log(chalk.red('❌ Failed to remove UPI ID from blockchain'));
      console.log(chalk.gray('Error:'), removeResult);
      console.log(chalk.yellow('💡 You can still remove it locally, but it will remain on blockchain'));
      
      const { proceedLocal } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceedLocal',
          message: 'Remove from local configuration only?',
          default: false,
        },
      ]);
      
      if (!proceedLocal) {
        console.log(chalk.yellow('❌ Deletion cancelled'));
        return;
      }
    } else {
      console.log(chalk.green('✅ UPI ID removed from blockchain'));
      console.log(chalk.gray(`Transaction Hash: ${removeResult.hash}`));
      console.log(chalk.gray(`Gas Used: ${removeResult.gas_used}`));
    }
    
    // Step 2: Remove from local configuration
    console.log(chalk.gray('2. Removing from local configuration...'));
    configManager.removeUPIId(upiId);
    
    if (escrowWallet) {
      configManager.removeEscrowWallet(upiId);
      console.log(chalk.green('✅ Escrow wallet removed from local configuration'));
    }
    
    console.log(chalk.green('\n🎉 UPI ID and escrow wallet deleted successfully!'));
    console.log(chalk.gray(`Deleted UPI ID: ${upiId}`));
    
    if (removeResult.success) {
      const explorerUrl = upiRegistryService.getTransactionUrl(removeResult.hash);
      console.log(chalk.blue(`Explorer: ${explorerUrl}`));
    }
    
    console.log(chalk.yellow('\n💡 Remember: If the escrow wallet had funds, they are now inaccessible'));
    console.log(chalk.yellow('💡 Always withdraw funds before deleting UPI IDs'));
    
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to delete UPI ID:'), error.message || error);
  }
}

async function generateEscrowWallet(configManager: ConfigManager): Promise<void> {
  const upiIds = configManager.getUPIIds();
  const availableUPIs = upiIds.filter(upiId => !configManager.getEscrowWallet(upiId));
  
  if (availableUPIs.length === 0) {
    console.log(chalk.yellow('⚠️  All UPI IDs already have escrow wallets.'));
    return;
  }

  const { upiId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'upiId',
      message: 'Select UPI ID to generate wallet for:',
      choices: availableUPIs,
    },
  ]);

  try {
    console.log(chalk.blue('🔄 Generating escrow wallet...'));
    
    // Import required modules
    const { WalletManager } = await import('../wallet/WalletManager.js');
    const { UPIRegistryService } = await import('../services/UPIRegistryService.js');
    
    // Create instances
    const walletManager = new WalletManager(configManager);
    const upiRegistryService = new UPIRegistryService(configManager, walletManager);
    
    // Generate escrow wallet
    const escrowWallet = await walletManager.generateEscrowWallet();
    
    // Save escrow wallet to config
    configManager.setEscrowWallet(upiId, {
      address: escrowWallet.accountAddress.toString(),
      privateKey: (escrowWallet as any).privateKey.toString(),
      publicKey: escrowWallet.publicKey.toString(),
      createdAt: new Date().toISOString(),
    });
    
    console.log(chalk.green('✅ Escrow wallet generated successfully!'));
    console.log(chalk.blue(`Address: ${escrowWallet.accountAddress.toString()}`));
    console.log(chalk.yellow('⚠️  Private key stored locally. Keep it secure!'));
    console.log(chalk.gray('\n💡 Next steps:'));
    console.log(chalk.gray('1. Check balance: Use "Check Balances" menu'));
    console.log(chalk.gray('2. View transaction history: Use "View Reports" menu'));
    console.log(chalk.gray('3. List pairs: Use "View All UPI IDs" menu'));
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to generate escrow wallet:'), error.message || error);
  }
}

async function listEscrowWallets(configManager: ConfigManager): Promise<void> {
  console.log(chalk.cyan('\n💼 Escrow Wallets'));
  const escrowWalletsRecord = configManager.getAllEscrowWallets();
  const escrowWallets = Object.entries(escrowWalletsRecord).map(([upiId, wallet]) => ({ upiId, ...wallet }));
  
  if (escrowWallets.length === 0) {
    console.log(chalk.yellow('No escrow wallets generated yet.'));
    return;
  }

  console.log(chalk.gray('═'.repeat(60)));
  escrowWallets.forEach((wallet, index) => {
    console.log(`${index + 1}. ${chalk.blue(wallet.upiId)}`);
    console.log(`   Address: ${chalk.gray(formatAddress(wallet.address))}`);
    console.log(`   Created: ${chalk.gray(new Date(wallet.createdAt).toLocaleString())}`);
    console.log();
  });
  console.log(chalk.gray('═'.repeat(60)));
}

async function showQRCode(configManager: ConfigManager): Promise<void> {
  const escrowWalletsRecord = configManager.getAllEscrowWallets();
  const escrowWallets = Object.entries(escrowWalletsRecord).map(([upiId, wallet]) => ({ upiId, ...wallet }));
  
  const { upiId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'upiId',
      message: 'Select UPI ID to show QR code:',
      choices: escrowWallets.map(w => w.upiId),
    },
  ]);

  const wallet = configManager.getEscrowWallet(upiId);
  if (wallet) {
    console.log(chalk.cyan(`\n📱 QR Code for ${upiId}`));
    try {
      const qrCode = await QRCode.toString(wallet.address, { type: 'terminal' });
      console.log(qrCode);
      console.log(`\n${chalk.blue('Address:')} ${wallet.address}`);
    } catch (error) {
      console.error(chalk.red('Error generating QR code:'), error);
    }
  }
}

async function checkSingleBalance(configManager: ConfigManager): Promise<void> {
  const escrowWalletsRecord = configManager.getAllEscrowWallets();
  const escrowWallets = Object.entries(escrowWalletsRecord).map(([upiId, wallet]) => ({ upiId, ...wallet }));
  
  const { selectedWallet } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedWallet',
      message: 'Select a wallet to check balance:',
      choices: escrowWallets.map(wallet => ({
        name: `${wallet.upiId} (${formatAddress(wallet.address)})`,
        value: wallet
      }))
    }
  ]);

  try {
    const network = configManager.getNetwork();
    const aptosConfig = new AptosConfig({ network: network as Network });
    const aptos = new Aptos(aptosConfig);
    const balance = await aptos.getAccountAPTAmount({ accountAddress: selectedWallet.address });
    
    console.log(`\n${chalk.green('Balance for')} ${chalk.cyan(selectedWallet.upiId)}:`);
    console.log(`${chalk.blue('Address:')} ${selectedWallet.address}`);
    console.log(`${chalk.blue('Balance:')} ${formatBalance(balance)} APT`);
    console.log(`${chalk.blue('Created:')} ${selectedWallet.createdAt}`);
  } catch (error) {
    console.error(chalk.red('Error fetching balance:'), error);
  }
}

async function checkAllBalances(configManager: ConfigManager): Promise<void> {
  const escrowWalletsRecord = configManager.getAllEscrowWallets();
  const escrowWallets = Object.entries(escrowWalletsRecord).map(([upiId, wallet]) => ({ upiId, ...wallet }));
  
  if (escrowWallets.length === 0) {
    console.log(chalk.yellow('No escrow wallets to check.'));
    return;
  }

  console.log(chalk.cyan('\n💰 Portfolio Overview'));
  console.log(chalk.gray('═'.repeat(50)));
  
  const network = configManager.getNetwork();
  const aptosConfig = new AptosConfig({ network: network as Network });
  const aptos = new Aptos(aptosConfig);
  
  for (const wallet of escrowWallets) {
    try {
      const resources = await aptos.getAccountAPTAmount({ accountAddress: wallet.address });
      console.log(`${chalk.blue(wallet.upiId)}: ${formatBalance(resources)} APT`);
    } catch (error) {
      console.log(`${chalk.blue(wallet.upiId)}: ${chalk.red('Error fetching balance')}`);
    }
  }
  
  console.log(chalk.gray('═'.repeat(50)));
}

async function showTransactionHistory(configManager: ConfigManager): Promise<void> {
  const escrowWalletsRecord = configManager.getAllEscrowWallets();
  const escrowWallets = Object.entries(escrowWalletsRecord).map(([upiId, wallet]) => ({ upiId, ...wallet }));
  
  if (escrowWallets.length === 0) {
    console.log(chalk.yellow('No escrow wallets found.'));
    return;
  }

  const { upiId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'upiId',
      message: 'Select UPI ID for transaction history:',
      choices: escrowWallets.map(w => w.upiId),
    },
  ]);

  try {
    console.log(chalk.blue('🔄 Fetching transaction history...'));
    const { execSync } = require('child_process');
    execSync(`node dist/index.js history "${upiId}"`, { stdio: 'inherit' });
  } catch (error) {
    console.log(chalk.red('❌ Failed to fetch transaction history'));
  }
}

async function showSummaryReport(configManager: ConfigManager): Promise<void> {
  console.log(chalk.cyan('\n📊 Summary Report'));
  console.log(chalk.gray('═'.repeat(50)));
  
  const network = configManager.getNetwork();
  const contractAddress = configManager.getContractAddress();
  const upiIds = configManager.getUPIIds();
  const escrowWalletsRecord = configManager.getAllEscrowWallets();
  const escrowWallets = Object.entries(escrowWalletsRecord).map(([upiId, wallet]) => ({ upiId, ...wallet }));
  
  console.log(`${chalk.blue('Network:')} ${network}`);
  console.log(`${chalk.blue('Contract:')} ${formatAddress(contractAddress || 'Not set')}`);
  console.log(`${chalk.blue('Total UPI IDs:')} ${upiIds.length}`);
  console.log(`${chalk.blue('Escrow Wallets:')} ${escrowWallets.length}`);
  console.log(`${chalk.blue('Pending Wallets:')} ${upiIds.length - escrowWallets.length}`);
  
  if (escrowWallets.length > 0) {
    const oldestWallet = escrowWallets.reduce((oldest, current) => 
      new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest
    );
    const newestWallet = escrowWallets.reduce((newest, current) => 
      new Date(current.createdAt) > new Date(newest.createdAt) ? current : newest
    );
    
    console.log(`${chalk.blue('First Wallet:')} ${new Date(oldestWallet.createdAt).toLocaleDateString()}`);
    console.log(`${chalk.blue('Latest Wallet:')} ${new Date(newestWallet.createdAt).toLocaleDateString()}`);
  }
  
  console.log(chalk.gray('═'.repeat(50)));
}

async function switchNetwork(configManager: ConfigManager): Promise<void> {
  const currentNetwork = configManager.getNetwork();
  
  const { network } = await inquirer.prompt([
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
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Switch from ${currentNetwork} to ${network}?`,
        default: false,
      },
    ]);

    if (confirm) {
      configManager.setNetwork(network);
      console.log(chalk.green(`✅ Network switched to ${network}`));
    }
  }
}

async function viewConfiguration(configManager: ConfigManager): Promise<void> {
  console.log(chalk.cyan('\n⚙️  Current Configuration'));
  console.log(chalk.gray('═'.repeat(50)));
  
  const network = configManager.getNetwork();
  const contractAddress = configManager.getContractAddress();
  const privateKey = configManager.getPrivateKey();
  const configPath = configManager.getConfigPath();
  const upiIds = configManager.getUPIIds();
  const escrowWallets = configManager.getAllEscrowWallets();
  
  console.log(`${chalk.blue('Network:')} ${network}`);
  console.log(`${chalk.blue('Contract Address:')} ${formatAddress(contractAddress || 'Not set')}`);
  console.log(`${chalk.blue('Private Key:')} ${privateKey ? '***...***' : 'Not set'}`);
  console.log(`${chalk.blue('Config Path:')} ${configPath}`);
  console.log(`${chalk.blue('UPI IDs:')} ${upiIds.length}`);
  console.log(`${chalk.blue('Escrow Wallets:')} ${escrowWallets.length}`);
  
  console.log(chalk.gray('═'.repeat(50)));
}

async function resetConfiguration(configManager: ConfigManager): Promise<void> {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to reset all configuration? This cannot be undone.',
      default: false,
    },
  ]);

  if (confirm) {
    const { doubleConfirm } = await inquirer.prompt([
      {
        type: 'input',
        name: 'doubleConfirm',
        message: 'Type "RESET" to confirm:',
        validate: (input: string) => input === 'RESET' || 'Please type "RESET" to confirm',
      },
    ]);

    if (doubleConfirm === 'RESET') {
      configManager.reset();
      console.log(chalk.green('✅ Configuration reset successfully'));
      console.log(chalk.yellow('⚠️  Please run initialization again'));
    }
  }
}

async function exportToJSON(configManager: ConfigManager): Promise<void> {
  try {
    console.log(chalk.blue('🔄 Exporting to JSON...'));
    const { execSync } = require('child_process');
    execSync('node dist/index.js export --format json', { stdio: 'inherit' });
  } catch (error) {
    console.log(chalk.red('❌ Failed to export to JSON'));
  }
}

async function exportToCSV(configManager: ConfigManager): Promise<void> {
  try {
    console.log(chalk.blue('🔄 Exporting to CSV...'));
    const { execSync } = require('child_process');
    execSync('node dist/index.js export --format csv', { stdio: 'inherit' });
  } catch (error) {
    console.log(chalk.red('❌ Failed to export to CSV'));
  }
}

async function waitForKeyPress(): Promise<void> {
  console.log(chalk.gray('\nPress any key to continue...'));
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: '',
    },
  ]);
}
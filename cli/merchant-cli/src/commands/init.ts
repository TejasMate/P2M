import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../config/ConfigManager';
import { WalletManager } from '../wallet/WalletManager';
import { UPIRegistryService } from '../services/UPIRegistryService';

export async function initAction(
  configManager: ConfigManager,
  walletManager: WalletManager,
  upiRegistryService: UPIRegistryService,
  options: any
) {
  try {
    console.log(chalk.cyan('\n🚀 P2M CLI Initialization'));
    console.log(chalk.gray('Setting up your merchant CLI environment\n'));

    // Check if already initialized
    if (configManager.isInitialized() && !options.reset) {
      const { shouldReset } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldReset',
          message: 'CLI is already initialized. Do you want to reset the configuration?',
          default: false,
        },
      ]);

      if (!shouldReset) {
        console.log(chalk.yellow('\n⚠️  Initialization cancelled.'));
        console.log(configManager.getConfigSummary());
        return;
      }
    }

    // Reset configuration if requested
    if (options.reset || configManager.isInitialized()) {
      const spinner = ora('Resetting configuration...').start();
      configManager.reset();
      spinner.succeed('Configuration reset');
    }

    // Set network
    let network = options.network;
    if (!network) {
      const networkChoice = await inquirer.prompt([
        {
          type: 'list',
          name: 'network',
          message: 'Select Aptos network:',
          choices: [
            { name: 'Testnet (Recommended)', value: 'testnet' },
            { name: 'Devnet (Development)', value: 'devnet' },
            { name: 'Mainnet (Production)', value: 'mainnet' },
          ],
          default: 'testnet',
        },
      ]);
      network = networkChoice.network;
    }

    // Set contract address
    let contractAddress = options.contract;
    if (!contractAddress) {
      // Default contract addresses for different networks
      const defaultContracts = {
        testnet: '0xf9d57e56266876b07459f919263caf276b07978766ace8e17b65003bd227fea5',
        devnet: '0xf9d57e56266876b07459f919263caf276b07978766ace8e17b65003bd227fea5', // Same contract deployed to devnet
        mainnet: '0x789...', // Replace with actual mainnet contract
      };

      const { useDefault } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useDefault',
          message: `Use default contract address for ${network}?`,
          default: true,
        },
      ]);

      if (useDefault) {
        contractAddress = defaultContracts[network as keyof typeof defaultContracts];
      } else {
        const { customContract } = await inquirer.prompt([
          {
            type: 'input',
            name: 'customContract',
            message: 'Enter contract address:',
            validate: (input) => {
              if (!input || !input.startsWith('0x')) {
                return 'Please enter a valid contract address starting with 0x';
              }
              return true;
            },
          },
        ]);
        contractAddress = customContract;
      }
    }

    // Handle wallet setup
    let privateKey = options.privateKey;
    if (!privateKey) {
      const { walletChoice } = await inquirer.prompt([
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
        const { importedKey } = await inquirer.prompt([
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

    // Initialize configuration
    const spinner = ora('Initializing configuration...').start();
    
    try {
      // Set basic config
      configManager.setNetwork(network);
      configManager.setContractAddress(contractAddress);
      
      // Initialize wallet
      if (privateKey) {
        walletManager.importAccount(privateKey);
        spinner.text = 'Wallet imported successfully';
      } else {
        await walletManager.createNewAccount();
        spinner.text = 'New wallet generated';
      }
      
      spinner.succeed('Configuration initialized successfully');
      
      // Display summary
      console.log(chalk.green('\n✅ P2M CLI initialized successfully!'));
      console.log(chalk.cyan('\n📋 Configuration Summary:'));
      console.log(configManager.getConfigSummary());
      
      // Show wallet info
      const walletInfo = walletManager.getWalletInfo();
      if (walletInfo) {
        console.log(chalk.cyan('\n💼 Wallet Information:'));
        console.log(chalk.gray(`Address: ${walletInfo.address}`));
        console.log(chalk.gray(`Network: ${network}`));
      }
      
      // Next steps
      console.log(chalk.yellow('\n🎯 Next Steps:'));
      console.log(chalk.gray('1. Add UPI ID: aptos-p2m add-upi <your-upi-id>'));
      console.log(chalk.gray('2. Generate escrow wallet: aptos-p2m generate <upi-id>'));
      console.log(chalk.gray('3. Check balance: aptos-p2m balance <upi-id>'));
      
    } catch (error) {
      spinner.fail('Initialization failed');
      throw error;
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Initialization failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
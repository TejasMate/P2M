import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ConfigManager } from '../config/ConfigManager';
import { WalletManager } from '../wallet/WalletManager';
import { UPIRegistryService } from '../services/UPIRegistryService';

// UPI ID validation function
function isValidUPIId(upiId: string): boolean {
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
  return upiRegex.test(upiId);
}

export async function addUpiAction(
  configManager: ConfigManager,
  walletManager: WalletManager,
  upiRegistryService: UPIRegistryService,
  upiId: string,
  options: any
) {
  try {
    console.log(chalk.cyan('\n💳 Add UPI ID'));
    console.log(chalk.gray(`Adding UPI ID: ${upiId}\n`));

    // Check if CLI is initialized
    if (!configManager.isInitialized()) {
      console.log(chalk.red('❌ CLI not initialized. Run `aptos-p2m init` first.'));
      return;
    }

    // Validate UPI ID format
    if (!isValidUPIId(upiId)) {
      console.log(chalk.red('❌ Invalid UPI ID format.'));
      console.log(chalk.gray('Expected format: username@bank (e.g., john.doe@paytm)'));
      return;
    }

    // Check if UPI ID already exists locally
    if (configManager.hasUPIId(upiId) && !options.force) {
      console.log(chalk.yellow('⚠️  UPI ID already exists in local config.'));
      const { shouldContinue } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldContinue',
          message: 'Continue with blockchain registration?',
          default: false,
        },
      ]);

      if (!shouldContinue) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    // Check if UPI ID exists on blockchain
    const spinner = ora('Checking UPI ID availability...').start();
    try {
      const exists = await upiRegistryService.upiExists(upiId);
      if (exists && !options.force) {
        spinner.fail('UPI ID already registered on blockchain');
        console.log(chalk.red(`❌ UPI ID '${upiId}' is already registered by another merchant.`));
        return;
      }
      spinner.succeed('UPI ID is available');
    } catch (error) {
      spinner.fail('Failed to check UPI ID availability');
      throw error;
    }

    // Register UPI ID on blockchain
    const registerSpinner = ora('Registering UPI ID on blockchain...').start();
    try {
      const txHash = await upiRegistryService.registerUPI(upiId);
      registerSpinner.succeed('UPI ID registered successfully');
      
      console.log(chalk.green('\n✅ UPI ID registered successfully!'));
      console.log(chalk.gray(`Transaction Hash: ${txHash}`));
      console.log(chalk.gray(`UPI ID: ${upiId}`));
      
      // Save to local config
      configManager.addUPIId(upiId);
      console.log(chalk.green('✅ UPI ID saved to local configuration'));
      
      // Show next steps
      console.log(chalk.yellow('\n🎯 Next Steps:'));
      console.log(chalk.gray(`1. Generate escrow wallet: aptos-p2m generate ${upiId}`));
      console.log(chalk.gray(`2. Check balance: aptos-p2m balance ${upiId}`));
      console.log(chalk.gray('3. View all pairs: aptos-p2m list-pairs'));
      
    } catch (error) {
      registerSpinner.fail('Failed to register UPI ID');
      throw error;
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to add UPI ID:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
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

export async function updateUpiAction(
  configManager: ConfigManager,
  walletManager: WalletManager,
  upiRegistryService: UPIRegistryService,
  oldUpiId: string,
  newUpiId: string,
  options: { force?: boolean }
): Promise<void> {
  try {
    console.log(chalk.cyan('\n✏️  Update UPI ID'));
    console.log(chalk.gray(`Updating: ${oldUpiId} → ${newUpiId}\n`));

    // Check if CLI is initialized
    if (!configManager.isInitialized()) {
      console.log(chalk.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
      return;
    }

    // Validate UPI ID formats
    if (!isValidUPIId(oldUpiId)) {
      console.log(chalk.red('❌ Invalid old UPI ID format.'));
      console.log(chalk.gray('Expected format: user@provider (e.g., john@paytm)'));
      return;
    }

    if (!isValidUPIId(newUpiId)) {
      console.log(chalk.red('❌ Invalid new UPI ID format.'));
      console.log(chalk.gray('Expected format: user@provider (e.g., john@paytm)'));
      return;
    }

    if (oldUpiId === newUpiId) {
      console.log(chalk.red('❌ New UPI ID must be different from the current one.'));
      return;
    }

    // Check if old UPI ID exists locally
    if (!configManager.hasUPIId(oldUpiId)) {
      console.log(chalk.yellow('⚠️  Old UPI ID not found in local config.'));
      
      // Check if it exists on blockchain
      const spinner = ora('Checking old UPI ID on blockchain...').start();
      try {
        const exists = await upiRegistryService.upiExists(oldUpiId);
        if (!exists) {
          spinner.fail('Old UPI ID not found on blockchain');
          console.log(chalk.red('❌ Old UPI ID does not exist.'));
          return;
        }
        
        // Verify ownership
        const ownerAddress = await upiRegistryService.getMerchantByUPI(oldUpiId);
        const currentAddress = walletManager.getAddress();
        
        if (ownerAddress.toLowerCase() !== currentAddress?.toLowerCase()) {
          spinner.fail('Not authorized to update this UPI ID');
          console.log(chalk.red('❌ You are not the owner of this UPI ID.'));
          console.log(chalk.gray('Owner Address:'), chalk.white(ownerAddress));
          console.log(chalk.gray('Your Address:'), chalk.white(currentAddress));
          return;
        }
        
        spinner.succeed('Old UPI ID found and verified');
      } catch (error) {
        spinner.fail('Failed to verify old UPI ID');
        console.log(chalk.red('❌ Error checking old UPI ID:'), error);
        return;
      }
    }

    // Check if new UPI ID already exists locally
    if (configManager.hasUPIId(newUpiId)) {
      console.log(chalk.red('❌ New UPI ID already exists in your account.'));
      return;
    }

    // Check new UPI ID availability on blockchain
    const spinner = ora('Checking new UPI ID availability...').start();
    try {
      const exists = await upiRegistryService.upiExists(newUpiId);
      if (exists) {
        const owner = await upiRegistryService.getMerchantByUPI(newUpiId);
        const currentAddress = walletManager.getAddress();
        
        if (owner.toLowerCase() !== currentAddress?.toLowerCase()) {
          spinner.fail('New UPI ID is already registered');
          console.log(chalk.red('❌ New UPI ID is already registered to another merchant.'));
          console.log(chalk.gray('Owner Address:'), chalk.white(owner));
          return;
        }
      }
      spinner.succeed('New UPI ID is available');
    } catch (error) {
      spinner.fail('Failed to check new UPI ID availability');
      console.log(chalk.red('❌ Error checking new UPI ID:'), error);
      return;
    }

    // Show update details
    console.log(chalk.blue('\n📋 Update Details:'));
    console.log(chalk.gray('Current UPI ID:'), chalk.white(oldUpiId));
    console.log(chalk.gray('New UPI ID:'), chalk.white(newUpiId));
    console.log(chalk.gray('Network:'), chalk.white(configManager.getNetwork()));
    console.log(chalk.gray('Contract:'), chalk.white(configManager.getContractAddress()));
    
    const escrowWallet = configManager.getEscrowWallet(oldUpiId);
    if (escrowWallet) {
      console.log(chalk.gray('Escrow Wallet:'), chalk.white(escrowWallet.address));
      console.log(chalk.green('✅ Escrow wallet will be transferred to new UPI ID'));
    } else {
      console.log(chalk.yellow('⚠️  No escrow wallet associated with old UPI ID'));
    }

    // Confirm update
    if (!options.force) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'Proceed with UPI ID update?',
          default: true,
        },
      ]);

      if (!confirmed) {
        console.log(chalk.yellow('❌ Update cancelled.'));
        return;
      }
    }

    console.log(chalk.blue('\n🔄 Updating UPI ID...'));
    
    // Step 1: Remove old UPI ID from blockchain
    const removeSpinner = ora('1. Removing old UPI ID from blockchain...').start();
    try {
      const removeResult = await upiRegistryService.removeUPI(oldUpiId);
      
      if (!removeResult.success) {
        removeSpinner.fail('Failed to remove old UPI ID');
        console.log(chalk.red('❌ Failed to remove old UPI ID from blockchain'));
        console.log(chalk.gray('Error:'), removeResult.vm_status);
        return;
      }
      
      removeSpinner.succeed('Old UPI ID removed from blockchain');
      console.log(chalk.gray('Transaction Hash:'), chalk.blue(removeResult.hash));
    } catch (error) {
      removeSpinner.fail('Failed to remove old UPI ID');
      console.log(chalk.red('❌ Error removing old UPI ID:'), error);
      return;
    }
    
    // Step 2: Register new UPI ID on blockchain
    const registerSpinner = ora('2. Registering new UPI ID on blockchain...').start();
    try {
      const registerResult = await upiRegistryService.registerUPI(newUpiId);
      
      if (!registerResult.success) {
        registerSpinner.fail('Failed to register new UPI ID');
        console.log(chalk.red('❌ Failed to register new UPI ID on blockchain'));
        console.log(chalk.gray('Error:'), registerResult.vm_status);
        
        // Try to re-register the old UPI ID
        console.log(chalk.yellow('🔄 Attempting to restore old UPI ID...'));
        try {
          const restoreResult = await upiRegistryService.registerUPI(oldUpiId);
          if (restoreResult.success) {
            console.log(chalk.green('✅ Old UPI ID restored successfully'));
          } else {
            console.log(chalk.red('❌ Failed to restore old UPI ID. Manual intervention required.'));
          }
        } catch (restoreError) {
          console.log(chalk.red('❌ Failed to restore old UPI ID:'), restoreError);
        }
        return;
      }
      
      registerSpinner.succeed('New UPI ID registered on blockchain');
      console.log(chalk.gray('Transaction Hash:'), chalk.blue(registerResult.hash));
    } catch (error) {
      registerSpinner.fail('Failed to register new UPI ID');
      console.log(chalk.red('❌ Error registering new UPI ID:'), error);
      
      // Try to re-register the old UPI ID
      console.log(chalk.yellow('🔄 Attempting to restore old UPI ID...'));
      try {
        await upiRegistryService.registerUPI(oldUpiId);
        console.log(chalk.green('✅ Old UPI ID restored successfully'));
      } catch (restoreError) {
        console.log(chalk.red('❌ Failed to restore old UPI ID:'), restoreError);
      }
      return;
    }
    
    // Step 3: Update local configuration
    const configSpinner = ora('3. Updating local configuration...').start();
    try {
      // Remove old UPI ID
      configManager.removeUPIId(oldUpiId);
      
      // Add new UPI ID
      configManager.addUPIId(newUpiId);
      
      // Transfer escrow wallet if exists
      if (escrowWallet) {
        configManager.removeEscrowWallet(oldUpiId);
        configManager.setEscrowWallet(newUpiId, escrowWallet);
      }
      
      configSpinner.succeed('Local configuration updated');
    } catch (error) {
      configSpinner.fail('Failed to update local configuration');
      console.log(chalk.red('❌ Error updating local config:'), error);
    }
    
    console.log(chalk.green('\n🎉 UPI ID updated successfully!'));
    console.log(chalk.gray('Old UPI ID:'), chalk.white(oldUpiId));
    console.log(chalk.gray('New UPI ID:'), chalk.white(newUpiId));
    
    if (escrowWallet) {
      console.log(chalk.green('✅ Escrow wallet transferred to new UPI ID'));
      console.log(chalk.gray('Wallet Address:'), chalk.white(escrowWallet.address));
    } else {
      console.log(chalk.yellow('💡 Generate escrow wallet for the new UPI ID using:'));
      console.log(chalk.blue(`   p2m-cli generate ${newUpiId}`));
    }
    
    const explorerUrl = upiRegistryService.getTransactionUrl('');
    if (explorerUrl) {
      console.log(chalk.blue('\n🔗 View on Explorer:'));
      console.log(chalk.blue(explorerUrl.replace('transaction/', 'account/')));
    }
    
  } catch (error: any) {
    console.log(chalk.red('\n❌ Failed to update UPI ID:'), error.message || error);
    process.exit(1);
  }
}
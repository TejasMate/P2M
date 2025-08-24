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

export async function deleteUpiAction(
  configManager: ConfigManager,
  walletManager: WalletManager,
  upiRegistryService: UPIRegistryService,
  upiId: string,
  options: { force?: boolean }
): Promise<void> {
  try {
    console.log(chalk.cyan('\n🗑️  Delete UPI ID & Escrow Wallet'));
    console.log(chalk.gray(`Deleting: ${upiId}\n`));

    // Check if CLI is initialized
    if (!configManager.isInitialized()) {
      console.log(chalk.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
      return;
    }

    // Validate UPI ID format
    if (!isValidUPIId(upiId)) {
      console.log(chalk.red('❌ Invalid UPI ID format.'));
      console.log(chalk.gray('Expected format: user@provider (e.g., john@paytm)'));
      return;
    }

    // Check if UPI ID exists locally
    const hasLocalUPI = configManager.hasUPIId(upiId);
    if (!hasLocalUPI) {
      console.log(chalk.yellow('⚠️  UPI ID not found in local config.'));
    }

    // Check if UPI ID exists on blockchain and verify ownership
    const spinner = ora('Checking UPI ID on blockchain...').start();
    let blockchainExists = false;
    try {
      const exists = await upiRegistryService.upiExists(upiId);
      if (!exists) {
        spinner.warn('UPI ID not found on blockchain');
        
        if (hasLocalUPI) {
          console.log(chalk.yellow('\n⚠️  UPI ID exists locally but not on blockchain.'));
          const { removeLocal } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'removeLocal',
              message: 'Remove from local configuration only?',
              default: true,
            },
          ]);
          
          if (removeLocal) {
            configManager.removeUPIId(upiId);
            const escrowWallet = configManager.getEscrowWallet(upiId);
            if (escrowWallet) {
              configManager.removeEscrowWallet(upiId);
              console.log(chalk.green('✅ UPI ID and escrow wallet removed from local config.'));
            } else {
              console.log(chalk.green('✅ UPI ID removed from local config.'));
            }
          } else {
            console.log(chalk.yellow('❌ Deletion cancelled.'));
          }
        } else {
          console.log(chalk.red('❌ UPI ID not found anywhere.'));
        }
        return;
      }
      
      blockchainExists = true;
      
      // Verify ownership
      const ownerAddress = await upiRegistryService.getMerchantByUPI(upiId);
      const currentAddress = walletManager.getAddress();
      
      if (ownerAddress.toLowerCase() !== currentAddress?.toLowerCase()) {
        spinner.fail('Not authorized to delete this UPI ID');
        console.log(chalk.red('❌ You are not the owner of this UPI ID.'));
        console.log(chalk.gray('Owner Address:'), chalk.white(ownerAddress));
        console.log(chalk.gray('Your Address:'), chalk.white(currentAddress));
        return;
      }
      
      spinner.succeed('UPI ID found and verified');
    } catch (error) {
      spinner.fail('Failed to verify UPI ID');
      console.log(chalk.red('❌ Error checking UPI ID:'), error);
      return;
    }

    const escrowWallet = configManager.getEscrowWallet(upiId);
    
    // Show deletion warning
    console.log(chalk.red('\n⚠️  DELETION WARNING'));
    console.log(chalk.gray('UPI ID:'), chalk.white(upiId));
    console.log(chalk.gray('Network:'), chalk.white(configManager.getNetwork()));
    console.log(chalk.gray('Contract:'), chalk.white(configManager.getContractAddress()));
    
    if (escrowWallet) {
      console.log(chalk.yellow('Escrow Wallet:'), chalk.white(escrowWallet.address));
      console.log(chalk.red('⚠️  This will also delete the associated escrow wallet!'));
      console.log(chalk.red('⚠️  Make sure to withdraw any funds before deletion!'));
      
      // Check wallet balance if possible
      try {
        // Note: Balance check would require switching to escrow wallet temporarily
        // For now, we'll show a general warning about potential funds
        console.log(chalk.yellow('⚠️  Could not check escrow wallet balance'));
        console.log(chalk.red('⚠️  If this wallet has funds, they will be lost!'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not check wallet balance'));
      }
    }
    
    console.log(chalk.red('\n🚨 This action cannot be undone!'));

    // Confirm deletion
    if (!options.force) {
      const { confirmDelete } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmDelete',
          message: 'Are you absolutely sure you want to delete this UPI ID and its wallet?',
          default: false,
        },
      ]);

      if (!confirmDelete) {
        console.log(chalk.yellow('❌ Deletion cancelled.'));
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
    }

    console.log(chalk.red('\n🗑️  Deleting UPI ID and escrow wallet...'));
    
    let blockchainSuccess = false;
    
    // Step 1: Remove UPI ID from blockchain (if it exists there)
    if (blockchainExists) {
      const removeSpinner = ora('1. Removing UPI ID from blockchain...').start();
      try {
        const removeResult = await upiRegistryService.removeUPI(upiId);
        
        if (!removeResult.success) {
          removeSpinner.fail('Failed to remove UPI ID from blockchain');
          console.log(chalk.red('❌ Failed to remove UPI ID from blockchain'));
          console.log(chalk.gray('Error:'), removeResult.vm_status);
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
            console.log(chalk.yellow('❌ Deletion cancelled.'));
            return;
          }
        } else {
          removeSpinner.succeed('UPI ID removed from blockchain');
          console.log(chalk.gray('Transaction Hash:'), chalk.blue(removeResult.hash));
          console.log(chalk.gray('Gas Used:'), chalk.white(removeResult.gas_used));
          blockchainSuccess = true;
        }
      } catch (error) {
        removeSpinner.fail('Failed to remove UPI ID from blockchain');
        console.log(chalk.red('❌ Error removing UPI ID:'), error);
        
        const { proceedLocal } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceedLocal',
            message: 'Remove from local configuration only?',
            default: false,
          },
        ]);
        
        if (!proceedLocal) {
          console.log(chalk.yellow('❌ Deletion cancelled.'));
          return;
        }
      }
    }
    
    // Step 2: Remove from local configuration
    const configSpinner = ora('2. Removing from local configuration...').start();
    try {
      if (hasLocalUPI) {
        configManager.removeUPIId(upiId);
      }
      
      if (escrowWallet) {
        configManager.removeEscrowWallet(upiId);
        configSpinner.succeed('UPI ID and escrow wallet removed from local configuration');
      } else {
        configSpinner.succeed('UPI ID removed from local configuration');
      }
    } catch (error) {
      configSpinner.fail('Failed to update local configuration');
      console.log(chalk.red('❌ Error updating local config:'), error);
    }
    
    console.log(chalk.green('\n🎉 UPI ID and escrow wallet deleted successfully!'));
    console.log(chalk.gray('Deleted UPI ID:'), chalk.white(upiId));
    
    if (blockchainSuccess) {
      const explorerUrl = upiRegistryService.getTransactionUrl('');
      if (explorerUrl) {
        console.log(chalk.blue('🔗 View on Explorer:'));
        console.log(chalk.blue(explorerUrl.replace('transaction/', 'account/')));
      }
    }
    
    if (escrowWallet) {
      console.log(chalk.yellow('\n💡 Remember: If the escrow wallet had funds, they are now inaccessible'));
      console.log(chalk.yellow('💡 Always withdraw funds before deleting UPI IDs'));
    }
    
    // Show remaining UPI IDs
    const remainingUPIs = configManager.getUPIIds();
    if (remainingUPIs.length > 0) {
      console.log(chalk.blue('\n📋 Remaining UPI IDs:'));
      remainingUPIs.forEach(id => {
        const wallet = configManager.getEscrowWallet(id);
        const status = wallet ? '💼 Has Wallet' : '⚠️  No Wallet';
        console.log(chalk.gray(`  • ${id} - ${status}`));
      });
    } else {
      console.log(chalk.yellow('\n📋 No UPI IDs remaining in your account'));
      console.log(chalk.blue('💡 Add a new UPI ID using: p2m-cli add-upi <upi-id>'));
    }
    
  } catch (error: any) {
    console.log(chalk.red('\n❌ Failed to delete UPI ID:'), error.message || error);
    process.exit(1);
  }
}
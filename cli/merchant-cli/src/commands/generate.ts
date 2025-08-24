import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
const qrcode = require('qrcode-terminal');
import { ConfigManager } from '../config/ConfigManager';
import { WalletManager } from '../wallet/WalletManager';
import { UPIRegistryService } from '../services/UPIRegistryService';

export async function generateAction(
  configManager: ConfigManager,
  walletManager: WalletManager,
  upiRegistryService: UPIRegistryService,
  upiId: string,
  options: any
) {
  try {
    console.log(chalk.cyan('\n🔐 Generate Escrow Wallet'));
    console.log(chalk.gray(`Generating escrow wallet for UPI ID: ${upiId}\n`));

    // Check if CLI is initialized
    if (!configManager.isInitialized()) {
      console.log(chalk.red('❌ CLI not initialized. Run `aptos-p2m init` first.'));
      return;
    }

    // Check if UPI ID exists in local config
    if (!configManager.hasUPIId(upiId)) {
      console.log(chalk.red(`❌ UPI ID '${upiId}' not found in local configuration.`));
      console.log(chalk.gray(`Add it first: aptos-p2m add-upi ${upiId}`));
      return;
    }

    // Check if escrow wallet already exists for this UPI ID
    const existingWallet = configManager.getEscrowWallet(upiId);
    if (existingWallet) {
      console.log(chalk.yellow('⚠️  Escrow wallet already exists for this UPI ID.'));
      const { shouldRegenerate } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldRegenerate',
          message: 'Do you want to generate a new escrow wallet? (This will replace the existing one)',
          default: false,
        },
      ]);

      if (!shouldRegenerate) {
        console.log(chalk.yellow('Operation cancelled.'));
        console.log(chalk.cyan('\n📋 Existing Escrow Wallet:'));
        console.log(chalk.gray(`Address: ${existingWallet.address}`));
        console.log(chalk.gray(`UPI ID: ${upiId}`));
        return;
      }
    }

    // Generate new escrow wallet
    const spinner = ora('Generating escrow wallet...').start();
    try {
      const escrowWallet = await walletManager.generateEscrowWallet();
      spinner.succeed('Escrow wallet generated successfully');
      
      // Save escrow wallet to config
      configManager.setEscrowWallet(upiId, {
        address: escrowWallet.accountAddress.toString(),
        privateKey: (escrowWallet as any).privateKey.toString(),
        publicKey: escrowWallet.publicKey.toString(),
        createdAt: new Date().toISOString(),
      });
      
      console.log(chalk.green('\n✅ Escrow wallet generated successfully!'));
      console.log(chalk.cyan('\n📋 Escrow Wallet Details:'));
      console.log(chalk.gray(`UPI ID: ${upiId}`));
      console.log(chalk.gray(`Address: ${escrowWallet.accountAddress.toString()}`));
      console.log(chalk.gray(`Public Key: ${escrowWallet.publicKey.toString()}`));
      
      // Show QR code for the address
      console.log(chalk.cyan('\n📱 QR Code for Escrow Address:'));
      qrcode.generate(escrowWallet.accountAddress.toString(), { small: true });
      
      // Security warning
      console.log(chalk.yellow('\n⚠️  SECURITY WARNING:'));
      console.log(chalk.red('• The private key is stored locally in your configuration'));
      console.log(chalk.red('• Keep your configuration file secure'));
      console.log(chalk.red('• Consider backing up your configuration'));
      
      // Show private key option
      const { showPrivateKey } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'showPrivateKey',
          message: 'Do you want to display the private key? (Not recommended for production)',
          default: false,
        },
      ]);
      
      if (showPrivateKey) {
        console.log(chalk.red('\n🔑 Private Key (KEEP SECURE):'));
        console.log(chalk.white((escrowWallet as any).privateKey.toString()));
      }
      
      // Next steps
      console.log(chalk.yellow('\n🎯 Next Steps:'));
      console.log(chalk.gray(`1. Check balance: aptos-p2m balance ${upiId}`));
      console.log(chalk.gray(`2. View transaction history: aptos-p2m history ${upiId}`));
      console.log(chalk.gray('3. List all pairs: aptos-p2m list-pairs'));
      
    } catch (error) {
      spinner.fail('Failed to generate escrow wallet');
      throw error;
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to generate escrow wallet:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
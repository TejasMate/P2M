import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { ConfigManager } from '../config/ConfigManager';
import { WalletManager } from '../wallet/WalletManager';
import { UPIRegistryService } from '../services/UPIRegistryService';

export async function balanceAction(
  configManager: ConfigManager,
  walletManager: WalletManager,
  upiRegistryService: UPIRegistryService,
  upiId: string,
  options: any
) {
  try {
    console.log(chalk.cyan('\n💰 Check Balance'));
    console.log(chalk.gray(`Checking balance for UPI ID: ${upiId}\n`));

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

    // Get escrow wallet for this UPI ID
    const escrowWallet = configManager.getEscrowWallet(upiId);
    if (!escrowWallet) {
      console.log(chalk.red(`❌ No escrow wallet found for UPI ID '${upiId}'.`));
      console.log(chalk.gray(`Generate one first: aptos-p2m generate ${upiId}`));
      return;
    }

    console.log(chalk.cyan('📋 Wallet Information:'));
    console.log(chalk.gray(`UPI ID: ${upiId}`));
    console.log(chalk.gray(`Address: ${escrowWallet.address}`));
    console.log(chalk.gray(`Created: ${new Date(escrowWallet.createdAt).toLocaleString()}`));
    console.log();

    // Get balance from blockchain
    const spinner = ora('Fetching balance from blockchain...').start();
    try {
      // Create a temporary wallet manager for the escrow wallet
      const tempWalletManager = new WalletManager(configManager);
      await tempWalletManager.importAccount(escrowWallet.privateKey);
      const balance = await tempWalletManager.getBalance();
      spinner.succeed('Balance fetched successfully');
      
      // Display balance information
      const balanceData = [
        ['Asset', 'Balance', 'Value (USD)'],
        ['APT', `${balance.apt}`, `$${(parseFloat(balance.apt) * 10).toFixed(2)}`], // Assuming $10 per APT for demo
      ];
      
      // Add token balances if any
      for (const [tokenType, amount] of Object.entries(balance.tokens)) {
        balanceData.push([tokenType, amount, '$0.00']); // Token values would need price lookup
      }
      
      console.log(chalk.cyan('\n💰 Balance Details:'));
      console.log(table(balanceData, {
        border: {
          topBody: '─',
          topJoin: '┬',
          topLeft: '┌',
          topRight: '┐',
          bottomBody: '─',
          bottomJoin: '┴',
          bottomLeft: '└',
          bottomRight: '┘',
          bodyLeft: '│',
          bodyRight: '│',
          bodyJoin: '│',
          joinBody: '─',
          joinLeft: '├',
          joinRight: '┤',
          joinJoin: '┼'
        }
      }));
      
      // Show total value
      const totalValue = parseFloat(balance.apt) * 10; // Only APT for now, tokens would need price lookup
      console.log(chalk.green(`Total Portfolio Value: $${totalValue.toFixed(2)}`));
      
      // Show funding option for testnet/devnet
      const network = configManager.getNetwork();
      if (network !== 'mainnet' && parseFloat(balance.apt) < 1) {
        console.log(chalk.yellow('\n⚠️  Low APT balance detected'));
        console.log(chalk.gray('You can fund this wallet for testing:'));
        console.log(chalk.white(`aptos account fund-with-faucet --account ${escrowWallet.address} --amount 100000000`));
      }
      
      // Recent transactions summary
      console.log(chalk.cyan('\n📊 Quick Stats:'));
      console.log(chalk.gray(`• Network: ${network}`));
      console.log(chalk.gray(`• Last Updated: ${new Date().toLocaleString()}`));
      console.log(chalk.gray(`• Wallet Age: ${Math.floor((Date.now() - new Date(escrowWallet.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days`));
      
      // Next steps
      console.log(chalk.yellow('\n🎯 Available Actions:'));
      console.log(chalk.gray(`• View history: aptos-p2m history ${upiId}`));
      console.log(chalk.gray('• List all pairs: aptos-p2m list-pairs'));
      console.log(chalk.gray('• Export data: aptos-p2m export'));
      
    } catch (error) {
      spinner.fail('Failed to fetch balance');
      throw error;
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to check balance:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
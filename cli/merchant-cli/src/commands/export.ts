import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../config/ConfigManager';
import { WalletManager } from '../wallet/WalletManager';
import { UPIRegistryService } from '../services/UPIRegistryService';

export async function exportAction(
  configManager: ConfigManager,
  walletManager: WalletManager,
  upiRegistryService: UPIRegistryService,
  options: any
) {
  try {
    console.log(chalk.cyan('\n📤 Export Data'));
    console.log(chalk.gray('Exporting P2M merchant data\n'));

    // Check if CLI is initialized
    if (!configManager.isInitialized()) {
      console.log(chalk.red('❌ CLI not initialized. Run `aptos-p2m init` first.'));
      return;
    }

    const config = configManager.exportConfig();
    const upiIds = config.upiIds || [];
    const escrowWallets = configManager.getAllEscrowWallets();

    if (upiIds.length === 0) {
      console.log(chalk.yellow('📭 No data to export. Add UPI IDs first.'));
      console.log(chalk.gray('Add your first UPI ID: aptos-p2m add-upi <upi-id>'));
      return;
    }

    const format = options.format || 'json';
    const includePrivateKeys = options.includePrivateKeys || false;
    const includeHistory = options.includeHistory || false;
    
    console.log(chalk.cyan('📋 Export Configuration:'));
    console.log(chalk.gray(`Format: ${format.toUpperCase()}`));
    console.log(chalk.gray(`Include Private Keys: ${includePrivateKeys ? chalk.red('Yes') : chalk.green('No')}`));
    console.log(chalk.gray(`Include Transaction History: ${includeHistory ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`UPI IDs: ${upiIds.length}`));
    console.log(chalk.gray(`Escrow Wallets: ${Object.keys(escrowWallets).length}`));
    console.log();

    if (includePrivateKeys) {
      console.log(chalk.red('⚠️  WARNING: Export will include private keys!'));
      console.log(chalk.red('   Keep the exported file secure and never share it.'));
      console.log();
    }

    const spinner = ora('Preparing export data...').start();

    try {
      // Prepare base export data
      const exportData: any = {
        exportInfo: {
          version: '1.0.0',
          exportDate: new Date().toISOString(),
          network: config.network,
          contractAddress: config.contractAddress,
          includesPrivateKeys: includePrivateKeys,
          includesHistory: includeHistory
        },
        merchant: {
          totalUpiIds: upiIds.length,
          generatedWallets: Object.keys(escrowWallets).length,
          registrationDate: new Date().toISOString()
        },
        upiIds: upiIds,
        pairs: []
      };

      // Process each UPI ID
      for (const upiId of upiIds) {
        const escrowWallet = escrowWallets[upiId];
        const pairData: any = {
          upiId,
          hasEscrowWallet: !!escrowWallet
        };

        if (escrowWallet) {
          pairData.escrowWallet = {
            address: escrowWallet.address,
            publicKey: escrowWallet.publicKey,
            createdAt: escrowWallet.createdAt
          };

          // Include private key if requested
          if (includePrivateKeys) {
            pairData.escrowWallet.privateKey = escrowWallet.privateKey;
          }

          // Include transaction history if requested
          if (includeHistory) {
            spinner.text = `Fetching history for ${upiId}...`;
            try {
              const transactions = await upiRegistryService.getTransactionHistory(escrowWallet.address, 100);
              pairData.transactionHistory = {
                totalTransactions: transactions.length,
                transactions: transactions.map(tx => ({
                  timestamp: tx.timestamp,
                  type: tx.type,
                  amount: tx.amount,
                  success: tx.success,
                  hash: tx.hash
                }))
              };
            } catch (error) {
              pairData.transactionHistory = {
                error: 'Failed to fetch transaction history',
                totalTransactions: 0,
                transactions: []
              };
            }
          }
        }

        exportData.pairs.push(pairData);
      }

      spinner.succeed('Export data prepared');

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const baseFilename = `p2m-export-${timestamp}`;
      
      const fs = require('fs');
      const path = require('path');

      if (format.toLowerCase() === 'json') {
        const filename = `${baseFilename}.json`;
        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
        
        console.log(chalk.green(`\n✅ Data exported to ${filename}`));
        console.log(chalk.gray(`File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`));
        
      } else if (format.toLowerCase() === 'csv') {
        // Export as CSV (pairs only)
        const filename = `${baseFilename}.csv`;
        let csvContent = 'UPI ID,Wallet Address,Public Key,Created At,Has Wallet';
        
        if (includePrivateKeys) {
          csvContent += ',Private Key';
        }
        
        csvContent += '\n';
        
        exportData.pairs.forEach((pair: any) => {
          const wallet = pair.escrowWallet;
          let row = `${pair.upiId},${wallet?.address || 'N/A'},${wallet?.publicKey || 'N/A'},${wallet?.createdAt ? new Date(wallet.createdAt).toISOString() : 'N/A'},${pair.hasEscrowWallet}`;
          
          if (includePrivateKeys) {
            row += `,${wallet?.privateKey || 'N/A'}`;
          }
          
          csvContent += row + '\n';
        });
        
        fs.writeFileSync(filename, csvContent);
        
        console.log(chalk.green(`\n✅ Data exported to ${filename}`));
        console.log(chalk.gray(`File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`));
        
      } else {
        console.log(chalk.red('❌ Unsupported export format. Use json or csv.'));
        return;
      }

      // Show export summary
      console.log(chalk.cyan('\n📊 Export Summary:'));
      console.log(chalk.gray(`• UPI IDs exported: ${exportData.upiIds.length}`));
      console.log(chalk.gray(`• Escrow wallets: ${exportData.pairs.filter((p: any) => p.hasEscrowWallet).length}`));
      
      if (includeHistory) {
        const totalTransactions = exportData.pairs.reduce((sum: number, pair: any) => 
          sum + (pair.transactionHistory?.totalTransactions || 0), 0);
        console.log(chalk.gray(`• Total transactions: ${totalTransactions}`));
      }
      
      if (includePrivateKeys) {
        console.log(chalk.red('\n🔐 SECURITY WARNING:'));
        console.log(chalk.red('   This export contains private keys!'));
        console.log(chalk.red('   • Store the file securely'));
        console.log(chalk.red('   • Never share or upload it'));
        console.log(chalk.red('   • Delete it when no longer needed'));
      }

      // Import instructions
      console.log(chalk.yellow('\n📥 Import Instructions:'));
      console.log(chalk.gray('To import this data on another machine:'));
      console.log(chalk.gray('1. Install the P2M CLI tool'));
      console.log(chalk.gray('2. Run: aptos-p2m init'));
      console.log(chalk.gray('3. Manually restore configuration from the export file'));
      
      // Next steps
      console.log(chalk.yellow('\n🎯 Available Actions:'));
      console.log(chalk.gray('• Export with history: aptos-p2m export --include-history'));
      console.log(chalk.gray('• Export as CSV: aptos-p2m export --format csv'));
      console.log(chalk.gray('• List all pairs: aptos-p2m list-pairs'));
      console.log(chalk.gray('• Check balances: aptos-p2m balance <upi-id>'));
      
    } catch (error) {
      spinner.fail('Failed to prepare export data');
      throw error;
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to export data:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
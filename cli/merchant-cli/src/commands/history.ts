import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { ConfigManager } from '../config/ConfigManager';
import { WalletManager } from '../wallet/WalletManager';
import { UPIRegistryService, Transaction } from '../services/UPIRegistryService';

export async function historyAction(
  configManager: ConfigManager,
  walletManager: WalletManager,
  upiRegistryService: UPIRegistryService,
  upiId: string,
  options: any
) {
  try {
    console.log(chalk.cyan('\n📜 Transaction History'));
    console.log(chalk.gray(`Viewing history for UPI ID: ${upiId}\n`));

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
    console.log(chalk.gray(`Network: ${configManager.getNetwork()}`));
    console.log();

    const spinner = ora('Fetching transaction history...').start();
    
    try {
      // Get transaction history from the blockchain
      const limit = parseInt(options.limit || '10');
      const transactions = await upiRegistryService.getTransactionHistory(escrowWallet.address, limit);
      
      spinner.succeed(`Found ${transactions.length} transactions`);
      
      if (transactions.length === 0) {
        console.log(chalk.yellow('📭 No transactions found for this wallet.'));
        console.log(chalk.gray('This wallet hasn\'t been used yet or is very new.'));
        return;
      }
      
      // Filter by type if specified
      let filteredTransactions = transactions;
      if (options.type) {
        filteredTransactions = transactions.filter(tx => 
          tx.type?.toLowerCase().includes(options.type.toLowerCase())
        );
        console.log(chalk.gray(`Filtered to ${filteredTransactions.length} transactions of type '${options.type}'`));
      }
      
      // Create transaction table
      const tableData = [
        ['Date', 'Type', 'Amount', 'Status', 'Hash']
      ];
      
      filteredTransactions.forEach((tx: Transaction) => {
        const date = new Date(tx.timestamp).toLocaleDateString();
        const time = new Date(tx.timestamp).toLocaleTimeString();
        const type = tx.type || 'Transfer';
        const amount = tx.amount ? `${tx.amount} APT` : 'N/A';
        const status = tx.success ? chalk.green('✅ Success') : chalk.red('❌ Failed');
        const hash = tx.hash.substring(0, 12) + '...';
        
        tableData.push([
          `${date}\n${time}`,
          type,
          amount,
          status,
          hash
        ]);
      });
      
      console.log(chalk.cyan('\n📊 Transaction History:'));
      console.log(table(tableData, {
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
        },
        columnDefault: {
          width: 15,
          wrapWord: true
        }
      }));
      
      // Transaction summary
      const successfulTxs = filteredTransactions.filter(tx => tx.success).length;
      const failedTxs = filteredTransactions.filter(tx => !tx.success).length;
      const totalAmount = filteredTransactions
        .filter(tx => tx.amount && tx.success)
        .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
      
      console.log(chalk.cyan('\n📈 Summary:'));
      console.log(chalk.gray(`• Total Transactions: ${filteredTransactions.length}`));
      console.log(chalk.gray(`• Successful: ${chalk.green(successfulTxs)}`));
      console.log(chalk.gray(`• Failed: ${chalk.red(failedTxs)}`));
      console.log(chalk.gray(`• Total Volume: ${totalAmount.toFixed(4)} APT`));
      
      // Export option
      if (options.export) {
        const exportSpinner = ora('Exporting transaction history...').start();
        try {
          const exportData = {
            upiId,
            walletAddress: escrowWallet.address,
            network: configManager.getNetwork(),
            exportDate: new Date().toISOString(),
            transactions: filteredTransactions
          };
          
          const fs = require('fs');
          const path = require('path');
          
          if (options.export.toLowerCase() === 'json') {
            const filename = `history_${upiId.replace('@', '_')}_${Date.now()}.json`;
            fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
            exportSpinner.succeed(`History exported to ${filename}`);
          } else if (options.export.toLowerCase() === 'csv') {
            const filename = `history_${upiId.replace('@', '_')}_${Date.now()}.csv`;
            const csvHeader = 'Date,Type,Amount,Status,Hash\n';
            const csvRows = filteredTransactions.map(tx => 
              `${new Date(tx.timestamp).toISOString()},${tx.type || 'Transfer'},${tx.amount || 'N/A'},${tx.success ? 'Success' : 'Failed'},${tx.hash}`
            ).join('\n');
            fs.writeFileSync(filename, csvHeader + csvRows);
            exportSpinner.succeed(`History exported to ${filename}`);
          } else {
            exportSpinner.fail('Unsupported export format. Use json or csv.');
          }
        } catch (error) {
          exportSpinner.fail('Failed to export history');
          console.error(chalk.red('Export error:'), error);
        }
      }
      
      // Next steps
      console.log(chalk.yellow('\n🎯 Available Actions:'));
      console.log(chalk.gray(`• Check balance: aptos-p2m balance ${upiId}`));
      console.log(chalk.gray('• List all pairs: aptos-p2m list-pairs'));
      console.log(chalk.gray('• Export history: aptos-p2m history ${upiId} --export json'));
      
    } catch (error) {
      spinner.fail('Failed to fetch transaction history');
      throw error;
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to fetch transaction history:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
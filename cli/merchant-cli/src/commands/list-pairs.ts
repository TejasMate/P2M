import chalk from 'chalk';
import { table } from 'table';
import { ConfigManager } from '../config/ConfigManager';
import { WalletManager } from '../wallet/WalletManager';
import { UPIRegistryService } from '../services/UPIRegistryService';

export async function listPairsAction(
  configManager: ConfigManager,
  walletManager: WalletManager,
  upiRegistryService: UPIRegistryService,
  options: any
) {
  try {
    console.log(chalk.cyan('\n📋 UPI-Wallet Pairs'));
    console.log(chalk.gray('Listing all registered UPI IDs and their escrow wallets\n'));

    // Check if CLI is initialized
    if (!configManager.isInitialized()) {
      console.log(chalk.red('❌ CLI not initialized. Run `aptos-p2m init` first.'));
      return;
    }

    const config = configManager.exportConfig();
    const upiIds = config.upiIds || [];
    const escrowWallets = configManager.getAllEscrowWallets();

    if (upiIds.length === 0) {
      console.log(chalk.yellow('📭 No UPI IDs found in local configuration.'));
      console.log(chalk.gray('Add your first UPI ID: aptos-p2m add-upi <upi-id>'));
      return;
    }

    console.log(chalk.cyan('📊 Configuration Summary:'));
    console.log(chalk.gray(`Network: ${config.network}`));
    console.log(chalk.gray(`Contract: ${config.contractAddress}`));
    console.log(chalk.gray(`Total UPI IDs: ${upiIds.length}`));
    console.log(chalk.gray(`Escrow Wallets: ${Object.keys(escrowWallets).length}`));
    console.log();

    // Create pairs table
    const tableData = [
      ['UPI ID', 'Escrow Wallet', 'Status', 'Actions']
    ];

    for (const upiId of upiIds) {
      const escrowWallet = escrowWallets[upiId];
      let status = '';
      let actions = '';

      if (escrowWallet) {
        status = chalk.green('✅ Generated');
        actions = 'balance, history';
      } else {
        status = chalk.yellow('⚠️ No Wallet');
        actions = 'generate';
      }

      const walletAddress = escrowWallet ? 
        `${escrowWallet.address.substring(0, 8)}...${escrowWallet.address.substring(escrowWallet.address.length - 6)}` : 
        chalk.gray('Not generated');

      tableData.push([
        upiId,
        walletAddress,
        status,
        chalk.gray(actions)
      ]);
    }

    console.log(chalk.cyan('🔗 UPI-Wallet Pairs:'));
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
        width: 20,
        wrapWord: true
      },
      columns: {
        0: { width: 25 }, // UPI ID
        1: { width: 20 }, // Wallet Address
        2: { width: 15 }, // Status
        3: { width: 20 }  // Actions
      }
    }));

    // Detailed view option
    if (options.detailed) {
      console.log(chalk.cyan('\n🔍 Detailed Information:'));
      
      for (const upiId of upiIds) {
        const escrowWallet = escrowWallets[upiId];
        console.log(chalk.yellow(`\n📌 ${upiId}`));
        
        if (escrowWallet) {
          console.log(chalk.gray(`  Address: ${escrowWallet.address}`));
          console.log(chalk.gray(`  Public Key: ${escrowWallet.publicKey}`));
          console.log(chalk.gray(`  Created: ${new Date(escrowWallet.createdAt).toLocaleString()}`));
          
          // Show available commands for this UPI ID
          console.log(chalk.gray('  Available Commands:'));
          console.log(chalk.gray(`    • aptos-p2m balance ${upiId}`));
          console.log(chalk.gray(`    • aptos-p2m history ${upiId}`));
        } else {
          console.log(chalk.gray('  Status: No escrow wallet generated'));
          console.log(chalk.gray('  Available Commands:'));
          console.log(chalk.gray(`    • aptos-p2m generate ${upiId}`));
        }
      }
    }

    // Statistics
    const generatedWallets = Object.keys(escrowWallets).length;
    const pendingGeneration = upiIds.length - generatedWallets;
    
    console.log(chalk.cyan('\n📈 Statistics:'));
    console.log(chalk.gray(`• Total UPI IDs: ${upiIds.length}`));
    console.log(chalk.gray(`• Generated Wallets: ${chalk.green(generatedWallets)}`));
    console.log(chalk.gray(`• Pending Generation: ${chalk.yellow(pendingGeneration)}`));
    
    if (pendingGeneration > 0) {
      console.log(chalk.yellow('\n⚠️ Some UPI IDs don\'t have escrow wallets yet.'));
      console.log(chalk.gray('Generate wallets for:'));
      upiIds.forEach(upiId => {
        if (!escrowWallets[upiId]) {
          console.log(chalk.gray(`  • aptos-p2m generate ${upiId}`));
        }
      });
    }

    // Export option
    if (options.export) {
      try {
        const exportData = {
          network: config.network,
          contractAddress: config.contractAddress,
          exportDate: new Date().toISOString(),
          totalUpiIds: upiIds.length,
          generatedWallets: generatedWallets,
          pairs: upiIds.map(upiId => ({
            upiId,
            escrowWallet: escrowWallets[upiId] || null,
            hasWallet: !!escrowWallets[upiId]
          }))
        };
        
        const fs = require('fs');
        
        if (options.export.toLowerCase() === 'json') {
          const filename = `pairs_${Date.now()}.json`;
          fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
          console.log(chalk.green(`\n✅ Pairs exported to ${filename}`));
        } else if (options.export.toLowerCase() === 'csv') {
          const filename = `pairs_${Date.now()}.csv`;
          const csvHeader = 'UPI ID,Wallet Address,Public Key,Created At,Has Wallet\n';
          const csvRows = upiIds.map(upiId => {
            const wallet = escrowWallets[upiId];
            return `${upiId},${wallet?.address || 'N/A'},${wallet?.publicKey || 'N/A'},${wallet?.createdAt ? new Date(wallet.createdAt).toISOString() : 'N/A'},${!!wallet}`;
          }).join('\n');
          fs.writeFileSync(filename, csvHeader + csvRows);
          console.log(chalk.green(`\n✅ Pairs exported to ${filename}`));
        } else {
          console.log(chalk.red('❌ Unsupported export format. Use json or csv.'));
        }
      } catch (error) {
        console.error(chalk.red('❌ Failed to export pairs:'), error);
      }
    }

    // Next steps
    console.log(chalk.yellow('\n🎯 Available Actions:'));
    console.log(chalk.gray('• Add new UPI ID: aptos-p2m add-upi <upi-id>'));
    console.log(chalk.gray('• Generate wallet: aptos-p2m generate <upi-id>'));
    console.log(chalk.gray('• Check balance: aptos-p2m balance <upi-id>'));
    console.log(chalk.gray('• View detailed info: aptos-p2m list-pairs --detailed'));
    console.log(chalk.gray('• Export data: aptos-p2m list-pairs --export json'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to list pairs:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { ConfigManager } from '../config/ConfigManager';
import { WalletManager } from '../wallet/WalletManager';
import { UPIRegistryService } from '../services/UPIRegistryService';

export function statusCommand(
  configManager: ConfigManager, 
  walletManager: WalletManager, 
  upiRegistryService: UPIRegistryService
): Command {
  const command = new Command('status');
  
  command
    .description('Check CLI and system status')
    .option('--detailed', 'Show detailed system information')
    .option('--check-contract', 'Verify contract deployment status')
    .action(async (options) => {
      try {
        console.log(chalk.cyan('\n🔍 P2M CLI Status Check'));
        console.log(chalk.gray('=' .repeat(50)));

        // Basic CLI Status
        const isInitialized = configManager.isInitialized();
        console.log(chalk.bold('\n📋 CLI Configuration'));
        console.log(chalk.gray('Initialized:'), isInitialized ? chalk.green('✅ Yes') : chalk.red('❌ No'));
        
        if (!isInitialized) {
          console.log(chalk.yellow('\n⚠️  CLI not initialized. Run `p2m-cli init` to get started.'));
          return;
        }

        const config = configManager.exportConfig();
        console.log(chalk.gray('Network:'), chalk.white(config.network));
        console.log(chalk.gray('Config File:'), chalk.white(configManager.getConfigPath()));
        
        // Wallet Status
        console.log(chalk.bold('\n💼 Wallet Information'));
        const hasWallet = !!config.privateKey;
        console.log(chalk.gray('Wallet Configured:'), hasWallet ? chalk.green('✅ Yes') : chalk.red('❌ No'));
        
        if (hasWallet) {
          try {
            const accountInfo = await walletManager.exportAccountInfo();
            if (!accountInfo) {
              console.log(chalk.red('❌ Failed to get account information'));
              return;
            }
            console.log(chalk.gray('Address:'), chalk.white(accountInfo.address));
            console.log(chalk.gray('Public Key:'), chalk.white(accountInfo.publicKey));
            
            // Get balance
            const spinner = ora('Checking wallet balance...').start();
            try {
              const balance = await walletManager.getBalance();
              spinner.succeed(`Balance: ${balance.apt} APT`);
              
              // Balance warnings
              const balanceNum = parseFloat(balance.apt);
              if (balanceNum < 0.01) {
                console.log(chalk.red('⚠️  Low balance! You may need more APT for transactions.'));
                if (config.network !== 'mainnet') {
                  console.log(chalk.gray('💡 Fund your account: '), chalk.white('p2m-cli balance --fund'));
                }
              }
            } catch (error) {
              spinner.fail('Failed to fetch balance');
              console.log(chalk.red('❌ Balance check failed:'), error);
            }
          } catch (error) {
            console.log(chalk.red('❌ Wallet error:'), error);
          }
        }

        // Contract Status
        console.log(chalk.bold('\n📜 Smart Contract'));
        const contractAddress = config.contractAddress;
        console.log(chalk.gray('Contract Address:'), contractAddress ? chalk.white(contractAddress) : chalk.red('Not set'));
        
        if (options.checkContract && contractAddress) {
          const spinner = ora('Verifying contract deployment...').start();
          try {
            const stats = await upiRegistryService.getRegistryStats();
            spinner.succeed('Contract is deployed and accessible');
            console.log(chalk.gray('Total Merchants:'), chalk.white(stats.total_merchants));
            console.log(chalk.gray('Total UPI IDs:'), chalk.white(stats.total_upi_mappings));
          } catch (error) {
            spinner.fail('Contract verification failed');
            console.log(chalk.red('❌ Contract issue:'), error);
            console.log(chalk.yellow('💡 Make sure the contract address is correct and deployed.'));
          }
        }

        // Merchant Registration Status
        console.log(chalk.bold('\n🏪 Merchant Registration'));
        const merchantInfo = config.merchantInfo;
        const isRegistered = !!merchantInfo;
        console.log(chalk.gray('Registered:'), isRegistered ? chalk.green('✅ Yes') : chalk.red('❌ No'));
        
        if (isRegistered && merchantInfo) {
          console.log(chalk.gray('Business Name:'), chalk.white(merchantInfo.businessName));
          console.log(chalk.gray('Contact Info:'), chalk.white(merchantInfo.contactInfo));
          console.log(chalk.gray('Registration Date:'), chalk.white(new Date(merchantInfo.registrationDate).toLocaleDateString()));
          
          // Check on-chain registration
          if (contractAddress && hasWallet) {
            const spinner = ora('Verifying on-chain registration...').start();
            try {
              const accountInfo = await walletManager.exportAccountInfo();
              if (!accountInfo) {
                spinner.fail('Failed to get account information');
                return;
              }
              const onChainMerchant = await upiRegistryService.getMerchantInfo(accountInfo.address);
              if (onChainMerchant) {
                spinner.succeed('On-chain registration verified');
              } else {
                spinner.warn('Local registration found but not on-chain');
                console.log(chalk.yellow('💡 Complete registration: '), chalk.white('p2m-cli register'));
              }
            } catch (error) {
              spinner.fail('Failed to verify on-chain registration');
            }
          }
        } else {
          console.log(chalk.yellow('💡 Register as merchant: '), chalk.white('p2m-cli register'));
        }

        // UPI IDs Status
        console.log(chalk.bold('\n💳 UPI IDs'));
        const upiIds = config.upiIds || [];
        console.log(chalk.gray('Local UPI IDs:'), chalk.white(upiIds.length));
        
        if (upiIds.length > 0) {
          console.log(chalk.gray('UPI IDs:'));
          upiIds.forEach((upiId, index) => {
            console.log(chalk.gray(`  ${index + 1}.`), chalk.white(upiId));
          });
          
          // Sync status
          const lastSync = config.lastSyncTimestamp;
          if (lastSync) {
            const syncDate = new Date(lastSync);
            const timeSinceSync = Date.now() - lastSync;
            const hoursSinceSync = Math.floor(timeSinceSync / (1000 * 60 * 60));
            
            console.log(chalk.gray('Last Sync:'), chalk.white(syncDate.toLocaleString()));
            if (hoursSinceSync > 24) {
              console.log(chalk.yellow('💡 Consider syncing: '), chalk.white('p2m-cli upi sync'));
            }
          } else {
            console.log(chalk.yellow('💡 Sync with blockchain: '), chalk.white('p2m-cli upi sync'));
          }
        } else {
          console.log(chalk.yellow('💡 Add UPI ID: '), chalk.white('p2m-cli upi add <upi-id>'));
        }

        // Detailed System Information
        if (options.detailed) {
          console.log(chalk.bold('\n🔧 System Information'));
          
          const tableData = [
            [chalk.bold('Component'), chalk.bold('Status'), chalk.bold('Details')]
          ];
          
          // Node.js version
          tableData.push(['Node.js', chalk.green('✅'), process.version]);
          
          // CLI version
          try {
            const packageJson = require('../../package.json');
            tableData.push(['CLI Version', chalk.green('✅'), packageJson.version]);
          } catch {
            tableData.push(['CLI Version', chalk.yellow('⚠️'), 'Unknown']);
          }
          
          // Network connectivity
          tableData.push(['Network', chalk.green('✅'), config.network]);
          
          // Config file permissions
          try {
            const fs = require('fs');
            const configPath = configManager.getConfigPath();
            const stats = fs.statSync(configPath);
            tableData.push(['Config File', chalk.green('✅'), `${stats.size} bytes`]);
          } catch {
            tableData.push(['Config File', chalk.red('❌'), 'Not accessible']);
          }
          
          console.log('\n' + table(tableData, {
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
        }

        // Overall Status Summary
        console.log(chalk.bold('\n📊 Overall Status'));
        const statusItems = [
          { name: 'CLI Initialized', status: isInitialized },
          { name: 'Wallet Configured', status: hasWallet },
          { name: 'Contract Set', status: !!contractAddress },
          { name: 'Merchant Registered', status: isRegistered },
          { name: 'UPI IDs Added', status: upiIds.length > 0 }
        ];
        
        const completedItems = statusItems.filter(item => item.status).length;
        const totalItems = statusItems.length;
        const completionPercentage = Math.round((completedItems / totalItems) * 100);
        
        console.log(chalk.gray('Setup Progress:'), chalk.white(`${completedItems}/${totalItems} (${completionPercentage}%)`));
        
        // Progress bar
        const progressBarLength = 20;
        const filledLength = Math.round((completedItems / totalItems) * progressBarLength);
        const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);
        console.log(chalk.gray('Progress:'), chalk.green(progressBar));
        
        // Next steps
        if (completionPercentage < 100) {
          console.log(chalk.bold('\n🎯 Next Steps'));
          statusItems.forEach(item => {
            if (!item.status) {
              switch (item.name) {
                case 'CLI Initialized':
                  console.log(chalk.gray('•'), chalk.white('p2m-cli init'));
                  break;
                case 'Merchant Registered':
                  console.log(chalk.gray('•'), chalk.white('p2m-cli register'));
                  break;
                case 'UPI IDs Added':
                  console.log(chalk.gray('•'), chalk.white('p2m-cli upi add <upi-id>'));
                  break;
              }
            }
          });
        } else {
          console.log(chalk.green('\n🎉 All setup complete! Your P2M CLI is ready to use.'));
        }
        
        console.log(chalk.gray('\n' + '='.repeat(50)));
        
      } catch (error) {
        console.error(chalk.red('\n❌ Status check failed:'), error);
        process.exit(1);
      }
    });

  return command;
}
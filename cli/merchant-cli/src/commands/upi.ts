import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { ConfigManager } from '../config/ConfigManager';
import { UPIRegistryService } from '../services/UPIRegistryService';

export function upiCommand(configManager: ConfigManager, upiRegistryService: UPIRegistryService): Command {
  const command = new Command('upi');
  
  command.description('Manage UPI IDs for your merchant account');

  // Add UPI ID subcommand
  command
    .command('add <upi-id>')
    .description('Add a new UPI ID to your merchant account')
    .option('-f, --force', 'Force add even if UPI ID exists')
    .action(async (upiId, options) => {
      try {
        console.log(chalk.cyan('\n💳 Add UPI ID'));
        console.log(chalk.gray(`Adding UPI ID: ${upiId}\n`));

        // Check if CLI is initialized
        if (!configManager.isInitialized()) {
          console.log(chalk.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
          return;
        }

        // Check if merchant is registered
        if (!configManager.isMerchantRegistered()) {
          console.log(chalk.red('❌ Merchant not registered. Run `p2m-cli register` first.'));
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
              default: true,
            },
          ]);
          if (!shouldContinue) return;
        }

        // Check if UPI ID exists on blockchain
        const spinner = ora('Checking UPI ID availability...').start();
        try {
          const exists = await upiRegistryService.upiExists(upiId);
          if (exists && !options.force) {
            spinner.fail('UPI ID already registered');
            
            try {
              const ownerAddress = await upiRegistryService.getMerchantByUPI(upiId);
              const currentAddress = configManager.exportConfig().privateKey ? 
                require('@aptos-labs/ts-sdk').Account.fromPrivateKey({
                  privateKey: new (require('@aptos-labs/ts-sdk').Ed25519PrivateKey)(configManager.getPrivateKey()!)
                }).accountAddress.toString() : 'unknown';
              
              if (ownerAddress.toLowerCase() === currentAddress.toLowerCase()) {
                console.log(chalk.yellow('\n⚠️  This UPI ID is already registered to your account.'));
                configManager.addUPIId(upiId); // Update local config
                return;
              } else {
                console.log(chalk.red('\n❌ This UPI ID is registered to another merchant.'));
                console.log(chalk.gray('Owner Address:'), chalk.white(ownerAddress));
                return;
              }
            } catch (error) {
              console.log(chalk.red('\n❌ UPI ID is registered but owner details unavailable.'));
              return;
            }
          }
          spinner.succeed('UPI ID available');
        } catch (error) {
          spinner.warn('Could not check UPI ID availability, proceeding...');
        }

        // Confirm registration
        console.log(chalk.blue('\n📋 Registration Details:'));
        console.log(chalk.gray('UPI ID:'), chalk.white(upiId));
        console.log(chalk.gray('Network:'), chalk.white(configManager.getNetwork()));
        console.log(chalk.gray('Contract:'), chalk.white(upiRegistryService.getContractAddress()));

        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: 'Register this UPI ID on blockchain?',
            default: true,
          },
        ]);

        if (!confirmed) {
          console.log(chalk.yellow('\n⚠️  Registration cancelled.'));
          return;
        }

        // Register UPI ID
        const regSpinner = ora('Registering UPI ID on blockchain...').start();
        try {
          const result = await upiRegistryService.registerUPI(upiId);
          
          if (result.success) {
            regSpinner.succeed('UPI ID registered successfully!');
            
            console.log(chalk.green('\n🎉 UPI ID registered!'));
            console.log(chalk.gray('UPI ID:'), chalk.white(upiId));
            console.log(chalk.gray('Transaction Hash:'), chalk.white(result.hash));
            console.log(chalk.gray('Gas Used:'), chalk.white(result.gas_used || 'N/A'));
            console.log(chalk.gray('Explorer:'), chalk.blue(upiRegistryService.getTransactionUrl(result.hash)));
            
          } else {
            regSpinner.fail('UPI ID registration failed');
            console.log(chalk.red('\n❌ Registration failed:'));
            console.log(chalk.gray('Transaction Hash:'), chalk.white(result.hash));
            console.log(chalk.gray('VM Status:'), chalk.white(result.vm_status || 'Unknown'));
            console.log(chalk.gray('Explorer:'), chalk.blue(upiRegistryService.getTransactionUrl(result.hash)));
          }
          
        } catch (error) {
          regSpinner.fail('UPI ID registration failed');
          throw error;
        }
        
      } catch (error) {
        console.error(chalk.red('\n❌ Failed to add UPI ID:'), error);
        
        // Provide helpful error messages
        const errorMessage = (error as Error).toString().toLowerCase();
        if (errorMessage.includes('already_registered')) {
          console.log(chalk.yellow('\n💡 Tip: This UPI ID is already registered. Use --force to override.'));
        } else if (errorMessage.includes('insufficient')) {
          console.log(chalk.yellow('\n💡 Tip: You may need more APT for gas fees.'));
          console.log(chalk.gray('Check balance: '), chalk.white('p2m-cli balance'));
        }
        
        process.exit(1);
      }
    });

  // Remove UPI ID subcommand
  command
    .command('remove <upi-id>')
    .alias('rm')
    .description('Remove a UPI ID from your merchant account')
    .option('-f, --force', 'Force removal without confirmation')
    .action(async (upiId, options) => {
      try {
        console.log(chalk.cyan('\n🗑️  Remove UPI ID'));
        console.log(chalk.gray(`Removing UPI ID: ${upiId}\n`));

        // Check if CLI is initialized
        if (!configManager.isInitialized()) {
          console.log(chalk.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
          return;
        }

        // Check if UPI ID exists locally
        if (!configManager.hasUPIId(upiId)) {
          console.log(chalk.yellow('⚠️  UPI ID not found in local config.'));
        }

        // Check if UPI ID exists on blockchain
        const spinner = ora('Checking UPI ID on blockchain...').start();
        try {
          const exists = await upiRegistryService.upiExists(upiId);
          if (!exists) {
            spinner.warn('UPI ID not found on blockchain');
            console.log(chalk.yellow('\n⚠️  UPI ID not registered on blockchain.'));
            
            // Remove from local config if exists
            if (configManager.hasUPIId(upiId)) {
              configManager.removeUPIId(upiId);
              console.log(chalk.green('✅ Removed from local config.'));
            }
            return;
          }
          
          // Verify ownership
          const ownerAddress = await upiRegistryService.getMerchantByUPI(upiId);
          const currentAddress = require('@aptos-labs/ts-sdk').Account.fromPrivateKey({
            privateKey: new (require('@aptos-labs/ts-sdk').Ed25519PrivateKey)(configManager.getPrivateKey()!)
          }).accountAddress.toString();
          
          if (ownerAddress.toLowerCase() !== currentAddress.toLowerCase()) {
            spinner.fail('Not authorized to remove this UPI ID');
            console.log(chalk.red('\n❌ You are not the owner of this UPI ID.'));
            console.log(chalk.gray('Owner Address:'), chalk.white(ownerAddress));
            console.log(chalk.gray('Your Address:'), chalk.white(currentAddress));
            return;
          }
          
          spinner.succeed('UPI ID found and verified');
        } catch (error) {
          spinner.fail('Failed to verify UPI ID');
          throw error;
        }

        // Confirm removal
        if (!options.force) {
          const { confirmed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirmed',
              message: `Are you sure you want to remove UPI ID "${upiId}"?`,
              default: false,
            },
          ]);

          if (!confirmed) {
            console.log(chalk.yellow('\n⚠️  Removal cancelled.'));
            return;
          }
        }

        // Remove UPI ID
        const remSpinner = ora('Removing UPI ID from blockchain...').start();
        try {
          const result = await upiRegistryService.removeUPI(upiId);
          
          if (result.success) {
            remSpinner.succeed('UPI ID removed successfully!');
            
            console.log(chalk.green('\n🗑️  UPI ID removed!'));
            console.log(chalk.gray('UPI ID:'), chalk.white(upiId));
            console.log(chalk.gray('Transaction Hash:'), chalk.white(result.hash));
            console.log(chalk.gray('Gas Used:'), chalk.white(result.gas_used || 'N/A'));
            console.log(chalk.gray('Explorer:'), chalk.blue(upiRegistryService.getTransactionUrl(result.hash)));
            
          } else {
            remSpinner.fail('UPI ID removal failed');
            console.log(chalk.red('\n❌ Removal failed:'));
            console.log(chalk.gray('Transaction Hash:'), chalk.white(result.hash));
            console.log(chalk.gray('VM Status:'), chalk.white(result.vm_status || 'Unknown'));
          }
          
        } catch (error) {
          remSpinner.fail('UPI ID removal failed');
          throw error;
        }
        
      } catch (error) {
        console.error(chalk.red('\n❌ Failed to remove UPI ID:'), error);
        process.exit(1);
      }
    });

  // List UPI IDs subcommand
  command
    .command('list')
    .alias('ls')
    .description('List all registered UPI IDs')
    .option('-s, --sync', 'Sync with blockchain before listing')
    .option('-r, --remote', 'Show only blockchain data')
    .action(async (options) => {
      try {
        console.log(chalk.cyan('\n📋 UPI IDs List'));

        // Check if CLI is initialized
        if (!configManager.isInitialized()) {
          console.log(chalk.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
          return;
        }

        let localUPIs = configManager.getUPIIds();
        let blockchainUPIs: string[] = [];

        // Sync with blockchain if requested
        if (options.sync || options.remote) {
          const spinner = ora('Fetching UPI IDs from blockchain...').start();
          try {
            blockchainUPIs = await upiRegistryService.getMerchantUPIs();
            spinner.succeed(`Found ${blockchainUPIs.length} UPI IDs on blockchain`);
            
            if (options.sync) {
              configManager.importConfig({ upiIds: blockchainUPIs });
              localUPIs = blockchainUPIs;
              console.log(chalk.green('✅ Local config synced with blockchain'));
            }
          } catch (error) {
            spinner.fail('Failed to fetch from blockchain');
            if (options.remote) {
              throw error;
            }
            console.log(chalk.yellow('⚠️  Using local data only'));
          }
        }

        const upisToShow = options.remote ? blockchainUPIs : localUPIs;

        if (upisToShow.length === 0) {
          console.log(chalk.yellow('\n⚠️  No UPI IDs found.'));
          console.log(chalk.gray('Add a UPI ID: '), chalk.white('p2m-cli upi add <upi-id>'));
          return;
        }

        // Create table
        const tableData = [
          [chalk.bold('Index'), chalk.bold('UPI ID'), chalk.bold('Status')]
        ];

        for (let i = 0; i < upisToShow.length; i++) {
          const upiId = upisToShow[i];
          let status = 'Local';
          
          if (options.sync || options.remote) {
            status = blockchainUPIs.includes(upiId) ? chalk.green('✅ Registered') : chalk.yellow('⚠️  Local Only');
          } else if (blockchainUPIs.length > 0) {
            status = blockchainUPIs.includes(upiId) ? chalk.green('✅ Registered') : chalk.gray('Unknown');
          }
          
          tableData.push([
            (i + 1).toString(),
            upiId,
            status
          ]);
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

        console.log(chalk.gray(`\nTotal: ${upisToShow.length} UPI ID(s)`));
        
        if (!options.sync && !options.remote && localUPIs.length > 0) {
          console.log(chalk.gray('\n💡 Tip: Use --sync to verify with blockchain'));
        }
        
      } catch (error) {
        console.error(chalk.red('\n❌ Failed to list UPI IDs:'), error);
        process.exit(1);
      }
    });

  // Sync subcommand
  command
    .command('sync')
    .description('Sync local UPI IDs with blockchain')
    .action(async () => {
      try {
        console.log(chalk.cyan('\n🔄 Syncing UPI IDs'));

        // Check if CLI is initialized
        if (!configManager.isInitialized()) {
          console.log(chalk.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
          return;
        }

        const spinner = ora('Syncing with blockchain...').start();
        try {
          await upiRegistryService.syncWithBlockchain();
          spinner.succeed('Sync completed');
          
          const upiIds = configManager.getUPIIds();
          console.log(chalk.green(`\n✅ Synced ${upiIds.length} UPI ID(s) from blockchain`));
          
          if (upiIds.length > 0) {
            console.log(chalk.gray('\nSynced UPI IDs:'));
            upiIds.forEach((upiId, index) => {
              console.log(chalk.gray(`${index + 1}. `), chalk.white(upiId));
            });
          }
          
        } catch (error) {
          spinner.fail('Sync failed');
          throw error;
        }
        
      } catch (error) {
        console.error(chalk.red('\n❌ Sync failed:'), error);
        process.exit(1);
      }
    });

  return command;
}

// Utility function to validate UPI ID format
function isValidUPIId(upiId: string): boolean {
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId);
}
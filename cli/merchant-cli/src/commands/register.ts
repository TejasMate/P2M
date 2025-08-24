import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../config/ConfigManager';
import { UPIRegistryService } from '../services/UPIRegistryService';

export function registerCommand(configManager: ConfigManager, upiRegistryService: UPIRegistryService): Command {
  const command = new Command('register');
  
  command
    .description('Register as a merchant on the P2M system')
    .option('-b, --business-name <name>', 'Business name')
    .option('-c, --contact <info>', 'Contact information')
    .option('-f, --force', 'Force re-registration')
    .action(async (options) => {
      try {
        console.log(chalk.cyan('\n🏪 Merchant Registration'));
        console.log(chalk.gray('Register your business on the P2M system\n'));

        // Check if CLI is initialized
        if (!configManager.isInitialized()) {
          console.log(chalk.red('❌ CLI not initialized. Run `p2m-cli init` first.'));
          return;
        }

        // Check if already registered
        if (configManager.isMerchantRegistered() && !options.force) {
          const merchantInfo = configManager.getMerchantInfo();
          console.log(chalk.yellow('⚠️  Already registered as merchant:'));
          console.log(chalk.gray('Business Name:'), chalk.white(merchantInfo?.businessName));
          console.log(chalk.gray('Contact Info:'), chalk.white(merchantInfo?.contactInfo));
          console.log(chalk.gray('Registration Date:'), chalk.white(merchantInfo?.registrationDate));
          
          const { shouldReregister } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'shouldReregister',
              message: 'Do you want to re-register with new information?',
              default: false,
            },
          ]);

          if (!shouldReregister) {
            console.log(chalk.yellow('\n⚠️  Registration cancelled.'));
            return;
          }
        }

        // Get business information
        let businessName = options.businessName;
        let contactInfo = options.contact;

        if (!businessName || !contactInfo) {
          console.log(chalk.blue('📝 Please provide your business information:'));
          
          const responses = await inquirer.prompt([
            {
              type: 'input',
              name: 'businessName',
              message: 'Business Name:',
              default: businessName,
              validate: (input) => {
                if (!input || input.trim().length < 2) {
                  return 'Business name must be at least 2 characters long';
                }
                if (input.length > 100) {
                  return 'Business name must be less than 100 characters';
                }
                return true;
              },
            },
            {
              type: 'input',
              name: 'contactInfo',
              message: 'Contact Information (email/phone):',
              default: contactInfo,
              validate: (input) => {
                if (!input || input.trim().length < 5) {
                  return 'Contact information must be at least 5 characters long';
                }
                if (input.length > 200) {
                  return 'Contact information must be less than 200 characters';
                }
                return true;
              },
            },
          ]);

          businessName = responses.businessName.trim();
          contactInfo = responses.contactInfo.trim();
        }

        // Confirm registration details
        console.log(chalk.blue('\n📋 Registration Details:'));
        console.log(chalk.gray('Business Name:'), chalk.white(businessName));
        console.log(chalk.gray('Contact Info:'), chalk.white(contactInfo));
        console.log(chalk.gray('Network:'), chalk.white(configManager.getNetwork()));
        console.log(chalk.gray('Contract:'), chalk.white(upiRegistryService.getContractAddress()));

        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: 'Confirm merchant registration?',
            default: true,
          },
        ]);

        if (!confirmed) {
          console.log(chalk.yellow('\n⚠️  Registration cancelled.'));
          return;
        }

        // Check if merchant is already registered on blockchain
        const spinner = ora('Checking existing registration...').start();
        try {
          const existingInfo = await upiRegistryService.getMerchantInfo();
          if (existingInfo && !options.force) {
            spinner.warn('Merchant already registered on blockchain');
            console.log(chalk.yellow('\n⚠️  You are already registered on the blockchain:'));
            console.log(chalk.gray('Business Name:'), chalk.white(existingInfo.business_name));
            console.log(chalk.gray('Contact Info:'), chalk.white(existingInfo.contact_info));
            console.log(chalk.gray('Registration Date:'), chalk.white(new Date(parseInt(existingInfo.registration_timestamp) * 1000).toLocaleString()));
            console.log(chalk.gray('Status:'), existingInfo.is_active ? chalk.green('Active') : chalk.red('Inactive'));
            console.log(chalk.gray('KYC Verified:'), existingInfo.kyc_verified ? chalk.green('Yes') : chalk.yellow('No'));
            
            // Update local config with blockchain data
            configManager.setMerchantInfo(existingInfo.business_name, existingInfo.contact_info);
            return;
          }
        } catch (error) {
          // Merchant not registered yet, continue with registration
          spinner.text = 'Proceeding with new registration...';
        }

        // Perform registration transaction
        spinner.text = 'Registering merchant on blockchain...';
        try {
          const result = await upiRegistryService.registerMerchant(businessName, contactInfo);
          
          if (result.success) {
            spinner.succeed('Merchant registered successfully!');
            
            console.log(chalk.green('\n🎉 Registration completed!'));
            console.log(chalk.gray('Transaction Hash:'), chalk.white(result.hash));
            console.log(chalk.gray('Gas Used:'), chalk.white(result.gas_used || 'N/A'));
            console.log(chalk.gray('Explorer:'), chalk.blue(upiRegistryService.getTransactionUrl(result.hash)));
            
            // Sync with blockchain to get updated info
            const syncSpinner = ora('Syncing with blockchain...').start();
            try {
              await upiRegistryService.syncWithBlockchain();
              syncSpinner.succeed('Synced with blockchain');
            } catch (syncError) {
              syncSpinner.warn('Sync failed, but registration was successful');
            }
            
            console.log(chalk.cyan('\nNext steps:'));
            console.log(chalk.gray('1. Add UPI ID: '), chalk.white('p2m-cli upi add <upi-id>'));
            console.log(chalk.gray('2. Check status: '), chalk.white('p2m-cli status'));
            console.log(chalk.gray('3. View balance: '), chalk.white('p2m-cli balance'));
            
          } else {
            spinner.fail('Registration failed');
            console.log(chalk.red('\n❌ Registration failed:'));
            console.log(chalk.gray('Transaction Hash:'), chalk.white(result.hash));
            console.log(chalk.gray('VM Status:'), chalk.white(result.vm_status || 'Unknown'));
            console.log(chalk.gray('Explorer:'), chalk.blue(upiRegistryService.getTransactionUrl(result.hash)));
          }
          
        } catch (error) {
          spinner.fail('Registration failed');
          throw error;
        }
        
      } catch (error) {
        console.error(chalk.red('\n❌ Registration failed:'), error);
        
        // Provide helpful error messages
        const errorMessage = (error as Error).toString().toLowerCase();
        if (errorMessage.includes('insufficient')) {
          console.log(chalk.yellow('\n💡 Tip: You may need more APT for gas fees.'));
          console.log(chalk.gray('Run: '), chalk.white('p2m-cli balance'));
          if (configManager.getNetwork() !== 'mainnet') {
            console.log(chalk.gray('Fund account: '), chalk.white('p2m-cli init --reset'));
          }
        } else if (errorMessage.includes('already_exists')) {
          console.log(chalk.yellow('\n💡 Tip: You may already be registered. Use --force to re-register.'));
        } else if (errorMessage.includes('not_found')) {
          console.log(chalk.yellow('\n💡 Tip: Check if the contract address is correct.'));
          console.log(chalk.gray('Current contract: '), chalk.white(upiRegistryService.getContractAddress()));
        }
        
        process.exit(1);
      }
    });

  return command;
}
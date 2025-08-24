import { Aptos, AptosConfig, InputViewFunctionData, InputEntryFunctionData } from '@aptos-labs/ts-sdk';
import { ConfigManager } from '../config/ConfigManager';
import { WalletManager } from '../wallet/WalletManager';
import chalk from 'chalk';

export interface MerchantInfo {
  merchant_address: string;
  business_name: string;
  contact_info: string;
  registration_timestamp: string;
  is_active: boolean;
  kyc_verified: boolean;
}

export interface RegistryStats {
  total_merchants: number;
  total_upi_mappings: number;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  gas_used?: string;
  vm_status?: string;
}

export interface Transaction {
  hash: string;
  timestamp: string;
  type?: string;
  amount?: string;
  success: boolean;
  from?: string;
  to?: string;
}

export class UPIRegistryService {
  private configManager: ConfigManager;
  private walletManager: WalletManager;
  private aptos: Aptos;
  private contractAddress: string;

  constructor(configManager: ConfigManager, walletManager: WalletManager) {
    this.configManager = configManager;
    this.walletManager = walletManager;
    this.aptos = new Aptos(new AptosConfig({ network: configManager.getAptosNetwork() }));
    
    // Get contract address from config or use default
    this.contractAddress = configManager.getContractAddress() || configManager.getDefaultContractAddress() || '0x1';
  }

  // Contract interaction methods
  
  /**
   * Register merchant on the blockchain
   */
  async registerMerchant(businessName: string, contactInfo: string): Promise<TransactionResult> {
    const account = this.walletManager.getCurrentAccount();
    if (!account) {
      throw new Error('No wallet account initialized');
    }

    try {
      const transaction: InputEntryFunctionData = {
        function: `${this.contractAddress}::upi_registry::register_merchant`,
        functionArguments: [businessName, contactInfo],
      };

      const response = await this.aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: transaction,
      });

      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: account,
        transaction: response,
      });

      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      // Update local config
      this.configManager.setMerchantInfo(businessName, contactInfo);

      return {
        hash: committedTxn.hash,
        success: executedTransaction.success,
        gas_used: executedTransaction.gas_used,
        vm_status: executedTransaction.vm_status,
      };
    } catch (error) {
      throw new Error(`Failed to register merchant: ${error}`);
    }
  }

  /**
   * Register UPI ID for the merchant
   */
  async registerUPI(upiId: string): Promise<TransactionResult> {
    const account = this.walletManager.getCurrentAccount();
    if (!account) {
      throw new Error('No wallet account initialized');
    }

    // Validate UPI ID format
    if (!this.isValidUPIId(upiId)) {
      throw new Error('Invalid UPI ID format');
    }

    try {
      const transaction: InputEntryFunctionData = {
        function: `${this.contractAddress}::upi_registry::register_upi`,
        functionArguments: [upiId],
      };

      const response = await this.aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: transaction,
      });

      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: account,
        transaction: response,
      });

      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      // Update local config
      if (executedTransaction.success) {
        this.configManager.addUPIId(upiId);
      }

      return {
        hash: committedTxn.hash,
        success: executedTransaction.success,
        gas_used: executedTransaction.gas_used,
        vm_status: executedTransaction.vm_status,
      };
    } catch (error) {
      throw new Error(`Failed to register UPI ID: ${error}`);
    }
  }

  /**
   * Remove UPI ID
   */
  async removeUPI(upiId: string): Promise<TransactionResult> {
    const account = this.walletManager.getCurrentAccount();
    if (!account) {
      throw new Error('No wallet account initialized');
    }

    try {
      const transaction: InputEntryFunctionData = {
        function: `${this.contractAddress}::upi_registry::remove_upi`,
        functionArguments: [upiId],
      };

      const response = await this.aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: transaction,
      });

      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: account,
        transaction: response,
      });

      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      // Update local config
      if (executedTransaction.success) {
        this.configManager.removeUPIId(upiId);
      }

      return {
        hash: committedTxn.hash,
        success: executedTransaction.success,
        gas_used: executedTransaction.gas_used,
        vm_status: executedTransaction.vm_status,
      };
    } catch (error) {
      throw new Error(`Failed to remove UPI ID: ${error}`);
    }
  }

  // View functions

  /**
   * Get merchant address by UPI ID
   */
  async getMerchantByUPI(upiId: string): Promise<string> {
    try {
      const payload: InputViewFunctionData = {
        function: `${this.contractAddress}::upi_registry::get_merchant_by_upi`,
        functionArguments: [upiId],
      };

      const result = await this.aptos.view({ payload });
      return result[0] as string;
    } catch (error) {
      throw new Error(`Failed to get merchant by UPI: ${error}`);
    }
  }

  /**
   * Get all UPI IDs for a merchant
   */
  async getMerchantUPIs(merchantAddress?: string): Promise<string[]> {
    const address = merchantAddress || this.walletManager.getAddress();
    if (!address) {
      throw new Error('No merchant address provided');
    }

    try {
      const payload: InputViewFunctionData = {
        function: `${this.contractAddress}::upi_registry::get_merchant_upis`,
        functionArguments: [address],
      };

      const result = await this.aptos.view({ payload });
      return result[0] as string[];
    } catch (error) {
      throw new Error(`Failed to get merchant UPIs: ${error}`);
    }
  }

  /**
   * Get merchant information
   */
  async getMerchantInfo(merchantAddress?: string): Promise<MerchantInfo> {
    const address = merchantAddress || this.walletManager.getAddress();
    if (!address) {
      throw new Error('No merchant address provided');
    }

    try {
      const payload: InputViewFunctionData = {
        function: `${this.contractAddress}::upi_registry::get_merchant_info`,
        functionArguments: [address],
      };

      const result = await this.aptos.view({ payload });
      const info = result[0] as any;
      
      return {
        merchant_address: info.merchant_address,
        business_name: info.business_name,
        contact_info: info.contact_info,
        registration_timestamp: info.registration_timestamp,
        is_active: info.is_active,
        kyc_verified: info.kyc_verified,
      };
    } catch (error) {
      throw new Error(`Failed to get merchant info: ${error}`);
    }
  }

  /**
   * Check if UPI ID exists
   */
  async upiExists(upiId: string): Promise<boolean> {
    try {
      const payload: InputViewFunctionData = {
        function: `${this.contractAddress}::upi_registry::upi_exists`,
        functionArguments: [upiId],
      };

      const result = await this.aptos.view({ payload });
      return result[0] as boolean;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats(): Promise<RegistryStats> {
    try {
      const payload: InputViewFunctionData = {
        function: `${this.contractAddress}::upi_registry::get_registry_stats`,
        functionArguments: [],
      };

      const result = await this.aptos.view({ payload });
      return {
        total_merchants: result[0] as number,
        total_upi_mappings: result[1] as number,
      };
    } catch (error) {
      throw new Error(`Failed to get registry stats: ${error}`);
    }
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(address: string, limit: number = 10): Promise<Transaction[]> {
    try {
      const transactions = await this.aptos.getAccountTransactions({
        accountAddress: address,
        options: {
          limit: limit
        }
      });

      return transactions.map((tx: any) => ({
        hash: tx.hash,
        timestamp: new Date(parseInt(tx.timestamp) / 1000).toISOString(),
        type: tx.type || 'user_transaction',
        amount: this.extractAmountFromTransaction(tx),
        success: tx.success,
        from: tx.sender,
        to: this.extractRecipientFromTransaction(tx)
      }));
    } catch (error) {
      throw new Error(`Failed to get transaction history: ${error}`);
    }
  }

  private extractAmountFromTransaction(tx: any): string | undefined {
    try {
      if (tx.payload && tx.payload.arguments) {
        // Look for amount in transaction arguments
        const args = tx.payload.arguments;
        for (const arg of args) {
          if (typeof arg === 'string' && /^\d+$/.test(arg)) {
            const amount = parseInt(arg);
            if (amount > 1000) { // Likely an amount in Octas
              return (amount / 100000000).toString(); // Convert to APT
            }
          }
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private extractRecipientFromTransaction(tx: any): string | undefined {
    try {
      if (tx.payload && tx.payload.arguments && tx.payload.arguments.length > 0) {
        return tx.payload.arguments[0];
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Check if current account is admin
   */
  async isAdmin(address?: string): Promise<boolean> {
    const checkAddress = address || this.walletManager.getAddress();
    if (!checkAddress) {
      return false;
    }

    try {
      const payload: InputViewFunctionData = {
        function: `${this.contractAddress}::upi_registry::is_admin`,
        functionArguments: [checkAddress],
      };

      const result = await this.aptos.view({ payload });
      return result[0] as boolean;
    } catch (error) {
      return false;
    }
  }

  // Utility methods

  /**
   * Validate UPI ID format
   */
  private isValidUPIId(upiId: string): boolean {
    // Basic UPI ID validation: should contain @ and have valid format
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upiId);
  }

  /**
   * Sync local config with blockchain state
   */
  async syncWithBlockchain(): Promise<void> {
    try {
      const address = this.walletManager.getAddress();
      if (!address) {
        throw new Error('No wallet address available');
      }

      // Get UPI IDs from blockchain
      const blockchainUPIs = await this.getMerchantUPIs(address);
      
      // Update local config
      this.configManager.importConfig({ upiIds: blockchainUPIs });
      this.configManager.setLastSyncTimestamp(Date.now());
      
      console.log(chalk.green(`✅ Synced ${blockchainUPIs.length} UPI IDs from blockchain`));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Sync failed: ${error}`));
    }
  }

  /**
   * Get transaction URL for explorer
   */
  getTransactionUrl(txHash: string): string {
    const network = this.configManager.getNetwork();
    const baseUrls = {
      mainnet: 'https://explorer.aptoslabs.com/txn',
      testnet: 'https://explorer.aptoslabs.com/txn',
      devnet: 'https://explorer.aptoslabs.com/txn',
    };
    
    const baseUrl = baseUrls[network as keyof typeof baseUrls] || baseUrls.devnet;
    return `${baseUrl}/${txHash}?network=${network}`;
  }

  /**
   * Set contract address
   */
  setContractAddress(address: string): void {
    this.contractAddress = address;
    this.configManager.setContractAddress(address);
  }

  /**
   * Get current contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }
}
import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network } from '@aptos-labs/ts-sdk';
import { ConfigManager } from '../config/ConfigManager';
import chalk from 'chalk';

export interface WalletInfo {
  address: string;
  publicKey: string;
  network: string;
}

export interface Balance {
  apt: string;
  tokens: Record<string, string>;
}

export class WalletManager {
  private configManager: ConfigManager;
  private aptos: Aptos;
  private account: Account | null = null;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.aptos = new Aptos(new AptosConfig({ network: configManager.getAptosNetwork() }));
    this.initializeAccount();
  }

  private initializeAccount(): void {
    const privateKey = this.configManager.getPrivateKey();
    if (privateKey) {
      try {
        const ed25519PrivateKey = new Ed25519PrivateKey(privateKey);
        this.account = Account.fromPrivateKey({ privateKey: ed25519PrivateKey });
      } catch (error) {
        console.warn(chalk.yellow('⚠️  Invalid private key in config. Please reinitialize.'));
      }
    }
  }

  // Account creation and management
  async createNewAccount(): Promise<Account> {
    const account = Account.generate();
    this.account = account;
    this.configManager.setPrivateKey(account.privateKey.toString());
    return account;
  }

  importAccount(privateKey: string): Account {
    try {
      const ed25519PrivateKey = new Ed25519PrivateKey(privateKey);
      const account = Account.fromPrivateKey({ privateKey: ed25519PrivateKey });
      this.account = account;
      this.configManager.setPrivateKey(privateKey);
      return account;
    } catch (error) {
      throw new Error(`Invalid private key format: ${error}`);
    }
  }

  // Generate escrow wallet (separate from main account)
  async generateEscrowWallet(): Promise<Account> {
    const escrowAccount = Account.generate();
    return escrowAccount;
  }

  getCurrentAccount(): Account | null {
    return this.account;
  }

  getWalletInfo(): WalletInfo | null {
    if (!this.account) return null;
    
    return {
      address: this.account.accountAddress.toString(),
      publicKey: this.account.publicKey.toString(),
      network: this.configManager.getNetwork(),
    };
  }

  // Balance operations
  async getBalance(): Promise<Balance> {
    if (!this.account) {
      throw new Error('No account initialized');
    }

    try {
      const resources = await this.aptos.getAccountResources({
        accountAddress: this.account.accountAddress,
      });

      const balance: Balance = {
        apt: '0',
        tokens: {},
      };

      // Get APT balance
      const coinStore = resources.find(
        (resource) => resource.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );

      if (coinStore && coinStore.data) {
        const coinData = coinStore.data as any;
        balance.apt = (parseInt(coinData.coin.value) / 100000000).toString(); // Convert from Octas to APT
      }

      // Get other token balances (if any)
      const tokenStores = resources.filter(
        (resource) => resource.type.includes('0x1::coin::CoinStore') && 
                     !resource.type.includes('AptosCoin')
      );

      for (const tokenStore of tokenStores) {
        if (tokenStore.data) {
          const tokenData = tokenStore.data as any;
          const tokenType = this.extractTokenType(tokenStore.type);
          balance.tokens[tokenType] = tokenData.coin.value;
        }
      }

      return balance;
    } catch (error) {
      throw new Error(`Failed to fetch balance: ${error}`);
    }
  }

  private extractTokenType(resourceType: string): string {
    // Extract token type from resource type string
    const match = resourceType.match(/CoinStore<(.+)>/);
    return match ? match[1] : resourceType;
  }

  // Account funding (for devnet/testnet)
  async fundAccount(amount?: number): Promise<void> {
    if (!this.account) {
      throw new Error('No account initialized');
    }

    const network = this.configManager.getNetwork();
    if (network === 'mainnet') {
      throw new Error('Cannot fund account on mainnet');
    }

    try {
      await this.aptos.fundAccount({
        accountAddress: this.account.accountAddress,
        amount: amount || 100000000, // Default 1 APT in Octas
      });
    } catch (error) {
      throw new Error(`Failed to fund account: ${error}`);
    }
  }

  // Transaction utilities
  async getAccountSequenceNumber(): Promise<bigint> {
    if (!this.account) {
      throw new Error('No account initialized');
    }

    try {
      const accountData = await this.aptos.getAccountInfo({
        accountAddress: this.account.accountAddress,
      });
      return BigInt(accountData.sequence_number);
    } catch (error) {
      throw new Error(`Failed to get sequence number: ${error}`);
    }
  }

  async waitForTransaction(txnHash: string, timeoutSecs: number = 30): Promise<any> {
    try {
      const response = await this.aptos.waitForTransaction({
        transactionHash: txnHash,
        options: {
          timeoutSecs,
        },
      });
      return response;
    } catch (error) {
      throw new Error(`Transaction failed or timed out: ${error}`);
    }
  }

  // Network management
  switchNetwork(network: string): void {
    this.configManager.setNetwork(network);
    this.aptos = new Aptos(new AptosConfig({ network: this.configManager.getAptosNetwork() }));
  }

  // Account validation
  async isAccountExists(): Promise<boolean> {
    if (!this.account) return false;

    try {
      await this.aptos.getAccountInfo({
        accountAddress: this.account.accountAddress,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Utility methods
  isInitialized(): boolean {
    return this.account !== null;
  }

  getAddress(): string | null {
    return this.account ? this.account.accountAddress.toString() : null;
  }

  getPrivateKey(): string | null {
    return this.account ? (this.account as any).privateKey.toString() : null;
  }

  getPublicKey(): string | null {
    return this.account ? this.account.publicKey.toString() : null;
  }

  // Export account info for backup
  exportAccountInfo(): { privateKey: string; address: string; publicKey: string } | null {
    if (!this.account) return null;

    return {
      privateKey: (this.account as any).privateKey.toString(),
      address: this.account.accountAddress.toString(),
      publicKey: this.account.publicKey.toString(),
    };
  }

  // Format balance for display
  formatBalance(balance: Balance): string {
    let formatted = `APT: ${balance.apt}`;
    
    if (Object.keys(balance.tokens).length > 0) {
      formatted += '\nTokens:';
      for (const [token, amount] of Object.entries(balance.tokens)) {
        formatted += `\n  ${token}: ${amount}`;
      }
    }
    
    return formatted;
  }
}
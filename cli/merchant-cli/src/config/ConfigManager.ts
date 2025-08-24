import { NetworkToNetworkName, Network } from '@aptos-labs/ts-sdk';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface P2MConfig {
  network: string;
  upiIds: string[];
  privateKey?: string;
  contractAddress?: string;
  merchantInfo?: {
    businessName: string;
    contactInfo: string;
    registrationDate: string;
  };
  lastSyncTimestamp?: number;
}

export class ConfigManager {
  private configPath: string;
  private config!: P2MConfig;
  private currentNetwork: string = 'testnet';
  private escrowWallets: Record<string, any> = {};

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(os.homedir(), '.p2m-merchant-cli', 'config.json');
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const parsedConfig = JSON.parse(configData);
        this.config = parsedConfig.config || this.getDefaultConfig();
        this.escrowWallets = parsedConfig.escrowWallets || {};
        this.currentNetwork = this.config.network || 'devnet';
      } else {
        this.config = this.getDefaultConfig();
        this.escrowWallets = {};
        this.currentNetwork = this.config.network || 'devnet';
      }
    } catch (error) {
      this.config = this.getDefaultConfig();
      this.escrowWallets = {};
      this.currentNetwork = this.config.network || 'devnet';
    }
  }

  private saveConfig(): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      const configData = {
        config: this.config,
        escrowWallets: this.escrowWallets
      };
      
      fs.writeFileSync(this.configPath, JSON.stringify(configData, null, 2));
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  private getDefaultConfig(): P2MConfig {
    return {
      network: 'devnet',
      upiIds: [],
    };
  }

  // Network management
  setNetwork(network: string): void {
    if (!this.isValidNetwork(network)) {
      throw new Error(`Invalid network: ${network}. Valid networks: devnet, testnet, mainnet`);
    }
    this.currentNetwork = network;
    this.config.network = network;
    this.saveConfig();
  }

  getNetwork(): string {
    return this.config.network || 'devnet';
  }

  getAptosNetwork(): Network {
    const networkName = this.getNetwork();
    switch (networkName) {
      case 'devnet':
        return Network.DEVNET;
      case 'testnet':
        return Network.TESTNET;
      case 'mainnet':
        return Network.MAINNET;
      default:
        return Network.DEVNET;
    }
  }

  private isValidNetwork(network: string): boolean {
    return ['devnet', 'testnet', 'mainnet'].includes(network);
  }

  // Wallet management
  setPrivateKey(privateKey: string): void {
    this.config.privateKey = privateKey;
    this.saveConfig();
  }

  getPrivateKey(): string | undefined {
    return this.config.privateKey;
  }

  hasPrivateKey(): boolean {
    return !!this.getPrivateKey();
  }

  // Contract management
  setContractAddress(address: string): void {
    this.config.contractAddress = address;
    this.saveConfig();
  }

  getContractAddress(): string | undefined {
    return this.config.contractAddress;
  }

  // Merchant info management
  setMerchantInfo(businessName: string, contactInfo: string): void {
    this.config.merchantInfo = {
      businessName,
      contactInfo,
      registrationDate: new Date().toISOString(),
    };
    this.saveConfig();
  }

  getMerchantInfo(): { businessName: string; contactInfo: string; registrationDate: string } | undefined {
    return this.config.merchantInfo;
  }

  // UPI ID management
  addUPIId(upiId: string): void {
    const currentUPIs = this.getUPIIds();
    if (!currentUPIs.includes(upiId)) {
      currentUPIs.push(upiId);
      this.config.upiIds = currentUPIs;
      this.saveConfig();
    }
  }

  removeUPIId(upiId: string): void {
    const currentUPIs = this.getUPIIds();
    const filteredUPIs = currentUPIs.filter(id => id !== upiId);
    this.config.upiIds = filteredUPIs;
    this.saveConfig();
  }

  getUPIIds(): string[] {
    return this.config.upiIds || [];
  }

  hasUPIId(upiId: string): boolean {
    return this.getUPIIds().includes(upiId);
  }

  // Escrow wallet management
  setEscrowWallet(upiId: string, walletInfo: { address: string; privateKey: string; publicKey: string; createdAt: string }): void {
    this.escrowWallets[upiId] = walletInfo;
    this.saveConfig();
  }

  getEscrowWallet(upiId: string): { address: string; privateKey: string; publicKey: string; createdAt: string } | undefined {
    return this.escrowWallets[upiId];
  }

  removeEscrowWallet(upiId: string): void {
    delete this.escrowWallets[upiId];
    this.saveConfig();
  }

  getAllEscrowWallets(): Record<string, { address: string; privateKey: string; publicKey: string; createdAt: string }> {
    return this.escrowWallets;
  }

  // Sync management
  setLastSyncTimestamp(timestamp: number): void {
    this.config.lastSyncTimestamp = timestamp;
    this.saveConfig();
  }

  getLastSyncTimestamp(): number | undefined {
    return this.config.lastSyncTimestamp;
  }

  // Configuration file management
  getConfigPath(): string {
    return this.configPath;
  }

  setConfigPath(configPath: string): void {
    this.configPath = configPath;
    this.loadConfig();
  }

  // Reset configuration
  reset(): void {
    this.config = this.getDefaultConfig();
    this.escrowWallets = {};
    this.saveConfig();
  }

  // Export configuration
  exportConfig(): P2MConfig {
    return {
      network: this.getNetwork(),
      privateKey: this.getPrivateKey(),
      contractAddress: this.getContractAddress(),
      merchantInfo: this.getMerchantInfo(),
      upiIds: this.getUPIIds(),
      lastSyncTimestamp: this.getLastSyncTimestamp(),
    };
  }

  // Import configuration
  importConfig(config: Partial<P2MConfig>): void {
    if (config.network) this.setNetwork(config.network);
    if (config.privateKey) this.setPrivateKey(config.privateKey);
    if (config.contractAddress) this.setContractAddress(config.contractAddress);
    if (config.merchantInfo) {
      this.setMerchantInfo(config.merchantInfo.businessName, config.merchantInfo.contactInfo);
    }
    if (config.upiIds) {
      this.config.upiIds = config.upiIds;
      this.saveConfig();
    }
    if (config.lastSyncTimestamp) this.setLastSyncTimestamp(config.lastSyncTimestamp);
  }

  // Validation
  isInitialized(): boolean {
    return this.hasPrivateKey() && !!this.getContractAddress();
  }

  isMerchantRegistered(): boolean {
    return !!this.getMerchantInfo();
  }

  // Network-specific contract addresses
  getDefaultContractAddress(): string | undefined {
    const network = this.getNetwork();
    const defaultAddresses: Record<string, string> = {
      devnet: '0xf9d57e56266876b07459f919263caf276b07978766ace8e17b65003bd227fea5',
      testnet: '0xf9d57e56266876b07459f919263caf276b07978766ace8e17b65003bd227fea5',
      mainnet: '0x1', // Will be updated after deployment
    };
    return defaultAddresses[network];
  }

  // Utility methods
  getConfigSummary(): string {
    const config = this.exportConfig();
    return `
Configuration Summary:
- Network: ${config.network}
- Contract: ${config.contractAddress || 'Not set'}
- Merchant: ${config.merchantInfo?.businessName || 'Not registered'}
- UPI IDs: ${config.upiIds.length} registered
- Config Path: ${this.getConfigPath()}
`;
  }
}
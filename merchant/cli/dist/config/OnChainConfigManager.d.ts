import { Network, Account } from '@aptos-labs/ts-sdk';
export interface OnChainP2MConfig {
    network: string;
    privateKey?: string;
    contractAddress?: string;
    escrowKeys?: Record<string, {
        privateKey: string;
        publicKey: string;
    }>;
}
export interface MerchantOnChainData {
    merchantAddress: string;
    businessName: string;
    contactInfo: string;
    registrationTimestamp: number;
    isActive: boolean;
    kycVerified: boolean;
    phoneNumber: string;
    businessAddress: string;
    businessType: string;
    websiteUrl: string;
}
export interface MerchantPreferencesData {
    defaultUpiId: string;
    autoRegister: boolean;
    showQrCodes: boolean;
    enableNotifications: boolean;
    maxTransactionAmount: number;
    sessionTimeout: number;
    requireConfirmation: boolean;
}
export interface EscrowWalletData {
    escrowAddress: string;
    upiId: string;
    merchantAddress: string;
    creationTimestamp: number;
    isActive: boolean;
}
export declare class OnChainConfigManager {
    private configPath;
    private config;
    private aptos;
    private account?;
    constructor(configPath?: string);
    private loadConfig;
    private saveConfig;
    private getDefaultConfig;
    private fetchMerchantData;
    private fetchMerchantPreferences;
    private fetchUpiIds;
    private fetchEscrowWallets;
    setNetwork(network: string): void;
    getNetwork(): string;
    getAptosNetwork(): Network;
    private isValidNetwork;
    setPrivateKey(privateKey: string): void;
    getPrivateKey(): string | undefined;
    hasPrivateKey(): boolean;
    getAccount(): Account | undefined;
    setContractAddress(address: string): void;
    getContractAddress(): string | undefined;
    getMerchantInfo(): Promise<MerchantOnChainData | undefined>;
    getMerchantPreferences(): Promise<MerchantPreferencesData | undefined>;
    getUPIIds(): Promise<string[]>;
    hasUPIId(upiId: string): Promise<boolean>;
    getEscrowWallets(): Promise<EscrowWalletData[]>;
    getEscrowWallet(upiId: string): Promise<EscrowWalletData | undefined>;
    getConfigPath(): string;
    setConfigPath(configPath: string): void;
    reset(): void;
    exportConfig(): OnChainP2MConfig;
    importConfig(config: Partial<OnChainP2MConfig>): void;
    isInitialized(): boolean;
    isMerchantRegistered(): Promise<boolean>;
    getDefaultContractAddress(): string | undefined;
    getConfigSummary(): Promise<string>;
    registerMerchant(businessName: string, contactInfo: string, phoneNumber: string, businessAddress: string, businessType: string, websiteUrl: string): Promise<void>;
    updatePreferences(defaultUpiId: string, autoRegister: boolean, showQrCodes: boolean, enableNotifications: boolean, maxTransactionAmount: number, sessionTimeout: number, requireConfirmation: boolean): Promise<void>;
    createEscrowWallet(upiId: string, escrowAddress: string): Promise<void>;
    addUPIId(upiId: string): void;
    removeUPIId(upiId: string): void;
    setEscrowWallet(upiId: string, walletInfo: {
        address: string;
        privateKey: string;
        publicKey: string;
        createdAt: string;
    }): void;
    getAllEscrowWallets(): Record<string, {
        address: string;
        privateKey: string;
        publicKey: string;
        createdAt: string;
    }>;
    removeEscrowWallet(upiId: string): void;
}
//# sourceMappingURL=OnChainConfigManager.d.ts.map
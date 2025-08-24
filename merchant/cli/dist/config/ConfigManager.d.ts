import { Network } from '@aptos-labs/ts-sdk';
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
export declare class ConfigManager {
    private configPath;
    private config;
    private currentNetwork;
    private escrowWallets;
    constructor(configPath?: string);
    private loadConfig;
    private saveConfig;
    private getDefaultConfig;
    setNetwork(network: string): void;
    getNetwork(): string;
    getAptosNetwork(): Network;
    private isValidNetwork;
    setPrivateKey(privateKey: string): void;
    getPrivateKey(): string | undefined;
    hasPrivateKey(): boolean;
    setContractAddress(address: string): void;
    getContractAddress(): string | undefined;
    setMerchantInfo(businessName: string, contactInfo: string): void;
    getMerchantInfo(): {
        businessName: string;
        contactInfo: string;
        registrationDate: string;
    } | undefined;
    addUPIId(upiId: string): void;
    removeUPIId(upiId: string): void;
    getUPIIds(): string[];
    hasUPIId(upiId: string): boolean;
    setEscrowWallet(upiId: string, walletInfo: {
        address: string;
        privateKey: string;
        publicKey: string;
        createdAt: string;
    }): void;
    getEscrowWallet(upiId: string): {
        address: string;
        privateKey: string;
        publicKey: string;
        createdAt: string;
    } | undefined;
    removeEscrowWallet(upiId: string): void;
    getAllEscrowWallets(): Record<string, {
        address: string;
        privateKey: string;
        publicKey: string;
        createdAt: string;
    }>;
    setLastSyncTimestamp(timestamp: number): void;
    getLastSyncTimestamp(): number | undefined;
    getConfigPath(): string;
    setConfigPath(configPath: string): void;
    reset(): void;
    exportConfig(): P2MConfig;
    importConfig(config: Partial<P2MConfig>): void;
    isInitialized(): boolean;
    isMerchantRegistered(): boolean;
    getDefaultContractAddress(): string | undefined;
    getConfigSummary(): string;
}
//# sourceMappingURL=ConfigManager.d.ts.map
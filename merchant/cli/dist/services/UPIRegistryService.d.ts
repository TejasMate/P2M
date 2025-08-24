import { OnChainConfigManager } from '../config/OnChainConfigManager';
import { WalletManager } from '../wallet/WalletManager';
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
export declare class UPIRegistryService {
    private configManager;
    private walletManager;
    private aptos;
    private contractAddress;
    constructor(configManager: OnChainConfigManager, walletManager: WalletManager);
    registerMerchant(businessName: string, contactInfo: string): Promise<TransactionResult>;
    registerUPI(upiId: string): Promise<TransactionResult>;
    removeUPI(upiId: string): Promise<TransactionResult>;
    setEscrowAddress(upiId: string, escrowAddress: string): Promise<TransactionResult>;
    createEscrowWallet(upiId: string, escrowAddress: string): Promise<TransactionResult>;
    getMerchantByUPI(upiId: string): Promise<string>;
    getEscrowByUPI(upiId: string): Promise<string>;
    getMerchantUPIs(merchantAddress?: string): Promise<string[]>;
    getMerchantInfo(merchantAddress?: string): Promise<MerchantInfo>;
    upiExists(upiId: string): Promise<boolean>;
    getRegistryStats(): Promise<RegistryStats>;
    getTransactionHistory(address: string, limit?: number): Promise<Transaction[]>;
    private extractAmountFromTransaction;
    private extractRecipientFromTransaction;
    isAdmin(address?: string): Promise<boolean>;
    private isValidUPIId;
    syncWithBlockchain(): Promise<void>;
    getTransactionUrl(txHash: string): string;
    setContractAddress(address: string): void;
    getContractAddress(): string;
}
//# sourceMappingURL=UPIRegistryService.d.ts.map
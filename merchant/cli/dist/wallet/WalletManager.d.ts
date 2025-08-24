import { Account } from '@aptos-labs/ts-sdk';
import { OnChainConfigManager } from '../config/OnChainConfigManager';
export interface WalletInfo {
    address: string;
    publicKey: string;
    network: string;
}
export interface Balance {
    apt: string;
    tokens: Record<string, string>;
}
export declare class WalletManager {
    private configManager;
    private aptos;
    private account;
    constructor(configManager: OnChainConfigManager);
    private initializeAccount;
    createNewAccount(): Promise<Account>;
    importAccount(privateKey: string): Account;
    generateEscrowWallet(upiId: string): Promise<Account>;
    getCurrentAccount(): Account | null;
    getWalletInfo(): WalletInfo | null;
    getBalance(): Promise<Balance>;
    private extractTokenType;
    fundAccount(amount?: number): Promise<void>;
    getAccountSequenceNumber(): Promise<bigint>;
    waitForTransaction(txnHash: string, timeoutSecs?: number): Promise<any>;
    switchNetwork(network: string): void;
    isAccountExists(): Promise<boolean>;
    isInitialized(): boolean;
    getAddress(): string | null;
    getPrivateKey(): string | null;
    getPublicKey(): string | null;
    exportAccountInfo(): {
        privateKey: string;
        address: string;
        publicKey: string;
    } | null;
    formatBalance(balance: Balance): string;
}
//# sourceMappingURL=WalletManager.d.ts.map
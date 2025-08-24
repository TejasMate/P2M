"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPIRegistryService = void 0;
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const chalk_1 = __importDefault(require("chalk"));
class UPIRegistryService {
    constructor(configManager, walletManager) {
        this.configManager = configManager;
        this.walletManager = walletManager;
        this.aptos = new ts_sdk_1.Aptos(new ts_sdk_1.AptosConfig({ network: configManager.getAptosNetwork() }));
        this.contractAddress = configManager.getContractAddress() || configManager.getDefaultContractAddress() || '0x1';
    }
    async registerMerchant(businessName, contactInfo) {
        const account = this.walletManager.getCurrentAccount();
        if (!account) {
            throw new Error('No wallet account initialized');
        }
        try {
            const transaction = {
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
            return {
                hash: committedTxn.hash,
                success: executedTransaction.success,
                gas_used: executedTransaction.gas_used,
                vm_status: executedTransaction.vm_status,
            };
        }
        catch (error) {
            throw new Error(`Failed to register merchant: ${error}`);
        }
    }
    async registerUPI(upiId) {
        const account = this.walletManager.getCurrentAccount();
        if (!account) {
            throw new Error('No wallet account initialized');
        }
        if (!this.isValidUPIId(upiId)) {
            throw new Error('Invalid UPI ID format');
        }
        try {
            const transaction = {
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
            if (executedTransaction.success) {
                this.configManager.addUPIId(upiId);
            }
            return {
                hash: committedTxn.hash,
                success: executedTransaction.success,
                gas_used: executedTransaction.gas_used,
                vm_status: executedTransaction.vm_status,
            };
        }
        catch (error) {
            throw new Error(`Failed to register UPI ID: ${error}`);
        }
    }
    async removeUPI(upiId) {
        const account = this.walletManager.getCurrentAccount();
        if (!account) {
            throw new Error('No wallet account initialized');
        }
        try {
            const transaction = {
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
            if (executedTransaction.success) {
                this.configManager.removeUPIId(upiId);
            }
            return {
                hash: committedTxn.hash,
                success: executedTransaction.success,
                gas_used: executedTransaction.gas_used,
                vm_status: executedTransaction.vm_status,
            };
        }
        catch (error) {
            throw new Error(`Failed to remove UPI ID: ${error}`);
        }
    }
    async setEscrowAddress(upiId, escrowAddress) {
        const account = this.walletManager.getCurrentAccount();
        if (!account) {
            throw new Error('No wallet account initialized');
        }
        try {
            const transaction = {
                function: `${this.contractAddress}::upi_registry::set_escrow_address`,
                functionArguments: [upiId, escrowAddress],
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
            return {
                hash: committedTxn.hash,
                success: executedTransaction.success,
                gas_used: executedTransaction.gas_used,
                vm_status: executedTransaction.vm_status,
            };
        }
        catch (error) {
            throw new Error(`Failed to set escrow address: ${error}`);
        }
    }
    async createEscrowWallet(upiId, escrowAddress) {
        const account = this.walletManager.getCurrentAccount();
        if (!account) {
            throw new Error('No wallet account initialized');
        }
        try {
            const transaction = {
                function: `${this.contractAddress}::upi_registry::create_escrow_wallet`,
                functionArguments: [upiId, escrowAddress],
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
            return {
                hash: committedTxn.hash,
                success: executedTransaction.success,
                gas_used: executedTransaction.gas_used,
                vm_status: executedTransaction.vm_status,
            };
        }
        catch (error) {
            throw new Error(`Failed to create escrow wallet: ${error}`);
        }
    }
    async getMerchantByUPI(upiId) {
        try {
            const payload = {
                function: `${this.contractAddress}::upi_registry::get_merchant_by_upi`,
                functionArguments: [upiId],
            };
            const result = await this.aptos.view({ payload });
            return result[0];
        }
        catch (error) {
            throw new Error(`Failed to get merchant by UPI: ${error}`);
        }
    }
    async getEscrowByUPI(upiId) {
        try {
            const payload = {
                function: `${this.contractAddress}::upi_registry::get_escrow_by_upi`,
                functionArguments: [upiId],
            };
            const result = await this.aptos.view({ payload });
            return result[0];
        }
        catch (error) {
            throw new Error(`Failed to get escrow by UPI: ${error}`);
        }
    }
    async getMerchantUPIs(merchantAddress) {
        const address = merchantAddress || this.walletManager.getAddress();
        if (!address) {
            throw new Error('No merchant address provided');
        }
        try {
            const payload = {
                function: `${this.contractAddress}::upi_registry::get_merchant_upis`,
                functionArguments: [address],
            };
            const result = await this.aptos.view({ payload });
            return result[0];
        }
        catch (error) {
            throw new Error(`Failed to get merchant UPIs: ${error}`);
        }
    }
    async getMerchantInfo(merchantAddress) {
        const address = merchantAddress || this.walletManager.getAddress();
        if (!address) {
            throw new Error('No merchant address provided');
        }
        try {
            const payload = {
                function: `${this.contractAddress}::upi_registry::get_merchant_info`,
                functionArguments: [address],
            };
            const result = await this.aptos.view({ payload });
            const info = result[0];
            return {
                merchant_address: info.merchant_address,
                business_name: info.business_name,
                contact_info: info.contact_info,
                registration_timestamp: info.registration_timestamp,
                is_active: info.is_active,
                kyc_verified: info.kyc_verified,
            };
        }
        catch (error) {
            throw new Error(`Failed to get merchant info: ${error}`);
        }
    }
    async upiExists(upiId) {
        try {
            const payload = {
                function: `${this.contractAddress}::upi_registry::upi_exists`,
                functionArguments: [upiId],
            };
            const result = await this.aptos.view({ payload });
            return result[0];
        }
        catch (error) {
            return false;
        }
    }
    async getRegistryStats() {
        try {
            const payload = {
                function: `${this.contractAddress}::upi_registry::get_registry_stats`,
                functionArguments: [],
            };
            const result = await this.aptos.view({ payload });
            return {
                total_merchants: result[0],
                total_upi_mappings: result[1],
            };
        }
        catch (error) {
            throw new Error(`Failed to get registry stats: ${error}`);
        }
    }
    async getTransactionHistory(address, limit = 10) {
        try {
            const transactions = await this.aptos.getAccountTransactions({
                accountAddress: address,
                options: {
                    limit: limit
                }
            });
            return transactions.map((tx) => ({
                hash: tx.hash,
                timestamp: new Date(parseInt(tx.timestamp) / 1000).toISOString(),
                type: tx.type || 'user_transaction',
                amount: this.extractAmountFromTransaction(tx),
                success: tx.success,
                from: tx.sender,
                to: this.extractRecipientFromTransaction(tx)
            }));
        }
        catch (error) {
            throw new Error(`Failed to get transaction history: ${error}`);
        }
    }
    extractAmountFromTransaction(tx) {
        try {
            if (tx.payload && tx.payload.arguments) {
                const args = tx.payload.arguments;
                for (const arg of args) {
                    if (typeof arg === 'string' && /^\d+$/.test(arg)) {
                        const amount = parseInt(arg);
                        if (amount > 1000) {
                            return (amount / 100000000).toString();
                        }
                    }
                }
            }
            return undefined;
        }
        catch {
            return undefined;
        }
    }
    extractRecipientFromTransaction(tx) {
        try {
            if (tx.payload && tx.payload.arguments && tx.payload.arguments.length > 0) {
                return tx.payload.arguments[0];
            }
            return undefined;
        }
        catch {
            return undefined;
        }
    }
    async isAdmin(address) {
        const checkAddress = address || this.walletManager.getAddress();
        if (!checkAddress) {
            return false;
        }
        try {
            const payload = {
                function: `${this.contractAddress}::upi_registry::is_admin`,
                functionArguments: [checkAddress],
            };
            const result = await this.aptos.view({ payload });
            return result[0];
        }
        catch (error) {
            return false;
        }
    }
    isValidUPIId(upiId) {
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
        return upiRegex.test(upiId);
    }
    async syncWithBlockchain() {
        try {
            const address = this.walletManager.getAddress();
            if (!address) {
                throw new Error('No wallet address available');
            }
            const blockchainUPIs = await this.getMerchantUPIs(address);
            console.log(chalk_1.default.green(`✅ Found ${blockchainUPIs.length} UPI IDs on blockchain`));
        }
        catch (error) {
            console.warn(chalk_1.default.yellow(`⚠️  Sync failed: ${error}`));
        }
    }
    getTransactionUrl(txHash) {
        const network = this.configManager.getNetwork();
        const baseUrls = {
            mainnet: 'https://explorer.aptoslabs.com/txn',
            testnet: 'https://explorer.aptoslabs.com/txn',
            devnet: 'https://explorer.aptoslabs.com/txn',
        };
        const baseUrl = baseUrls[network] || baseUrls.devnet;
        return `${baseUrl}/${txHash}?network=${network}`;
    }
    setContractAddress(address) {
        this.contractAddress = address;
        this.configManager.setContractAddress(address);
    }
    getContractAddress() {
        return this.contractAddress;
    }
}
exports.UPIRegistryService = UPIRegistryService;
//# sourceMappingURL=UPIRegistryService.js.map
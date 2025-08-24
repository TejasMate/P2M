"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnChainConfigManager = void 0;
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
class OnChainConfigManager {
    constructor(configPath) {
        this.configPath = configPath || path_1.default.join(os_1.default.homedir(), '.p2m-merchant-cli', 'config.json');
        this.loadConfig();
        this.aptos = new ts_sdk_1.Aptos(new ts_sdk_1.AptosConfig({ network: this.getAptosNetwork() }));
        if (this.config.privateKey) {
            this.account = ts_sdk_1.Account.fromPrivateKey({ privateKey: new ts_sdk_1.Ed25519PrivateKey(this.config.privateKey) });
        }
    }
    loadConfig() {
        try {
            if (fs_1.default.existsSync(this.configPath)) {
                const configData = fs_1.default.readFileSync(this.configPath, 'utf8');
                const parsedConfig = JSON.parse(configData);
                this.config = parsedConfig.config || this.getDefaultConfig();
            }
            else {
                this.config = this.getDefaultConfig();
            }
        }
        catch (error) {
            this.config = this.getDefaultConfig();
        }
    }
    saveConfig() {
        try {
            const configDir = path_1.default.dirname(this.configPath);
            if (!fs_1.default.existsSync(configDir)) {
                fs_1.default.mkdirSync(configDir, { recursive: true });
            }
            const configData = {
                config: this.config
            };
            fs_1.default.writeFileSync(this.configPath, JSON.stringify(configData, null, 2));
        }
        catch (error) {
            throw new Error(`Failed to save config: ${error}`);
        }
    }
    getDefaultConfig() {
        return {
            network: 'devnet',
        };
    }
    async fetchMerchantData() {
        if (!this.account || !this.config.contractAddress)
            return undefined;
        try {
            const response = await this.aptos.view({
                payload: {
                    function: `${this.config.contractAddress}::upi_registry::get_merchant_info`,
                    functionArguments: [this.account.accountAddress]
                }
            });
            if (response && response[0]) {
                const data = response[0];
                return {
                    merchantAddress: data.merchant_address,
                    businessName: data.business_name,
                    contactInfo: data.contact_info,
                    registrationTimestamp: parseInt(data.registration_timestamp),
                    isActive: data.is_active,
                    kycVerified: data.kyc_verified,
                    phoneNumber: data.phone_number,
                    businessAddress: data.business_address,
                    businessType: data.business_type,
                    websiteUrl: data.website_url
                };
            }
        }
        catch (error) {
            console.warn('Failed to fetch merchant data:', error);
        }
        return undefined;
    }
    async fetchMerchantPreferences() {
        if (!this.account || !this.config.contractAddress)
            return undefined;
        try {
            const response = await this.aptos.view({
                payload: {
                    function: `${this.config.contractAddress}::upi_registry::get_merchant_preferences`,
                    functionArguments: [this.account.accountAddress]
                }
            });
            if (response && response[0]) {
                const data = response[0];
                return {
                    defaultUpiId: data.default_upi_id,
                    autoRegister: data.auto_register,
                    showQrCodes: data.show_qr_codes,
                    enableNotifications: data.enable_notifications,
                    maxTransactionAmount: parseInt(data.max_transaction_amount),
                    sessionTimeout: parseInt(data.session_timeout),
                    requireConfirmation: data.require_confirmation
                };
            }
        }
        catch (error) {
        }
        return undefined;
    }
    async fetchUpiIds() {
        if (!this.account || !this.config.contractAddress)
            return [];
        try {
            const response = await this.aptos.view({
                payload: {
                    function: `${this.config.contractAddress}::upi_registry::get_merchant_upis`,
                    functionArguments: [this.account.accountAddress]
                }
            });
            if (response && response[0]) {
                return response[0];
            }
        }
        catch (error) {
        }
        return [];
    }
    async fetchEscrowWallets() {
        if (!this.account || !this.config.contractAddress)
            return [];
        try {
            const escrowAddresses = await this.aptos.view({
                payload: {
                    function: `${this.config.contractAddress}::upi_registry::get_merchant_escrows`,
                    functionArguments: [this.account.accountAddress]
                }
            });
            console.log('DEBUG: Escrow addresses from blockchain:', escrowAddresses);
            const escrowWallets = [];
            if (escrowAddresses && escrowAddresses[0]) {
                const addresses = escrowAddresses[0];
                console.log('DEBUG: Processing addresses:', addresses);
                for (const escrowAddress of addresses) {
                    try {
                        const walletInfo = await this.aptos.view({
                            payload: {
                                function: `${this.config.contractAddress}::upi_registry::get_escrow_wallet_info`,
                                functionArguments: [escrowAddress]
                            }
                        });
                        console.log('DEBUG: Wallet info for', escrowAddress, ':', walletInfo);
                        if (walletInfo && walletInfo[0]) {
                            const info = walletInfo[0];
                            const walletData = {
                                escrowAddress: info.wallet_address,
                                upiId: info.upi_id,
                                merchantAddress: info.merchant_address,
                                creationTimestamp: parseInt(info.created_timestamp) * 1000,
                                isActive: info.is_active
                            };
                            console.log('DEBUG: Adding wallet data:', walletData);
                            escrowWallets.push(walletData);
                        }
                    }
                    catch (error) {
                        console.warn(`Failed to fetch wallet info for ${escrowAddress}:`, error);
                    }
                }
            }
            return escrowWallets;
        }
        catch (error) {
            console.warn('Failed to fetch escrow wallets:', error);
        }
        return [];
    }
    setNetwork(network) {
        if (!this.isValidNetwork(network)) {
            throw new Error(`Invalid network: ${network}. Valid networks: devnet, testnet, mainnet`);
        }
        this.config.network = network;
        this.aptos = new ts_sdk_1.Aptos(new ts_sdk_1.AptosConfig({ network: this.getAptosNetwork() }));
        this.saveConfig();
    }
    getNetwork() {
        return this.config.network || 'devnet';
    }
    getAptosNetwork() {
        const networkName = this.getNetwork();
        switch (networkName) {
            case 'devnet':
                return ts_sdk_1.Network.DEVNET;
            case 'testnet':
                return ts_sdk_1.Network.TESTNET;
            case 'mainnet':
                return ts_sdk_1.Network.MAINNET;
            default:
                return ts_sdk_1.Network.DEVNET;
        }
    }
    isValidNetwork(network) {
        return ['devnet', 'testnet', 'mainnet'].includes(network);
    }
    setPrivateKey(privateKey) {
        this.config.privateKey = privateKey;
        this.account = ts_sdk_1.Account.fromPrivateKey({ privateKey: new ts_sdk_1.Ed25519PrivateKey(privateKey) });
        this.saveConfig();
    }
    getPrivateKey() {
        return this.config.privateKey;
    }
    hasPrivateKey() {
        return !!this.getPrivateKey();
    }
    getAccount() {
        return this.account;
    }
    setContractAddress(address) {
        this.config.contractAddress = address;
        this.saveConfig();
    }
    getContractAddress() {
        return this.config.contractAddress;
    }
    async getMerchantInfo() {
        return await this.fetchMerchantData();
    }
    async getMerchantPreferences() {
        return await this.fetchMerchantPreferences();
    }
    async getUPIIds() {
        return await this.fetchUpiIds();
    }
    async hasUPIId(upiId) {
        const upiIds = await this.getUPIIds();
        return upiIds.includes(upiId);
    }
    async getEscrowWallets() {
        return await this.fetchEscrowWallets();
    }
    async getEscrowWallet(upiId) {
        const escrowWallets = await this.getEscrowWallets();
        return escrowWallets.find(wallet => wallet.upiId === upiId);
    }
    getConfigPath() {
        return this.configPath;
    }
    setConfigPath(configPath) {
        this.configPath = configPath;
        this.loadConfig();
    }
    reset() {
        this.config = this.getDefaultConfig();
        this.saveConfig();
    }
    exportConfig() {
        return {
            network: this.getNetwork(),
            privateKey: this.getPrivateKey(),
            contractAddress: this.getContractAddress(),
        };
    }
    importConfig(config) {
        if (config.network)
            this.setNetwork(config.network);
        if (config.privateKey)
            this.setPrivateKey(config.privateKey);
        if (config.contractAddress)
            this.setContractAddress(config.contractAddress);
    }
    isInitialized() {
        return this.hasPrivateKey() && !!this.getContractAddress();
    }
    async isMerchantRegistered() {
        const merchantInfo = await this.getMerchantInfo();
        return !!merchantInfo;
    }
    getDefaultContractAddress() {
        const network = this.getNetwork();
        const defaultAddresses = {
            devnet: process.env.CONTRACT_ADDRESS || '',
            testnet: process.env.CONTRACT_ADDRESS || '',
            mainnet: '0x1',
        };
        return defaultAddresses[network];
    }
    async getConfigSummary() {
        const config = this.exportConfig();
        const merchantInfo = await this.getMerchantInfo();
        const upiIds = await this.getUPIIds();
        const escrowWallets = await this.getEscrowWallets();
        return `
On-Chain Configuration Summary:
- Network: ${config.network}
- Contract: ${config.contractAddress || 'Not set'}
- Merchant: ${merchantInfo?.businessName || 'Not registered'}
- UPI IDs: ${upiIds.length} registered (on-chain)
- Escrow Wallets: ${escrowWallets.length} active (on-chain)
- Config Path: ${this.getConfigPath()}
- Data Source: Direct blockchain access (no caching)
`;
    }
    async registerMerchant(businessName, contactInfo, phoneNumber, businessAddress, businessType, websiteUrl) {
        if (!this.account || !this.config.contractAddress) {
            throw new Error('Account or contract address not configured');
        }
        const transaction = await this.aptos.transaction.build.simple({
            sender: this.account.accountAddress,
            data: {
                function: `${this.config.contractAddress}::upi_registry::register_merchant`,
                functionArguments: [businessName, contactInfo, phoneNumber, businessAddress, businessType, websiteUrl]
            }
        });
        const response = await this.aptos.signAndSubmitTransaction({
            signer: this.account,
            transaction
        });
        await this.aptos.waitForTransaction({ transactionHash: response.hash });
    }
    async updatePreferences(defaultUpiId, autoRegister, showQrCodes, enableNotifications, maxTransactionAmount, sessionTimeout, requireConfirmation) {
        if (!this.account || !this.config.contractAddress) {
            throw new Error('Account or contract address not configured');
        }
        const transaction = await this.aptos.transaction.build.simple({
            sender: this.account.accountAddress,
            data: {
                function: `${this.config.contractAddress}::upi_registry::update_merchant_preferences`,
                functionArguments: [
                    defaultUpiId,
                    autoRegister,
                    showQrCodes,
                    enableNotifications,
                    maxTransactionAmount.toString(),
                    sessionTimeout.toString(),
                    requireConfirmation
                ]
            }
        });
        const response = await this.aptos.signAndSubmitTransaction({
            signer: this.account,
            transaction
        });
        await this.aptos.waitForTransaction({ transactionHash: response.hash });
    }
    async createEscrowWallet(upiId, escrowAddress) {
        if (!this.account || !this.config.contractAddress) {
            throw new Error('Account or contract address not configured');
        }
        const transaction = await this.aptos.transaction.build.simple({
            sender: this.account.accountAddress,
            data: {
                function: `${this.config.contractAddress}::upi_registry::create_escrow_wallet`,
                functionArguments: [upiId, escrowAddress]
            }
        });
        const response = await this.aptos.signAndSubmitTransaction({
            signer: this.account,
            transaction
        });
        await this.aptos.waitForTransaction({ transactionHash: response.hash });
    }
    addUPIId(upiId) {
        console.warn('addUPIId is deprecated. UPI IDs are managed on-chain.');
    }
    removeUPIId(upiId) {
        console.warn('removeUPIId is deprecated. UPI IDs are managed on-chain.');
    }
    setEscrowWallet(upiId, walletInfo) {
        if (walletInfo.privateKey) {
            const escrowKeys = this.config.escrowKeys || {};
            escrowKeys[upiId] = {
                privateKey: walletInfo.privateKey,
                publicKey: walletInfo.publicKey
            };
            this.config.escrowKeys = escrowKeys;
            this.saveConfig();
        }
        console.warn('setEscrowWallet partially deprecated. Only private keys stored locally, other data is on-chain.');
    }
    getAllEscrowWallets() {
        console.warn('getAllEscrowWallets is deprecated. Use async getEscrowWallets() for on-chain data.');
        return {};
    }
    removeEscrowWallet(upiId) {
        if (this.config.escrowKeys && this.config.escrowKeys[upiId]) {
            delete this.config.escrowKeys[upiId];
            this.saveConfig();
        }
        console.warn('removeEscrowWallet partially deprecated. Only removes local private keys, on-chain data managed via blockchain.');
    }
}
exports.OnChainConfigManager = OnChainConfigManager;
//# sourceMappingURL=OnChainConfigManager.js.map
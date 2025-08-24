"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
class ConfigManager {
    constructor(configPath) {
        this.currentNetwork = 'testnet';
        this.escrowWallets = {};
        this.configPath = configPath || path_1.default.join(os_1.default.homedir(), '.p2m-merchant-cli', 'config.json');
        this.loadConfig();
    }
    loadConfig() {
        try {
            if (fs_1.default.existsSync(this.configPath)) {
                const configData = fs_1.default.readFileSync(this.configPath, 'utf8');
                const parsedConfig = JSON.parse(configData);
                this.config = parsedConfig.config || this.getDefaultConfig();
                this.escrowWallets = parsedConfig.escrowWallets || {};
                this.currentNetwork = this.config.network || 'devnet';
            }
            else {
                this.config = this.getDefaultConfig();
                this.escrowWallets = {};
                this.currentNetwork = this.config.network || 'devnet';
            }
        }
        catch (error) {
            this.config = this.getDefaultConfig();
            this.escrowWallets = {};
            this.currentNetwork = this.config.network || 'devnet';
        }
    }
    saveConfig() {
        try {
            const configDir = path_1.default.dirname(this.configPath);
            if (!fs_1.default.existsSync(configDir)) {
                fs_1.default.mkdirSync(configDir, { recursive: true });
            }
            const configData = {
                config: this.config,
                escrowWallets: this.escrowWallets
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
            upiIds: [],
        };
    }
    setNetwork(network) {
        if (!this.isValidNetwork(network)) {
            throw new Error(`Invalid network: ${network}. Valid networks: devnet, testnet, mainnet`);
        }
        this.currentNetwork = network;
        this.config.network = network;
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
        this.saveConfig();
    }
    getPrivateKey() {
        return this.config.privateKey;
    }
    hasPrivateKey() {
        return !!this.getPrivateKey();
    }
    setContractAddress(address) {
        this.config.contractAddress = address;
        this.saveConfig();
    }
    getContractAddress() {
        return this.config.contractAddress;
    }
    setMerchantInfo(businessName, contactInfo) {
        this.config.merchantInfo = {
            businessName,
            contactInfo,
            registrationDate: new Date().toISOString(),
        };
        this.saveConfig();
    }
    getMerchantInfo() {
        return this.config.merchantInfo;
    }
    addUPIId(upiId) {
        const currentUPIs = this.getUPIIds();
        if (!currentUPIs.includes(upiId)) {
            currentUPIs.push(upiId);
            this.config.upiIds = currentUPIs;
            this.saveConfig();
        }
    }
    removeUPIId(upiId) {
        const currentUPIs = this.getUPIIds();
        const filteredUPIs = currentUPIs.filter(id => id !== upiId);
        this.config.upiIds = filteredUPIs;
        this.saveConfig();
    }
    getUPIIds() {
        return this.config.upiIds || [];
    }
    hasUPIId(upiId) {
        return this.getUPIIds().includes(upiId);
    }
    setEscrowWallet(upiId, walletInfo) {
        this.escrowWallets[upiId] = walletInfo;
        this.saveConfig();
    }
    getEscrowWallet(upiId) {
        return this.escrowWallets[upiId];
    }
    removeEscrowWallet(upiId) {
        delete this.escrowWallets[upiId];
        this.saveConfig();
    }
    getAllEscrowWallets() {
        return this.escrowWallets;
    }
    setLastSyncTimestamp(timestamp) {
        this.config.lastSyncTimestamp = timestamp;
        this.saveConfig();
    }
    getLastSyncTimestamp() {
        return this.config.lastSyncTimestamp;
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
        this.escrowWallets = {};
        this.saveConfig();
    }
    exportConfig() {
        return {
            network: this.getNetwork(),
            privateKey: this.getPrivateKey(),
            contractAddress: this.getContractAddress(),
            merchantInfo: this.getMerchantInfo(),
            upiIds: this.getUPIIds(),
            lastSyncTimestamp: this.getLastSyncTimestamp(),
        };
    }
    importConfig(config) {
        if (config.network)
            this.setNetwork(config.network);
        if (config.privateKey)
            this.setPrivateKey(config.privateKey);
        if (config.contractAddress)
            this.setContractAddress(config.contractAddress);
        if (config.merchantInfo) {
            this.setMerchantInfo(config.merchantInfo.businessName, config.merchantInfo.contactInfo);
        }
        if (config.upiIds) {
            this.config.upiIds = config.upiIds;
            this.saveConfig();
        }
        if (config.lastSyncTimestamp)
            this.setLastSyncTimestamp(config.lastSyncTimestamp);
    }
    isInitialized() {
        return this.hasPrivateKey() && !!this.getContractAddress();
    }
    isMerchantRegistered() {
        return !!this.getMerchantInfo();
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
    getConfigSummary() {
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
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map
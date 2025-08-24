"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletManager = void 0;
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const chalk_1 = __importDefault(require("chalk"));
class WalletManager {
    constructor(configManager) {
        this.account = null;
        this.configManager = configManager;
        this.aptos = new ts_sdk_1.Aptos(new ts_sdk_1.AptosConfig({ network: configManager.getAptosNetwork() }));
        this.initializeAccount();
    }
    initializeAccount() {
        const privateKey = this.configManager.getPrivateKey();
        if (privateKey) {
            try {
                const ed25519PrivateKey = new ts_sdk_1.Ed25519PrivateKey(privateKey);
                this.account = ts_sdk_1.Account.fromPrivateKey({ privateKey: ed25519PrivateKey });
            }
            catch (error) {
                console.warn(chalk_1.default.yellow('⚠️  Invalid private key in config. Please reinitialize.'));
            }
        }
    }
    async createNewAccount() {
        const account = ts_sdk_1.Account.generate();
        this.account = account;
        this.configManager.setPrivateKey(account.privateKey.toString());
        return account;
    }
    importAccount(privateKey) {
        try {
            const ed25519PrivateKey = new ts_sdk_1.Ed25519PrivateKey(privateKey);
            const account = ts_sdk_1.Account.fromPrivateKey({ privateKey: ed25519PrivateKey });
            this.account = account;
            this.configManager.setPrivateKey(privateKey);
            return account;
        }
        catch (error) {
            throw new Error(`Invalid private key format: ${error}`);
        }
    }
    async generateEscrowWallet(upiId) {
        const escrowAccount = ts_sdk_1.Account.generate();
        try {
            await this.configManager.createEscrowWallet(upiId, escrowAccount.accountAddress.toString());
            console.log(chalk_1.default.green(`✅ Escrow wallet registered on-chain for UPI ID: ${upiId}`));
        }
        catch (error) {
            console.warn(chalk_1.default.yellow(`⚠️  Failed to register escrow wallet on-chain: ${error}`));
            console.log(chalk_1.default.blue(`📝 Escrow wallet generated locally only for UPI ID: ${upiId}`));
        }
        return escrowAccount;
    }
    getCurrentAccount() {
        return this.account;
    }
    getWalletInfo() {
        if (!this.account)
            return null;
        return {
            address: this.account.accountAddress.toString(),
            publicKey: this.account.publicKey.toString(),
            network: this.configManager.getNetwork(),
        };
    }
    async getBalance() {
        if (!this.account) {
            throw new Error('No account initialized');
        }
        try {
            const resources = await this.aptos.getAccountResources({
                accountAddress: this.account.accountAddress,
            });
            const balance = {
                apt: '0',
                tokens: {},
            };
            const coinStore = resources.find((resource) => resource.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>');
            if (coinStore && coinStore.data) {
                const coinData = coinStore.data;
                balance.apt = (parseInt(coinData.coin.value) / 100000000).toString();
            }
            const tokenStores = resources.filter((resource) => resource.type.includes('0x1::coin::CoinStore') &&
                !resource.type.includes('AptosCoin'));
            for (const tokenStore of tokenStores) {
                if (tokenStore.data) {
                    const tokenData = tokenStore.data;
                    const tokenType = this.extractTokenType(tokenStore.type);
                    balance.tokens[tokenType] = tokenData.coin.value;
                }
            }
            return balance;
        }
        catch (error) {
            throw new Error(`Failed to fetch balance: ${error}`);
        }
    }
    extractTokenType(resourceType) {
        const match = resourceType.match(/CoinStore<(.+)>/);
        return match ? match[1] : resourceType;
    }
    async fundAccount(amount) {
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
                amount: amount || 100000000,
            });
        }
        catch (error) {
            throw new Error(`Failed to fund account: ${error}`);
        }
    }
    async getAccountSequenceNumber() {
        if (!this.account) {
            throw new Error('No account initialized');
        }
        try {
            const accountData = await this.aptos.getAccountInfo({
                accountAddress: this.account.accountAddress,
            });
            return BigInt(accountData.sequence_number);
        }
        catch (error) {
            throw new Error(`Failed to get sequence number: ${error}`);
        }
    }
    async waitForTransaction(txnHash, timeoutSecs = 30) {
        try {
            const response = await this.aptos.waitForTransaction({
                transactionHash: txnHash,
                options: {
                    timeoutSecs,
                },
            });
            return response;
        }
        catch (error) {
            throw new Error(`Transaction failed or timed out: ${error}`);
        }
    }
    switchNetwork(network) {
        this.configManager.setNetwork(network);
        this.aptos = new ts_sdk_1.Aptos(new ts_sdk_1.AptosConfig({ network: this.configManager.getAptosNetwork() }));
    }
    async isAccountExists() {
        if (!this.account)
            return false;
        try {
            await this.aptos.getAccountInfo({
                accountAddress: this.account.accountAddress,
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    isInitialized() {
        return this.account !== null;
    }
    getAddress() {
        return this.account ? this.account.accountAddress.toString() : null;
    }
    getPrivateKey() {
        return this.account ? this.account.privateKey.toString() : null;
    }
    getPublicKey() {
        return this.account ? this.account.publicKey.toString() : null;
    }
    exportAccountInfo() {
        if (!this.account)
            return null;
        return {
            privateKey: this.account.privateKey.toString(),
            address: this.account.accountAddress.toString(),
            publicKey: this.account.publicKey.toString(),
        };
    }
    formatBalance(balance) {
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
exports.WalletManager = WalletManager;
//# sourceMappingURL=WalletManager.js.map
import { OnChainConfigManager } from '../config/OnChainConfigManager';
import { WalletManager } from '../wallet/WalletManager';
import { UPIRegistryService } from '../services/UPIRegistryService';
export declare function updateUpiAction(configManager: OnChainConfigManager, walletManager: WalletManager, upiRegistryService: UPIRegistryService, oldUpiId: string, newUpiId: string, options: {
    force?: boolean;
}): Promise<void>;
//# sourceMappingURL=update-upi.d.ts.map
import { OnChainConfigManager } from '../config/OnChainConfigManager';
import { WalletManager } from '../wallet/WalletManager';
import { UPIRegistryService } from '../services/UPIRegistryService';
export declare function deleteUpiAction(configManager: OnChainConfigManager, walletManager: WalletManager, upiRegistryService: UPIRegistryService, upiId: string, options: {
    force?: boolean;
}): Promise<void>;
//# sourceMappingURL=delete-upi.d.ts.map
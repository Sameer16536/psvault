// Helper functions for VaultPage

import { generatePassword } from '@/lib/crypto';

export { generatePassword };

// Check if vault needs unlock
export function checkVaultUnlock(
    vaultId: string,
    vault: any,
    isVaultUnlocked: (id: string) => boolean,
    setShowUnlockDialog: (show: boolean) => void
) {
    // Only show unlock if vault has encrypted key and is not unlocked
    if (vault?.encryptedKey && !isVaultUnlocked(vaultId)) {
        setShowUnlockDialog(true);
    }
}

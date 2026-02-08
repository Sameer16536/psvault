import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Vault {
    id: string;
    userId: string;
    name: string;
    description?: string;
    encryptedKey?: string; // Array of bytes from backend
    keyEncryptionVersion?: number;
    createdAt: string;
    updatedAt: string;
}

interface VaultStore {
    vaults: Vault[];
    selectedVaultId: string | null;
    unlockedVaults: Map<string, CryptoKey>;
    setVaults: (vaults: Vault[]) => void;
    addVault: (vault: Vault) => void;
    updateVault: (id: string, vault: Partial<Vault>) => void;
    deleteVault: (id: string) => void;
    selectVault: (id: string | null) => void;
    getSelectedVault: () => Vault | null;
    unlockVault: (vaultId: string, key: CryptoKey) => void;
    isVaultUnlocked: (vaultId: string) => boolean;
    getVaultKey: (vaultId: string) => CryptoKey | undefined;
    lockVault: (vaultId: string) => void;
    lockAllVaults: () => void;
}

export const useVaultStore = create<VaultStore>()(
    persist(
        (set, get) => ({
            vaults: [],
            selectedVaultId: null,
            unlockedVaults: new Map(),

            setVaults: (vaults) => set({ vaults }),

            addVault: (vault) => set((state) => ({
                vaults: [...state.vaults, vault],
            })),

            updateVault: (id, updates) => set((state) => ({
                vaults: state.vaults.map((v) =>
                    v.id === id ? { ...v, ...updates } : v
                ),
            })),

            deleteVault: (id) => set((state) => ({
                vaults: state.vaults.filter((v) => v.id !== id),
                selectedVaultId: state.selectedVaultId === id ? null : state.selectedVaultId,
            })),

            selectVault: (id) => set({ selectedVaultId: id }),

            getSelectedVault: () => {
                const state = get();
                return state.vaults.find((v) => v.id === state.selectedVaultId) || null;
            },

            // Unlock vault methods (not persisted)
            // Unlock vault methods (not persisted)
            unlockVault: (vaultId, key) => {
                const current = get().unlockedVaults;
                const newMap = current instanceof Map ? new Map(current) : new Map();
                newMap.set(vaultId, key);
                set({ unlockedVaults: newMap });
            },

            isVaultUnlocked: (vaultId) => {
                const current = get().unlockedVaults;
                return current instanceof Map ? current.has(vaultId) : false;
            },

            getVaultKey: (vaultId) => {
                const current = get().unlockedVaults;
                return current instanceof Map ? current.get(vaultId) : undefined;
            },

            lockVault: (vaultId) => {
                const current = get().unlockedVaults;
                if (!(current instanceof Map)) {
                    set({ unlockedVaults: new Map() });
                    return;
                }
                const newMap = new Map(current);
                newMap.delete(vaultId);
                set({ unlockedVaults: newMap });
            },

            lockAllVaults: () => {
                set({ unlockedVaults: new Map() });
            },
        }),
        {
            name: 'vault-storage-v2',
            partialize: (state) => ({
                vaults: state.vaults,
                selectedVaultId: state.selectedVaultId,
            }),
        }
    )
);

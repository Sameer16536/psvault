import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Vault {
    id: string;
    userId: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

interface VaultStore {
    vaults: Vault[];
    selectedVaultId: string | null;
    setVaults: (vaults: Vault[]) => void;
    addVault: (vault: Vault) => void;
    updateVault: (id: string, vault: Partial<Vault>) => void;
    deleteVault: (id: string) => void;
    selectVault: (id: string | null) => void;
    getSelectedVault: () => Vault | null;
}

export const useVaultStore = create<VaultStore>()(
    persist(
        (set, get) => ({
            vaults: [],
            selectedVaultId: null,

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
        }),
        {
            name: 'vault-storage',
        }
    )
);

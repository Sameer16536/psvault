import { create } from 'zustand';

interface SecretMetadata {
    title: string;
    domain?: string;
    tags?: string[];
}

interface Secret {
    id: string;
    vaultId: string;
    type: 'password' | 'note' | 'api_key' | 'card';
    encryptedPayload: string;
    encryptionVersion: number;
    metadata: SecretMetadata;
    lastAccessedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

interface DecryptedSecret extends Secret {
    decryptedData?: any;
}

interface SecretStore {
    secrets: Record<string, Secret[]>; // vaultId -> secrets
    decryptedCache: Record<string, any>; // secretId -> decrypted data
    searchQuery: string;
    filterType: string | null;

    setSecrets: (vaultId: string, secrets: Secret[]) => void;
    addSecret: (secret: Secret) => void;
    updateSecret: (id: string, secret: Partial<Secret>) => void;
    deleteSecret: (id: string, vaultId: string) => void;
    cacheDecrypted: (secretId: string, data: any) => void;
    getDecrypted: (secretId: string) => any;
    clearCache: () => void;
    setSearchQuery: (query: string) => void;
    setFilterType: (type: string | null) => void;
    getFilteredSecrets: (vaultId: string) => Secret[];
}

export const useSecretStore = create<SecretStore>((set, get) => ({
    secrets: {},
    decryptedCache: {},
    searchQuery: '',
    filterType: null,

    setSecrets: (vaultId, secrets) => set((state) => ({
        secrets: { ...state.secrets, [vaultId]: secrets },
    })),

    addSecret: (secret) => set((state) => {
        const vaultSecrets = state.secrets[secret.vaultId] || [];
        return {
            secrets: {
                ...state.secrets,
                [secret.vaultId]: [...vaultSecrets, secret],
            },
        };
    }),

    updateSecret: (id, updates) => set((state) => {
        const newSecrets = { ...state.secrets };
        Object.keys(newSecrets).forEach((vaultId) => {
            newSecrets[vaultId] = newSecrets[vaultId].map((s) =>
                s.id === id ? { ...s, ...updates } : s
            );
        });
        return { secrets: newSecrets };
    }),

    deleteSecret: (id, vaultId) => set((state) => ({
        secrets: {
            ...state.secrets,
            [vaultId]: (state.secrets[vaultId] || []).filter((s) => s.id !== id),
        },
        decryptedCache: Object.fromEntries(
            Object.entries(state.decryptedCache).filter(([key]) => key !== id)
        ),
    })),

    cacheDecrypted: (secretId, data) => set((state) => ({
        decryptedCache: { ...state.decryptedCache, [secretId]: data },
    })),

    getDecrypted: (secretId) => get().decryptedCache[secretId],

    clearCache: () => set({ decryptedCache: {} }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    setFilterType: (type) => set({ filterType: type }),

    getFilteredSecrets: (vaultId) => {
        const state = get();
        const secrets = state.secrets[vaultId] || [];
        const { searchQuery, filterType } = state;

        return secrets.filter((secret) => {
            const matchesSearch = !searchQuery ||
                secret.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                secret.metadata.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                secret.metadata.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesType = !filterType || secret.type === filterType;

            return matchesSearch && matchesType;
        });
    },
}));

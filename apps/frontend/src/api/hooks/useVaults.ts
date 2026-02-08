import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../client';
import { useVaultStore } from '@/stores/vaultStore';
import { toast } from 'sonner';

interface Vault {
    id: string;
    userId: string;
    name: string;
    description?: string;
    encryptedKey?: string;
    keyEncryptionVersion?: number;
    createdAt: string;
    updatedAt: string;
}

interface CreateVaultRequest {
    name: string;
    description?: string;
    encryptedKey?: string;
    keyEncryptionVersion?: number;
}

export const useVaults = () => {
    const apiClient = useApiClient();
    const setVaults = useVaultStore((state) => state.setVaults);

    return useQuery({
        queryKey: ['vaults'],
        queryFn: async () => {
            const { data } = await apiClient.get<Vault[]>('/api/vaults');
            setVaults(data);
            return data;
        },
    });
};

export const useVault = (id: string) => {
    const apiClient = useApiClient();

    return useQuery({
        queryKey: ['vault', id],
        queryFn: async () => {
            const { data } = await apiClient.get<Vault>(`/api/vaults/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const useCreateVault = () => {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();
    const addVault = useVaultStore((state) => state.addVault);

    return useMutation({
        mutationFn: async (vault: CreateVaultRequest) => {
            const { data } = await apiClient.post<Vault>('/api/vaults', vault);
            return data;
        },
        onSuccess: (data) => {
            addVault(data);
            queryClient.invalidateQueries({ queryKey: ['vaults'] });
            toast.success('Vault created successfully');
        },
        onError: () => {
            toast.error('Failed to create vault');
        },
    });
};

export const useUpdateVault = () => {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();
    const updateVault = useVaultStore((state) => state.updateVault);

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Vault> & { id: string }) => {
            const { data } = await apiClient.put<Vault>(`/api/vaults/${id}`, updates);
            return data;
        },
        onSuccess: (data) => {
            updateVault(data.id, data);
            queryClient.invalidateQueries({ queryKey: ['vaults'] });
            queryClient.invalidateQueries({ queryKey: ['vault', data.id] });
            toast.success('Vault updated successfully');
        },
        onError: () => {
            toast.error('Failed to update vault');
        },
    });
};

export const useDeleteVault = () => {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();
    const deleteVault = useVaultStore((state) => state.deleteVault);

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/vaults/${id}`);
            return id;
        },
        onSuccess: (id) => {
            deleteVault(id);
            queryClient.invalidateQueries({ queryKey: ['vaults'] });
            toast.success('Vault deleted successfully');
        },
        onError: (error: any) => {
            console.error('Delete vault error:', error);
            const message = error?.response?.data?.message || error?.message || 'Failed to delete vault';
            toast.error(`Failed to delete vault: ${message}`);
        },
    });
};

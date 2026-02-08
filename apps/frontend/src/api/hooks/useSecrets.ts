import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../client';
import { useSecretStore } from '@/stores/secretStore';
import { toast } from 'sonner';

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

interface CreateSecretRequest {
    vaultId: string;
    type: 'password' | 'note' | 'api_key' | 'card';
    encryptedPayload: string;
    encryptionVersion: number;
    metadata: SecretMetadata;
}

export const useSecrets = (vaultId: string) => {
    const apiClient = useApiClient();
    const setSecrets = useSecretStore((state) => state.setSecrets);

    return useQuery({
        queryKey: ['secrets', vaultId],
        queryFn: async () => {
            const { data } = await apiClient.get<Secret[]>(`/api/vaults/${vaultId}/secrets`);
            setSecrets(vaultId, data);
            return data;
        },
        enabled: !!vaultId,
    });
};

export const useSecret = (id: string) => {
    const apiClient = useApiClient();

    return useQuery({
        queryKey: ['secret', id],
        queryFn: async () => {
            const { data } = await apiClient.get<Secret>(`/api/secrets/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const useSearchSecrets = (filters: {
    vaultId?: string;
    type?: string;
    title?: string;
    domain?: string;
    tags?: string[];
}) => {
    const apiClient = useApiClient();

    return useQuery({
        queryKey: ['secrets', 'search', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(key, v));
                    } else {
                        params.append(key, value);
                    }
                }
            });
            const { data } = await apiClient.get<Secret[]>(`/api/secrets/search?${params}`);
            return data;
        },
    });
};

export const useCreateSecret = () => {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();
    const addSecret = useSecretStore((state) => state.addSecret);

    return useMutation({
        mutationFn: async (secret: CreateSecretRequest) => {
            const { data } = await apiClient.post<Secret>('/api/secrets', secret);
            return data;
        },
        onSuccess: (data) => {
            addSecret(data);
            queryClient.invalidateQueries({ queryKey: ['secrets', data.vaultId] });
            toast.success('Secret created successfully');
        },
        onError: () => {
            toast.error('Failed to create secret');
        },
    });
};

export const useUpdateSecret = () => {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();
    const updateSecret = useSecretStore((state) => state.updateSecret);

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Secret> & { id: string }) => {
            const { data } = await apiClient.put<Secret>(`/api/secrets/${id}`, updates);
            return data;
        },
        onSuccess: (data) => {
            updateSecret(data.id, data);
            queryClient.invalidateQueries({ queryKey: ['secrets', data.vaultId] });
            queryClient.invalidateQueries({ queryKey: ['secret', data.id] });
            toast.success('Secret updated successfully');
        },
        onError: () => {
            toast.error('Failed to update secret');
        },
    });
};

export const useDeleteSecret = () => {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();
    const deleteSecret = useSecretStore((state) => state.deleteSecret);

    return useMutation({
        mutationFn: async ({ id, vaultId }: { id: string; vaultId: string }) => {
            await apiClient.delete(`/api/secrets/${id}`);
            return { id, vaultId };
        },
        onSuccess: ({ id, vaultId }) => {
            deleteSecret(id, vaultId);
            queryClient.invalidateQueries({ queryKey: ['secrets', vaultId] });
            toast.success('Secret deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete secret');
        },
    });
};

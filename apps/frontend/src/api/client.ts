import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Hook to get authenticated API client
export const useApiClient = () => {
    const { getToken } = useAuth();

    const client = useMemo(() => {
        const instance = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to inject token
        instance.interceptors.request.use(
            async (config) => {
                const token = await getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        return instance;
    }, [getToken]);

    return client;
};

// Default export for non-authenticated requests
export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;

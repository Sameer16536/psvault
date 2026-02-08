import { useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';

export default function DebugAuth() {
    const { getToken, isSignedIn, userId } = useAuth();

    useEffect(() => {
        const checkAuth = async () => {
            console.log('=== CLERK AUTH DEBUG ===');
            console.log('Is Signed In:', isSignedIn);
            console.log('User ID:', userId);

            if (isSignedIn) {
                try {
                    const token = await getToken();
                    console.log('Token (first 50 chars):', token?.substring(0, 50));
                    console.log('Token exists:', !!token);

                    // Test API call
                    const response = await fetch('http://localhost:8080/api/vaults', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    console.log('API Response Status:', response.status);
                    const data = await response.json();
                    console.log('API Response:', data);
                } catch (error) {
                    console.error('Error:', error);
                }
            }
        };

        checkAuth();
    }, [isSignedIn, userId, getToken]);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
            <div className="space-y-2">
                <p>Signed In: {isSignedIn ? 'Yes' : 'No'}</p>
                <p>User ID: {userId || 'None'}</p>
                <p className="text-sm text-gray-600">Check browser console for details</p>
            </div>
        </div>
    );
}

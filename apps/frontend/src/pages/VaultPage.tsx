import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { useVault } from '@/api/hooks/useVaults';
import { useSecrets, useCreateSecret, useDeleteSecret } from '@/api/hooks/useSecrets';
import { useSecretStore } from '@/stores/secretStore';
import { encrypt, decrypt, deriveKey, generatePassword } from '@/lib/crypto';
import { ArrowLeft, Plus, Search, Eye, EyeOff, Copy, Trash2, Key, FileText, CreditCard, Lock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function VaultPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: vault } = useVault(id!);
    const { data: secrets, isLoading } = useSecrets(id!);
    const createSecret = useCreateSecret();
    const deleteSecret = useDeleteSecret();

    const { searchQuery, setSearchQuery, filterType, setFilterType, getFilteredSecrets } = useSecretStore();
    const filteredSecrets = getFilteredSecrets(id!);

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [selectedSecret, setSelectedSecret] = useState<any>(null);
    const [masterPassword, setMasterPassword] = useState('');
    const [decryptedData, setDecryptedData] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [newSecret, setNewSecret] = useState({
        type: 'password' as 'password' | 'note' | 'api_key' | 'card',
        title: '',
        domain: '',
        tags: [] as string[],
        username: '',
        password: '',
        note: '',
        apiKey: '',
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: '',
    });

    const handleCreateSecret = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newSecret.title.trim()) {
            toast.error('Title is required');
            return;
        }

        if (!masterPassword) {
            toast.error('Master password is required');
            return;
        }

        try {
            // Prepare data based on type
            let dataToEncrypt: any = {};
            if (newSecret.type === 'password') {
                dataToEncrypt = { username: newSecret.username, password: newSecret.password };
            } else if (newSecret.type === 'note') {
                dataToEncrypt = { note: newSecret.note };
            } else if (newSecret.type === 'api_key') {
                dataToEncrypt = { apiKey: newSecret.apiKey };
            } else if (newSecret.type === 'card') {
                dataToEncrypt = {
                    cardNumber: newSecret.cardNumber,
                    cardHolder: newSecret.cardHolder,
                    expiryDate: newSecret.expiryDate,
                    cvv: newSecret.cvv,
                };
            }

            // Encrypt the data
            const { key } = await deriveKey(masterPassword);
            const encryptedPayload = await encrypt(JSON.stringify(dataToEncrypt), key);

            await createSecret.mutateAsync({
                vaultId: id!,
                type: newSecret.type,
                encryptedPayload,
                encryptionVersion: 1,
                metadata: {
                    title: newSecret.title,
                    domain: newSecret.domain || undefined,
                    tags: newSecret.tags.length > 0 ? newSecret.tags : undefined,
                },
            });

            setNewSecret({
                type: 'password',
                title: '',
                domain: '',
                tags: [],
                username: '',
                password: '',
                note: '',
                apiKey: '',
                cardNumber: '',
                cardHolder: '',
                expiryDate: '',
                cvv: '',
            });
            setMasterPassword('');
            setShowCreateDialog(false);
        } catch (error) {
            toast.error('Failed to encrypt secret');
        }
    };

    const handleViewSecret = async (secret: any) => {
        setSelectedSecret(secret);
        setShowViewDialog(true);
        setDecryptedData(null);
    };

    const handleDecrypt = async () => {
        if (!masterPassword || !selectedSecret) return;

        try {
            const { key } = await deriveKey(masterPassword);
            const decrypted = await decrypt(selectedSecret.encryptedPayload, key);
            setDecryptedData(JSON.parse(decrypted));
            toast.success('Secret decrypted');
        } catch (error) {
            toast.error('Failed to decrypt - wrong password?');
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const handleDeleteSecret = async (secretId: string) => {
        if (confirm('Are you sure you want to delete this secret?')) {
            await deleteSecret.mutateAsync({ id: secretId, vaultId: id! });
        }
    };

    const handleGeneratePassword = () => {
        const generated = generatePassword(16, {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
        });
        setNewSecret({ ...newSecret, password: generated });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'password': return <Key className="w-5 h-5" />;
            case 'note': return <FileText className="w-5 h-5" />;
            case 'api_key': return <Lock className="w-5 h-5" />;
            case 'card': return <CreditCard className="w-5 h-5" />;
            default: return <Key className="w-5 h-5" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {vault?.name || 'Vault'}
                            </h1>
                            {vault?.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{vault.description}</p>
                            )}
                        </div>
                    </div>
                    <UserButton afterSignOutUrl="/sign-in" />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search secrets..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={filterType || ''}
                        onChange={(e) => setFilterType(e.target.value || null)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="">All Types</option>
                        <option value="password">Passwords</option>
                        <option value="note">Notes</option>
                        <option value="api_key">API Keys</option>
                        <option value="card">Cards</option>
                    </select>
                    <button
                        onClick={() => setShowCreateDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        Add Secret
                    </button>
                </div>

                {/* Secrets List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : filteredSecrets && filteredSecrets.length > 0 ? (
                    <div className="space-y-3">
                        {filteredSecrets.map((secret) => (
                            <div
                                key={secret.id}
                                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                            {getTypeIcon(secret.type)}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {secret.metadata.title}
                                            </h3>
                                            {secret.metadata.domain && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {secret.metadata.domain}
                                                </p>
                                            )}
                                            {secret.metadata.tags && secret.metadata.tags.length > 0 && (
                                                <div className="flex gap-2 mt-1">
                                                    {secret.metadata.tags.map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleViewSecret(secret)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSecret(secret.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No secrets yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Add your first secret to this vault
                        </p>
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Secret
                        </button>
                    </div>
                )}
            </main>

            {/* Create Secret Dialog */}
            {showCreateDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md my-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Add New Secret
                        </h3>
                        <form onSubmit={handleCreateSecret}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Type *
                                    </label>
                                    <select
                                        value={newSecret.type}
                                        onChange={(e) => setNewSecret({ ...newSecret, type: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="password">Password</option>
                                        <option value="note">Note</option>
                                        <option value="api_key">API Key</option>
                                        <option value="card">Credit Card</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={newSecret.title}
                                        onChange={(e) => setNewSecret({ ...newSecret, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Gmail Account"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Domain/Website
                                    </label>
                                    <input
                                        type="text"
                                        value={newSecret.domain}
                                        onChange={(e) => setNewSecret({ ...newSecret, domain: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="gmail.com"
                                    />
                                </div>

                                {newSecret.type === 'password' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Username/Email
                                            </label>
                                            <input
                                                type="text"
                                                value={newSecret.username}
                                                onChange={(e) => setNewSecret({ ...newSecret, username: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="user@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Password
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newSecret.password}
                                                    onChange={(e) => setNewSecret({ ...newSecret, password: e.target.value })}
                                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleGeneratePassword}
                                                    className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                                >
                                                    <RefreshCw className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {newSecret.type === 'note' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Note
                                        </label>
                                        <textarea
                                            value={newSecret.note}
                                            onChange={(e) => setNewSecret({ ...newSecret, note: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            rows={4}
                                            placeholder="Your secure note..."
                                        />
                                    </div>
                                )}

                                {newSecret.type === 'api_key' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            API Key
                                        </label>
                                        <input
                                            type="text"
                                            value={newSecret.apiKey}
                                            onChange={(e) => setNewSecret({ ...newSecret, apiKey: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="sk_live_..."
                                        />
                                    </div>
                                )}

                                {newSecret.type === 'card' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Card Number
                                            </label>
                                            <input
                                                type="text"
                                                value={newSecret.cardNumber}
                                                onChange={(e) => setNewSecret({ ...newSecret, cardNumber: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="1234 5678 9012 3456"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Card Holder
                                            </label>
                                            <input
                                                type="text"
                                                value={newSecret.cardHolder}
                                                onChange={(e) => setNewSecret({ ...newSecret, cardHolder: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Expiry
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newSecret.expiryDate}
                                                    onChange={(e) => setNewSecret({ ...newSecret, expiryDate: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    placeholder="MM/YY"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    CVV
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newSecret.cvv}
                                                    onChange={(e) => setNewSecret({ ...newSecret, cvv: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    placeholder="123"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Master Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={masterPassword}
                                        onChange={(e) => setMasterPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter your master password"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateDialog(false);
                                        setMasterPassword('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createSecret.isPending}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {createSecret.isPending ? 'Saving...' : 'Save Secret'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Secret Dialog */}
            {showViewDialog && selectedSecret && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {selectedSecret.metadata.title}
                        </h3>

                        {!decryptedData ? (
                            <div className="space-y-4">
                                <p className="text-gray-600 dark:text-gray-400">
                                    Enter your master password to decrypt this secret
                                </p>
                                <input
                                    type="password"
                                    value={masterPassword}
                                    onChange={(e) => setMasterPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Master password"
                                    onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowViewDialog(false);
                                            setMasterPassword('');
                                            setDecryptedData(null);
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDecrypt}
                                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        Decrypt
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedSecret.type === 'password' && (
                                    <>
                                        {decryptedData.username && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Username
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={decryptedData.username}
                                                        readOnly
                                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    />
                                                    <button
                                                        onClick={() => handleCopy(decryptedData.username)}
                                                        className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                                    >
                                                        <Copy className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {decryptedData.password && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Password
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={decryptedData.password}
                                                        readOnly
                                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    />
                                                    <button
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopy(decryptedData.password)}
                                                        className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                                    >
                                                        <Copy className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {selectedSecret.type === 'note' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Note
                                        </label>
                                        <textarea
                                            value={decryptedData.note}
                                            readOnly
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                            rows={6}
                                        />
                                    </div>
                                )}

                                {selectedSecret.type === 'api_key' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            API Key
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={decryptedData.apiKey}
                                                readOnly
                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                            <button
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                            <button
                                                onClick={() => handleCopy(decryptedData.apiKey)}
                                                className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                            >
                                                <Copy className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selectedSecret.type === 'card' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Card Number
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={decryptedData.cardNumber}
                                                    readOnly
                                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                                <button
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleCopy(decryptedData.cardNumber)}
                                                    className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                                >
                                                    <Copy className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Card Holder
                                            </label>
                                            <input
                                                type="text"
                                                value={decryptedData.cardHolder}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Expiry
                                                </label>
                                                <input
                                                    type="text"
                                                    value={decryptedData.expiryDate}
                                                    readOnly
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    CVV
                                                </label>
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={decryptedData.cvv}
                                                    readOnly
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <button
                                    onClick={() => {
                                        setShowViewDialog(false);
                                        setMasterPassword('');
                                        setDecryptedData(null);
                                        setShowPassword(false);
                                    }}
                                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

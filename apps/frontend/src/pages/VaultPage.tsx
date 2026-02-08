import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { useVault } from '@/api/hooks/useVaults';
import { useSecrets, useCreateSecret, useDeleteSecret } from '@/api/hooks/useSecrets';
import { useSecretStore } from '@/stores/secretStore';
import { useVaultStore } from '@/stores/vaultStore';
import { encrypt, decrypt, decryptVaultKey, generatePassword } from '@/lib/crypto';
import { ArrowLeft, Plus, Search, Eye, EyeOff, Copy, Trash2, Key, FileText, CreditCard, Lock, RefreshCw, Unlock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function VaultPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: vault, isLoading: isVaultLoading, isError: isVaultError } = useVault(id!);
    const { data: secrets, isLoading: isSecretsLoading } = useSecrets(id!);
    const isLoading = isVaultLoading || isSecretsLoading;

    const createSecret = useCreateSecret();
    const deleteSecret = useDeleteSecret();

    const { searchQuery, setSearchQuery, filterType, setFilterType, getFilteredSecrets } = useSecretStore();
    const filteredSecrets = getFilteredSecrets(id!);
    const { isVaultUnlocked, getVaultKey, unlockVault } = useVaultStore();

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [showUnlockDialog, setShowUnlockDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedSecret, setSelectedSecret] = useState<any>(null);
    const [secretToDelete, setSecretToDelete] = useState<any>(null);
    const [unlockPassword, setUnlockPassword] = useState('');
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

    // Check if vault needs unlock on mount
    useEffect(() => {
        if (vault?.encryptedKey && !isVaultUnlocked(id!)) {
            setShowUnlockDialog(true);
        }
    }, [vault, id, isVaultUnlocked]);

    const handleUnlock = async () => {
        if (!unlockPassword || !vault?.encryptedKey) return;

        try {
            // Decrypt vault key with master password
            // vault.encryptedKey is now a base64 string
            const vaultKey = await decryptVaultKey(vault.encryptedKey, unlockPassword);

            // Store in session
            unlockVault(id!, vaultKey);
            setShowUnlockDialog(false);
            setUnlockPassword('');
            toast.success('Vault unlocked!');
        } catch (error) {
            console.error('Failed to unlock vault:', error);
            toast.error('Wrong password or failed to unlock vault');
        }
    };

    const handleCreateSecret = async (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure vault is loaded
        if (!vault) {
            toast.error('Vault data not loaded. Please refresh.');
            return;
        }

        if (!newSecret.title.trim()) {
            toast.error('Title is required');
            return;
        }

        // Check if vault has encrypted key (new system)
        if (vault.encryptedKey) {
            // Get vault key from session
            const vaultKey = getVaultKey(id!);
            if (!vaultKey) {
                toast.error('Vault is locked. Please unlock first.');
                setShowUnlockDialog(true);
                setShowCreateDialog(false);
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

                // Encrypt with vault key
                const encryptedPayload = await encrypt(JSON.stringify(dataToEncrypt), vaultKey);

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
                setShowCreateDialog(false);
                toast.success('Secret created!');
            } catch (error) {
                console.error('Failed to create secret:', error);
                toast.error('Failed to create secret');
            }
        } else {
            console.error('Vault missing encryptedKey:', vault);
            toast.error('Vault data error. Please create a new vault.');
        }
    };

    const handleViewSecret = async (secret: any) => {
        // Ensure vault is loaded
        if (!vault) return;

        // Check if vault has encrypted key (new system)
        if (vault.encryptedKey) {
            const vaultKey = getVaultKey(id!);

            if (!vaultKey) {
                toast.error('Vault is locked. Please unlock first.');
                setShowUnlockDialog(true);
                return;
            }

            try {
                // Auto-decrypt with vault key
                const decrypted = await decrypt(secret.encryptedPayload, vaultKey);
                setDecryptedData(JSON.parse(decrypted));
                setSelectedSecret(secret);
                setShowViewDialog(true);
            } catch (error) {
                console.error('Failed to decrypt secret:', error);
                toast.error('Failed to decrypt secret. Vault may be locked.');
                setShowUnlockDialog(true);
            }
        } else {
            // This really shouldn't happen for new vaults, but handling edge case
            console.error('Vault missing encryptedKey:', vault);
            toast.error('Vault data error. Please create a new vault.');
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const handleDeleteClick = (secret: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSecretToDelete(secret);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (secretToDelete) {
            await deleteSecret.mutateAsync({ id: secretToDelete.id, vaultId: id! });
            setShowDeleteDialog(false);
            setSecretToDelete(null);
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

    if (isVaultError || (!isVaultLoading && !vault)) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="inline-block p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                        <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Failed to load vault</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">The vault could not be found or you don't have access.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ... (rest of handlers)

    // Show unlock modal if vault is locked
    if (vault?.encryptedKey && !isVaultUnlocked(id!) && showUnlockDialog) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-indigo-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-indigo-500/20">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/30">
                            <Unlock className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Unlock Vault
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">{vault.name}</p>
                        </div>
                    </div>

                    <p className="text-gray-300 mb-6">
                        Enter your master password to unlock this vault and access your secrets.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Master Password
                            </label>
                            <input
                                type="password"
                                value={unlockPassword}
                                onChange={(e) => setUnlockPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Enter master password"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="flex-1 px-6 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-gray-800/50 transition-all font-medium"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleUnlock}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 font-medium"
                            >
                                Unlock
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                            {isVaultLoading ? (
                                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            ) : (
                                <>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {vault?.name || 'Vault'}
                                    </h1>
                                    {vault?.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{vault.description}</p>
                                    )}
                                </>
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
                                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group cursor-pointer"
                                onClick={() => handleViewSecret(secret)}
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewSecret(secret);
                                            }}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(secret, e)}
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

            {/* Create Secret Dialog - Simplified version, will add full form later */}
            {showCreateDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 fade-in">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl scale-in max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold text-white mb-6">
                            Add New Secret
                        </h3>
                        <form onSubmit={handleCreateSecret} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Type *
                                </label>
                                <select
                                    value={newSecret.type}
                                    onChange={(e) => setNewSecret({ ...newSecret, type: e.target.value as any })}
                                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-gray-800/50 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="password">Password</option>
                                    <option value="note">Note</option>
                                    <option value="api_key">API Key</option>
                                    <option value="card">Credit Card</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={newSecret.title}
                                    onChange={(e) => setNewSecret({ ...newSecret, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Gmail Account"
                                    autoFocus
                                />
                            </div>

                            {newSecret.type === 'password' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                                            Username/Email
                                        </label>
                                        <input
                                            type="text"
                                            value={newSecret.username}
                                            onChange={(e) => setNewSecret({ ...newSecret, username: e.target.value })}
                                            className="w-full px-4 py-3 border border-white/10 rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="user@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                                            Password
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newSecret.password}
                                                onChange={(e) => setNewSecret({ ...newSecret, password: e.target.value })}
                                                className="flex-1 px-4 py-3 border border-white/10 rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleGeneratePassword}
                                                className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
                                            >
                                                <RefreshCw className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {newSecret.type === 'note' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                                        Note
                                    </label>
                                    <textarea
                                        value={newSecret.note}
                                        onChange={(e) => setNewSecret({ ...newSecret, note: e.target.value })}
                                        className="w-full px-4 py-3 border border-white/10 rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        rows={4}
                                        placeholder="Your secure note..."
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateDialog(false)}
                                    className="flex-1 px-6 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-gray-800/50 transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createSecret.isPending}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {createSecret.isPending ? 'Saving...' : 'Save Secret'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Secret Dialog - Simplified */}
            {showViewDialog && selectedSecret && decryptedData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 fade-in">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl scale-in">
                        <h3 className="text-2xl font-bold text-white mb-6">
                            {selectedSecret.metadata.title}
                        </h3>

                        <div className="space-y-4">
                            {selectedSecret.type === 'password' && (
                                <>
                                    {decryptedData.username && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                                Username
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={decryptedData.username}
                                                    readOnly
                                                    className="flex-1 px-4 py-3 border border-white/10 rounded-xl bg-gray-800/50 text-white"
                                                />
                                                <button
                                                    onClick={() => handleCopy(decryptedData.username)}
                                                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
                                                >
                                                    <Copy className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {decryptedData.password && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                                Password
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={decryptedData.password}
                                                    readOnly
                                                    className="flex-1 px-4 py-3 border border-white/10 rounded-xl bg-gray-800/50 text-white"
                                                />
                                                <button
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleCopy(decryptedData.password)}
                                                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
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
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                                        Note
                                    </label>
                                    <textarea
                                        value={decryptedData.note}
                                        readOnly
                                        className="w-full px-4 py-3 border border-white/10 rounded-xl bg-gray-800/50 text-white resize-none"
                                        rows={6}
                                    />
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setShowViewDialog(false);
                                    setDecryptedData(null);
                                    setShowPassword(false);
                                }}
                                className="w-full px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteDialog && secretToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 fade-in">
                    <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-red-500/20 scale-in">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">
                                    Delete Secret?
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6">
                            <p className="text-gray-300 mb-2">
                                You're about to delete:
                            </p>
                            <p className="text-white font-semibold text-lg">
                                "{secretToDelete.metadata.title}"
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteDialog(false);
                                    setSecretToDelete(null);
                                }}
                                className="flex-1 px-6 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-gray-800/50 transition-all font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteSecret.isPending}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {deleteSecret.isPending ? 'Deleting...' : 'Delete Secret'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

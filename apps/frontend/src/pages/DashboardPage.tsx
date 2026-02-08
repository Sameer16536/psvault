import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { useVaults, useCreateVault, useDeleteVault } from '@/api/hooks/useVaults';
import { Plus, Lock, Trash2, Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Vault {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const { data: vaults, isLoading } = useVaults();
    const createVault = useCreateVault();
    const deleteVault = useDeleteVault();

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [vaultToDelete, setVaultToDelete] = useState<Vault | null>(null);
    const [newVault, setNewVault] = useState({ name: '', description: '' });

    const handleCreateVault = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVault.name.trim()) {
            toast.error('Vault name is required');
            return;
        }

        const payload: any = {
            name: newVault.name.trim(),
        };

        if (newVault.description?.trim()) {
            payload.description = newVault.description.trim();
        }

        await createVault.mutateAsync(payload);
        setNewVault({ name: '', description: '' });
        setShowCreateDialog(false);
    };

    const handleDeleteClick = (vault: Vault, e: React.MouseEvent) => {
        e.stopPropagation();
        setVaultToDelete(vault);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (vaultToDelete) {
            await deleteVault.mutateAsync(vaultToDelete.id);
            setShowDeleteDialog(false);
            setVaultToDelete(null);
        }
    };

    return (
        <div className="dark min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 right-10 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            {/* Header */}
            <header className="relative backdrop-blur-xl bg-gray-900/50 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl shadow-indigo-500/50 glow">
                                <Lock className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    PSVault
                                </h1>
                                <p className="text-sm text-gray-400">Secure Password Manager</p>
                            </div>
                        </div>
                        <UserButton afterSignOutUrl="/sign-in" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Title Section */}
                <div className="mb-8 fade-in">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-3xl font-bold text-white">Your Vaults</h2>
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="btn-interactive flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-semibold">New Vault</span>
                            <Sparkles className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-gray-400">Manage your password vaults securely</p>
                </div>

                {/* Vaults Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="h-48 bg-gray-800/50 backdrop-blur-sm rounded-2xl shimmer border border-white/5"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))}
                    </div>
                ) : vaults && vaults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vaults.map((vault, index) => (
                            <div
                                key={vault.id}
                                className="group card-hover bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/10 hover:border-indigo-500/50 cursor-pointer fade-in transition-all duration-300"
                                style={{ animationDelay: `${index * 0.1}s` }}
                                onClick={() => navigate(`/vault/${vault.id}`)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
                                        <Lock className="w-6 h-6 text-white" />
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteClick(vault, e)}
                                        className="opacity-0 group-hover:opacity-100 p-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                                    {vault.name}
                                </h3>
                                {vault.description && (
                                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                                        {vault.description}
                                    </p>
                                )}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Created {new Date(vault.createdAt).toLocaleDateString()}</span>
                                    <div className="flex items-center gap-1 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="font-medium">Open</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 fade-in">
                        <div className="inline-block p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl shadow-indigo-500/50 mb-6 floating">
                            <Lock className="w-20 h-20 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-3">
                            No vaults yet
                        </h3>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg">
                            Create your first vault to start storing your passwords securely with end-to-end encryption
                        </p>
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="btn-interactive inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 text-lg font-semibold"
                        >
                            <Plus className="w-6 h-6" />
                            Create Your First Vault
                            <Sparkles className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </main>

            {/* Create Vault Dialog */}
            {showCreateDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 fade-in">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl scale-in">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
                                <Plus className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">
                                Create New Vault
                            </h3>
                        </div>
                        <form onSubmit={handleCreateVault} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Vault Name *
                                </label>
                                <input
                                    type="text"
                                    value={newVault.name}
                                    onChange={(e) => setNewVault({ ...newVault, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="Personal Passwords"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newVault.description}
                                    onChange={(e) => setNewVault({ ...newVault, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                    rows={3}
                                    placeholder="My personal accounts and passwords"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateDialog(false);
                                        setNewVault({ name: '', description: '' });
                                    }}
                                    className="flex-1 px-6 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-gray-800/50 transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createVault.isPending}
                                    className="btn-interactive flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {createVault.isPending ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="spinner" />
                                            Creating...
                                        </span>
                                    ) : (
                                        'Create Vault'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteDialog && vaultToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 fade-in">
                    <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-red-500/20 scale-in">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">
                                    Delete Vault?
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6">
                            <p className="text-gray-300 mb-2">
                                You're about to delete:
                            </p>
                            <p className="text-white font-semibold text-lg">
                                "{vaultToDelete.name}"
                            </p>
                            {vaultToDelete.description && (
                                <p className="text-gray-400 text-sm mt-1">
                                    {vaultToDelete.description}
                                </p>
                            )}
                        </div>

                        <p className="text-gray-400 text-sm mb-6">
                            All secrets in this vault will be permanently deleted. This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteDialog(false);
                                    setVaultToDelete(null);
                                }}
                                className="flex-1 px-6 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-gray-800/50 transition-all font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteVault.isPending}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {deleteVault.isPending ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="spinner border-white" />
                                        Deleting...
                                    </span>
                                ) : (
                                    'Delete Vault'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </div>
    );
}

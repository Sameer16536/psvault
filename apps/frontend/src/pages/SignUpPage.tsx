import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        🔐 PSVault
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Create your secure vault
                    </p>
                </div>
                <SignUp
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    redirectUrl="/"
                />
            </div>
        </div>
    );
}

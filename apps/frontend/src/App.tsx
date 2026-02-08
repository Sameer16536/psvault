import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import DashboardPage from './pages/DashboardPage';
import VaultPage from './pages/VaultPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import DebugAuth from './pages/DebugAuth';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <div className="dark">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />

            {/* Debug route */}
            <Route path="/debug" element={
              <>
                <SignedIn>
                  <DebugAuth />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <>
                  <SignedIn>
                    <DashboardPage />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/vault/:id"
              element={
                <>
                  <SignedIn>
                    <VaultPage />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors theme="dark" />
      </QueryClientProvider>
    </div>
  );
}

export default App;

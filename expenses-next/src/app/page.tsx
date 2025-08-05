'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { state: authState, isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized) {
      if (authState.userIsLoggedIn) {
        router.push('/expenses');
      } else {
        router.push('/expenses/login');
      }
    }
  }, [authState.userIsLoggedIn, isInitialized, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

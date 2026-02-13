'use client';

import { useUser, useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { signInAnonymously } from 'firebase/auth';
import Header from '@/components/header';
import { isSelfHosted } from '@/lib/self-hosted';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      if (isSelfHosted) {
        // Auto-login anonymously in self-hosted mode
        signInAnonymously(auth).catch((error) => {
          console.error('Anonymous sign-in failed:', error);
        });
      } else {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router, auth]);

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}

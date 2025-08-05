'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Wallet, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function OAuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { dispatch } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Get access token from URL hash (Google OAuth returns token in hash)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const error = params.get('error');

      if (error) {
        setStatus('error');
        toast.error('Authentication failed: ' + error);
        setTimeout(() => {
          router.push('/expenses/login');
        }, 3000);
        return;
      }

      if (!accessToken) {
        setStatus('error');
        toast.error('No access token received');
        setTimeout(() => {
          router.push('/expenses/login');
        }, 3000);
        return;
      }

      try {
        // Send access token to Drupal API like the original app
        const response = await fetch('https://dev-expenses-api.pantheonsite.io/user/login/google?_format=json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: accessToken, // Send access_token like the original app
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Drupal response:', data); // Debug log
          
          if (data.current_user) {
            // Use the jwt_token from Drupal response (this is what we need for API calls)
            const token = data.jwt_token;
            
            if (!token) {
              setStatus('error');
              toast.error('No JWT token received from server');
              setTimeout(() => {
                router.push('/expenses/login');
              }, 3000);
              return;
            }
            
            dispatch({
              type: 'LOGIN',
              payload: {
                token: token,
                userDetails: data.current_user,
              },
            });
            setStatus('success');
            toast.success('Login successful!');
            setTimeout(() => {
              router.push('/expenses');
            }, 2000);
          } else {
            setStatus('error');
            toast.error('Authentication failed: ' + (data.errors?.[0] || 'Unknown error'));
            setTimeout(() => {
              router.push('/expenses/login');
            }, 3000);
          }
        } else {
          const errorData = await response.text();
          console.log('Drupal error response:', errorData); // Debug log
          setStatus('error');
          toast.error('Authentication failed');
          setTimeout(() => {
            router.push('/expenses/login');
          }, 3000);
        }
      } catch (error) {
        console.error('Login error:', error); // Debug log
        setStatus('error');
        toast.error('Login failed. Please try again.');
        setTimeout(() => {
          router.push('/expenses/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [dispatch, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <Wallet className="h-8 w-8" />
            <CardTitle className="text-2xl">Authentication</CardTitle>
          </div>
          <CardDescription>
            Processing your login...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p>Completing authentication...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <p className="text-green-600 font-medium">Login successful!</p>
              <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-600" />
              <p className="text-red-600 font-medium">Authentication failed</p>
              <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
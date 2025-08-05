'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Wallet, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');
  const { dispatch } = useAuth();
  const router = useRouter();

  // Set redirect URI on client side only
  useEffect(() => {
    setRedirectUri(`${window.location.origin}/expenses/login/callback`);
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      // Get the current origin for proper redirect URI
      const currentOrigin = window.location.origin;
      const redirectUri = `${currentOrigin}/expenses/login/callback`;
      
      // Real Google OAuth flow - using the same client ID as the original app
      const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
        'client_id=954790461001-2p4vab8hud9u6mj4n6hb6iio4uaiofe5.apps.googleusercontent.com' +
        '&redirect_uri=' + encodeURIComponent(redirectUri) +
        '&response_type=token' + // Changed to 'token' to get access token directly
        '&scope=openid email profile';

      // Redirect to Google OAuth
      window.location.href = googleAuthUrl;

    } catch (error) {
      toast.error('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <Wallet className="h-8 w-8" />
            <CardTitle className="text-2xl">Expenses Tracker</CardTitle>
          </div>
          <CardDescription>
            Sign in with Google to access your expenses dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={handleGoogleLogin} 
              disabled={isLoading} 
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>This will redirect you to Google for authentication</p>
              {redirectUri && (
                <p className="mt-2 text-xs">
                  Redirect URI: {redirectUri}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { User, Settings } from 'lucide-react';
import { currencies } from '@/lib/constants';

export default function UserPage() {
  const { state: authState, dispatch, isInitialized } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authState.userIsLoggedIn && isInitialized) {
      router.push('/expenses/login');
    }
  }, [authState.userIsLoggedIn, isInitialized, router]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authState.userIsLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>User Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={authState.userDetails?.uid || 'N/A'} disabled />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={authState.userDetails?.name || 'N/A'} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={authState.userDetails?.mail || 'N/A'} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={authState.currency} 
                onValueChange={(value) => dispatch({ type: 'UPDATE_SETTINGS', payload: { currency: value } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(currencies).slice(0, 20).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {code} - {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeklyBudget">Weekly Budget</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={authState.weeklyBudget}
                onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { weeklyBudget: e.target.value } })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyBudget">Monthly Budget</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={authState.monthlyBudget}
                onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { monthlyBudget: e.target.value } })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => dispatch({ type: 'LOGOUT' })}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 
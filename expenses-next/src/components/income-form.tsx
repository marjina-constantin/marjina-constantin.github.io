'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TransactionOrIncomeItem } from '@/types';
import { useAuth } from '@/context/auth-context';
import { fetchRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { toApiDateFormat } from '@/lib/utils';

const incomeSchema = z.object({
  field_amount: z.string().min(1, 'Amount is required'),
  field_date: z.string().min(1, 'Date is required'),
  field_description: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

interface IncomeFormProps {
  income?: TransactionOrIncomeItem;
  onSuccess: () => void;
  onCancel: () => void;
}

export const IncomeForm = ({ income, onSuccess, onCancel }: IncomeFormProps) => {
  const { state: authState } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      field_amount: income?.sum || '',
              field_date: income?.dt ? toApiDateFormat(new Date(income.dt)) : toApiDateFormat(new Date()),
      field_description: income?.dsc || '',
    },
  });

  const onSubmit = async (data: IncomeFormData) => {
    setIsSubmitting(true);
    
    const node = {
      type: 'incomes',
      title: [data.field_date],
      field_amount: [data.field_amount],
      field_date: [data.field_date],
      field_description: [data.field_description || ''],
    };

    const url = income
      ? `https://dev-expenses-api.pantheonsite.io/node/${income.id}?_format=json`
      : 'https://dev-expenses-api.pantheonsite.io/node?_format=json';

    const fetchOptions = {
      method: income ? 'PATCH' : 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'JWT-Authorization': `Bearer ${authState.token}`,
      },
      body: JSON.stringify(node),
    };

    try {
      await fetchRequest(url, fetchOptions, () => {}, () => {}, (responseData: any) => {
        if (responseData.nid) {
          toast.success(income ? 'Income updated successfully!' : 'Income added successfully!');
          onSuccess();
        } else {
          toast.error('Something went wrong. Please try again.');
        }
      });
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {income ? 'Edit Income' : 'Add Income'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('field_amount')}
              className={errors.field_amount ? 'border-destructive' : ''}
            />
            {errors.field_amount && (
              <p className="text-sm text-destructive">{errors.field_amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              max={today}
              {...register('field_date')}
              className={errors.field_date ? 'border-destructive' : ''}
            />
            {errors.field_date && (
              <p className="text-sm text-destructive">{errors.field_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description..."
              {...register('field_description')}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {income ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                income ? 'Update Income' : 'Add Income'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TransactionOrIncomeItem } from '@/types';
import { useAuth } from '@/context/auth-context';
import { fetchRequest } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { categories, suggestions } from '@/lib/constants';
import { toApiDateFormat } from '@/lib/utils';

const transactionSchema = z.object({
  field_amount: z.string().min(1, 'Amount is required'),
  field_date: z.string().min(1, 'Date is required'),
  field_category: z.string().min(1, 'Category is required'),
  field_description: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  transaction?: TransactionOrIncomeItem;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TransactionForm = ({ transaction, onSuccess, onCancel }: TransactionFormProps) => {
  const { state: authState } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      field_amount: transaction?.sum || '',
              field_date: transaction?.dt ? toApiDateFormat(new Date(transaction.dt)) : toApiDateFormat(new Date()),
      field_category: transaction?.cat || '',
      field_description: transaction?.dsc || '',
    },
  });

  const watchedCategory = watch('field_category');

  const handleCategoryChange = (value: string) => {
    setValue('field_category', value);
    setCurrentSuggestions(suggestions[value] || []);
    setSelectedSuggestions([]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    const currentDescription = watch('field_description') || '';
    const newDescription = currentDescription ? `${currentDescription} ${suggestion}` : suggestion;
    setValue('field_description', newDescription);
    
    if (!selectedSuggestions.includes(suggestion)) {
      setSelectedSuggestions([...selectedSuggestions, suggestion]);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    
    const node = {
      type: 'transaction',
      title: [data.field_date],
      field_amount: [data.field_amount],
      field_category: [data.field_category],
      field_date: [data.field_date],
      field_description: [data.field_description || ''],
    };

    const url = transaction
      ? `https://dev-expenses-api.pantheonsite.io/node/${transaction.id}?_format=json`
      : 'https://dev-expenses-api.pantheonsite.io/node?_format=json';

    const fetchOptions = {
      method: transaction ? 'PATCH' : 'POST',
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
          toast.success(transaction ? 'Transaction updated successfully!' : 'Transaction added successfully!');
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
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
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
            <Label htmlFor="category">Category *</Label>
            <Select value={watchedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className={errors.field_category ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.slice(1).map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.field_category && (
              <p className="text-sm text-destructive">{errors.field_category.message}</p>
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

          {currentSuggestions.length > 0 && (
            <div className="space-y-2">
              <Label>Suggestions</Label>
              <div className="flex flex-wrap gap-2">
                {currentSuggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant={selectedSuggestions.includes(suggestion) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {transaction ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                transaction ? 'Update Transaction' : 'Add Transaction'
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
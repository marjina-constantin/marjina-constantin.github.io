'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { fetchData } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X } from 'lucide-react';
import { categories } from '@/lib/constants';

export const Filters = () => {
  const { state: authState } = useAuth();
  const { state: dataState, dispatch: dataDispatch } = useData();
  const [category, setCategory] = useState(dataState.category || 'all');
  const [textFilter, setTextFilter] = useState(dataState.textFilter || '');

  useEffect(() => {
    setCategory(dataState.category || 'all');
    setTextFilter(dataState.textFilter || '');
  }, [dataState.category, dataState.textFilter]);

  const handleApplyFilters = () => {
    if (authState.token) {
      const categoryFilter = category === 'all' ? '' : category;
      fetchData(authState.token, dataDispatch, () => {}, categoryFilter, textFilter);
    }
  };

  const handleClearFilters = () => {
    setCategory('all');
    setTextFilter('');
    if (authState.token) {
      fetchData(authState.token, dataDispatch, () => {}, '', '');
    }
  };

  const hasActiveFilters = category || textFilter;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">
                  All Categories
                </SelectItem>
                {categories.slice(1).map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-filter">Search Description</Label>
            <Input
              id="text-filter"
              placeholder="Search in descriptions..."
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleApplyFilters} className="flex-1">
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Active filters:</span>
            {category && category !== 'all' && (
              <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                Category: {categories.find(c => c.value === category)?.label}
              </span>
            )}
            {textFilter && (
              <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                Search: "{textFilter}"
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
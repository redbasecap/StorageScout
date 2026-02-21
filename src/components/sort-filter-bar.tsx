'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, Search, X } from 'lucide-react';

export type SortField = 'name' | 'date' | 'location';
export type SortDirection = 'asc' | 'desc';

type SortFilterBarProps = {
  sortField: SortField;
  sortDirection: SortDirection;
  filterText: string;
  onSortFieldChange: (field: SortField) => void;
  onSortDirectionToggle: () => void;
  onFilterTextChange: (text: string) => void;
  itemCount?: number;
};

export default function SortFilterBar({
  sortField,
  sortDirection,
  filterText,
  onSortFieldChange,
  onSortDirectionToggle,
  onFilterTextChange,
  itemCount,
}: SortFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Filter items..."
          className="pl-9 pr-9"
          value={filterText}
          onChange={(e) => onFilterTextChange(e.target.value)}
        />
        {filterText && (
          <button
            onClick={() => onFilterTextChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <Select value={sortField} onValueChange={(v) => onSortFieldChange(v as SortField)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="location">Location</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={onSortDirectionToggle} title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}>
          <ArrowUpDown className={`h-4 w-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
        </Button>
      </div>
      {itemCount !== undefined && (
        <p className="text-sm text-muted-foreground self-center whitespace-nowrap">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export type DateRange = {
  from: Date;
  to: Date;
  label: string;
};

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange) => void;
  currentRange: DateRange;
}

export const DateRangeFilter = ({ onRangeChange, currentRange }: DateRangeFilterProps) => {
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const presetRanges = [
    {
      label: 'Last 24 Hours',
      value: 'last_24h',
      range: {
        from: subDays(new Date(), 1),
        to: new Date(),
        label: 'Last 24 Hours'
      }
    },
    {
      label: 'Last 7 Days',
      value: 'last_7d',
      range: {
        from: subDays(new Date(), 7),
        to: new Date(),
        label: 'Last 7 Days'
      }
    },
    {
      label: 'Last 30 Days',
      value: 'last_30d',
      range: {
        from: subDays(new Date(), 30),
        to: new Date(),
        label: 'Last 30 Days'
      }
    },
    {
      label: 'Last 90 Days',
      value: 'last_90d',
      range: {
        from: subDays(new Date(), 90),
        to: new Date(),
        label: 'Last 90 Days'
      }
    }
  ];

  const handlePresetSelect = (value: string) => {
    const preset = presetRanges.find(p => p.value === value);
    if (preset) {
      onRangeChange(preset.range);
    }
  };

  const handleCustomRangeApply = () => {
    if (customRange.from && customRange.to) {
      onRangeChange({
        from: startOfDay(customRange.from),
        to: endOfDay(customRange.to),
        label: `${format(customRange.from, 'MMM dd')} - ${format(customRange.to, 'MMM dd')}`
      });
      setCustomDateOpen(false);
    }
  };

  const isPresetSelected = (value: string) => {
    const preset = presetRanges.find(p => p.value === value);
    return preset && preset.range.label === currentRange.label;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Time Range:</span>
        <Badge variant="outline" className="font-normal">
          {currentRange.label}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Preset Range Selector */}
        <Select onValueChange={handlePresetSelect}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {presetRanges.map((preset) => (
              <SelectItem 
                key={preset.value} 
                value={preset.value}
                className={isPresetSelected(preset.value) ? 'bg-accent' : ''}
              >
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Custom Date Range */}
        <Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Custom Range
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-4">
              <div className="text-sm font-medium">Select Custom Date Range</div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <CalendarComponent
                    mode="single"
                    selected={customRange.from}
                    onSelect={(date) => setCustomRange(prev => ({ ...prev, from: date }))}
                    className="rounded-md border"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <CalendarComponent
                    mode="single"
                    selected={customRange.to}
                    onSelect={(date) => setCustomRange(prev => ({ ...prev, to: date }))}
                    className="rounded-md border"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCustomDateOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleCustomRangeApply}
                  disabled={!customRange.from || !customRange.to}
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Real-time indicator */}
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-600 rounded-md border border-green-500/20">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">Live</span>
        </div>
      </div>
    </div>
  );
};
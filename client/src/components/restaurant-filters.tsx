import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, MapPin, UtensilsCrossed } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { WaitStatus } from '@shared/schema';

export type FilterType = 'waitTime' | 'cuisine' | 'nearMe';

export interface FilterState {
  waitTime: WaitStatus | null;
  cuisine: string | null;
  nearMe: boolean;
}

interface RestaurantFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  availableCuisines: string[];
}

export const RestaurantFilters = ({
  onFilterChange,
  availableCuisines
}: RestaurantFiltersProps) => {
  const isMobile = useIsMobile();
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    waitTime: null,
    cuisine: null,
    nearMe: false
  });
  
  const [showWaitTimeOptions, setShowWaitTimeOptions] = useState(false);
  const [showCuisineOptions, setShowCuisineOptions] = useState(false);

  const handleWaitTimeFilter = (waitTime: WaitStatus | null) => {
    const newFilters = {
      ...activeFilters,
      waitTime: activeFilters.waitTime === waitTime ? null : waitTime
    };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
    setShowWaitTimeOptions(false);
  };

  const handleCuisineFilter = (cuisine: string | null) => {
    const newFilters = {
      ...activeFilters,
      cuisine: activeFilters.cuisine === cuisine ? null : cuisine
    };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
    setShowCuisineOptions(false);
  };

  const handleNearMeFilter = () => {
    const newFilters = {
      ...activeFilters,
      nearMe: !activeFilters.nearMe
    };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const getWaitTimeLabel = (waitTime: WaitStatus | null): string => {
    switch (waitTime) {
      case 'available': return 'No Wait';
      case 'short': return 'Short Wait';
      case 'long': return 'Long Wait';
      case 'very_long': return 'Very Long Wait';
      case 'closed': return 'Closed';
      default: return 'Wait Time';
    }
  };

  const clearAllFilters = () => {
    const newFilters = {
      waitTime: null,
      cuisine: null,
      nearMe: false
    };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const hasActiveFilters = activeFilters.waitTime !== null || 
                          activeFilters.cuisine !== null || 
                          activeFilters.nearMe;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 mb-2">
        <div className="relative">
          <Button
            variant={activeFilters.waitTime ? "default" : "outline"}
            size="sm"
            onClick={() => setShowWaitTimeOptions(!showWaitTimeOptions)}
            className="flex items-center gap-1"
          >
            <Clock className="h-4 w-4" />
            {getWaitTimeLabel(activeFilters.waitTime)}
          </Button>
          
          {showWaitTimeOptions && (
            <div className="absolute z-10 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200">
              <div className="p-2 space-y-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => handleWaitTimeFilter('available')}
                >
                  {activeFilters.waitTime === 'available' && <span className="mr-2">✓</span>}
                  No Wait
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => handleWaitTimeFilter('short')}
                >
                  {activeFilters.waitTime === 'short' && <span className="mr-2">✓</span>}
                  Short Wait
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => handleWaitTimeFilter('long')}
                >
                  {activeFilters.waitTime === 'long' && <span className="mr-2">✓</span>}
                  Long Wait
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <Button
            variant={activeFilters.cuisine ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCuisineOptions(!showCuisineOptions)}
            className="flex items-center gap-1"
          >
            <UtensilsCrossed className="h-4 w-4" />
            {activeFilters.cuisine || "Cuisine"}
          </Button>
          
          {showCuisineOptions && (
            <div className="absolute z-10 mt-1 w-48 max-h-60 overflow-y-auto bg-white rounded-md shadow-lg border border-gray-200">
              <div className="p-2 space-y-1">
                {availableCuisines.map(cuisine => (
                  <Button 
                    key={cuisine}
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleCuisineFilter(cuisine)}
                  >
                    {activeFilters.cuisine === cuisine && <span className="mr-2">✓</span>}
                    {cuisine}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <Button
          variant={activeFilters.nearMe ? "default" : "outline"}
          size="sm"
          onClick={handleNearMeFilter}
          className="flex items-center gap-1"
        >
          <MapPin className="h-4 w-4" />
          Near Me
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="ml-auto text-sm"
          >
            Clear All
          </Button>
        )}
      </div>
      
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-2">
          {activeFilters.waitTime && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getWaitTimeLabel(activeFilters.waitTime)}
              <span 
                className="ml-1 cursor-pointer" 
                onClick={() => handleWaitTimeFilter(null)}
              >
                ×
              </span>
            </Badge>
          )}
          
          {activeFilters.cuisine && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <UtensilsCrossed className="h-3 w-3" />
              {activeFilters.cuisine}
              <span 
                className="ml-1 cursor-pointer" 
                onClick={() => handleCuisineFilter(null)}
              >
                ×
              </span>
            </Badge>
          )}
          
          {activeFilters.nearMe && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Near Me
              <span 
                className="ml-1 cursor-pointer" 
                onClick={handleNearMeFilter}
              >
                ×
              </span>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
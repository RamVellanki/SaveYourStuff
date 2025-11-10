import { useEffect, useState } from 'react';
import { tagApi, categoryApi, bookmarkApi } from '../api';
import { Tag, Category } from '../types';

interface FilterPanelProps {
  onFilterChange: (filters: { tags?: string[]; category?: string; startDate?: string; endDate?: string }) => void;
  selectedTags?: string[];
  selectedCategory?: string;
  selectedStartDate?: string;
  selectedEndDate?: string;
}

export const FilterPanel = ({ onFilterChange, selectedTags = [], selectedCategory, selectedStartDate, selectedEndDate }: FilterPanelProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ min: string; max: string } | null>(null);
  const [sliderValues, setSliderValues] = useState<[number, number]>([0, 100]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Try to fetch tags first, fallback to categories
        try {
          const tagsResult = await tagApi.getAll();
          setTags(tagsResult);
          console.log('Loaded tags:', tagsResult);
        } catch (tagError) {
          console.warn('Failed to load tags, trying categories:', tagError);
          // Fallback to categories if tags API fails
          const categoriesResult = await categoryApi.getAll();
          setCategories(categoriesResult);
          console.log('Loaded categories as fallback:', categoriesResult);
        }

        // Fetch bookmarks to determine date range for sliders
        try {
          const bookmarksResult = await bookmarkApi.getAll({ limit: 1000 }); // Get a large sample
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          
          if (bookmarksResult.length > 0) {
            const dates = bookmarksResult.map(b => new Date(b.created_at)).sort((a, b) => a.getTime() - b.getTime());
            const minDate = dates[0].toISOString().split('T')[0];
            // Always use today as max date to allow filtering up to current date
            setDateRange({ min: minDate, max: today });
          } else {
            // Default to last 30 days if no bookmarks
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            setDateRange({ 
              min: thirtyDaysAgo.toISOString().split('T')[0], 
              max: today 
            });
          }
        } catch (bookmarkError) {
          console.warn('Failed to load bookmarks for date range:', bookmarkError);
          // Default to last 30 days
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          setDateRange({ 
            min: thirtyDaysAgo.toISOString().split('T')[0], 
            max: now.toISOString().split('T')[0] 
          });
        }
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTagToggle = (tagName: string) => {
    const newSelectedTags = selectedTags.includes(tagName)
      ? selectedTags.filter(tag => tag !== tagName)
      : [...selectedTags, tagName];
    
    onFilterChange({ tags: newSelectedTags.length > 0 ? newSelectedTags : undefined });
  };

  const handleSelectAllTags = () => {
    const allTagNames = tags.length > 0 
      ? tags.map(tag => tag.name) 
      : categories.map(category => category.name);
    onFilterChange({ tags: allTagNames });
  };

  const handleClearAllTags = () => {
    onFilterChange({ tags: undefined });
  };

  const handleCategorySelect = (category?: string) => {
    onFilterChange({ category, tags: undefined }); // Clear tags when selecting category
  };

  // Convert slider percentage to actual date
  const sliderToDate = (percentage: number): string => {
    if (!dateRange) return '';
    const minTime = new Date(dateRange.min).getTime();
    const maxTime = new Date(dateRange.max).getTime();
    const timeRange = maxTime - minTime;
    const targetTime = minTime + (timeRange * percentage / 100);
    return new Date(targetTime).toISOString().split('T')[0];
  };

  // Convert date to slider percentage
  const dateToSlider = (date: string): number => {
    if (!dateRange || !date) return 0;
    const minTime = new Date(dateRange.min).getTime();
    const maxTime = new Date(dateRange.max).getTime();
    const targetTime = new Date(date).getTime();
    const timeRange = maxTime - minTime;
    if (timeRange === 0) return 0;
    return Math.round(((targetTime - minTime) / timeRange) * 100);
  };

  // Update slider values when selected dates change
  useEffect(() => {
    if (dateRange) {
      const startValue = selectedStartDate ? dateToSlider(selectedStartDate) : 0;
      const endValue = selectedEndDate ? dateToSlider(selectedEndDate) : 100;
      setSliderValues([startValue, endValue]);
    }
  }, [selectedStartDate, selectedEndDate, dateRange]);

  const handleSliderChange = (values: [number, number]) => {
    setSliderValues(values);
    const [startPercentage, endPercentage] = values;
    
    // Only apply filter if we have moved from the default full range
    const startDate = startPercentage > 0 ? sliderToDate(startPercentage) : undefined;
    const endDate = endPercentage < 100 ? sliderToDate(endPercentage) : undefined;
    
    onFilterChange({ 
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      category: selectedCategory,
      startDate,
      endDate
    });
  };

  const clearDateFilters = () => {
    setSliderValues([0, 100]);
    onFilterChange({ 
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      category: selectedCategory,
      startDate: undefined,
      endDate: undefined
    });
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const hasFilters = selectedTags.length > 0 || selectedCategory || selectedStartDate || selectedEndDate;

  if (loading) {
    return (
      <div className="filter-panel">
        <div className="loading">Loading filters...</div>
      </div>
    );
  }

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>Filters</h3>
        {hasFilters && (
          <button className="clear-filters-btn" onClick={clearAllFilters}>
            Clear All
          </button>
        )}
      </div>

      {/* Tags Section */}
      <div className="filter-section">
        <div className="filter-section-header">
          <h4>Tags</h4>
          {(tags.length > 0 || categories.length > 0) && (
            <div className="tag-controls">
              {selectedTags.length > 0 ? (
                <button 
                  className="tag-control-btn clear" 
                  onClick={handleClearAllTags}
                  type="button"
                >
                  Clear All
                </button>
              ) : (
                <button 
                  className="tag-control-btn select" 
                  onClick={handleSelectAllTags}
                  type="button"
                >
                  Select All
                </button>
              )}
            </div>
          )}
        </div>
        <div className="tags-chip-container">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <button
                key={tag.id}
                className={`tag-chip ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                onClick={() => handleTagToggle(tag.name)}
                type="button"
              >
                {tag.name}
              </button>
            ))
          ) : categories.length > 0 ? (
            // Show categories as chips if no tags are available
            categories.map((category) => (
              <button
                key={category.id}
                className={`tag-chip ${selectedTags.includes(category.name) ? 'selected' : ''}`}
                onClick={() => handleTagToggle(category.name)}
                type="button"
              >
                {category.name}
              </button>
            ))
          ) : (
            <p className="no-tags">No tags available</p>
          )}
        </div>
      </div>

      {/* Date Filter Section */}
      {dateRange && (
        <div className="filter-section">
          <div className="filter-section-header">
            <h4>Date Range</h4>
            {(selectedStartDate || selectedEndDate) && (
              <button 
                className="tag-control-btn clear" 
                onClick={clearDateFilters}
                type="button"
              >
                Clear Dates
              </button>
            )}
          </div>
          <div className="date-range-slider">
            <div className="date-range-labels">
              <span className="date-label">{dateRange.min}</span>
              <span className="date-label">{dateRange.max}</span>
            </div>
            <div 
              className="slider-container"
              style={{
                '--range-left': `${sliderValues[0]}%`,
                '--range-right': `${100 - sliderValues[1]}%`
              } as React.CSSProperties}
            >
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValues[0]}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  if (newValue <= sliderValues[1]) {
                    handleSliderChange([newValue, sliderValues[1]]);
                  }
                }}
                className={`range-slider range-slider-left ${sliderValues[0] > sliderValues[1] - 5 ? 'higher' : ''}`}
                style={{ zIndex: sliderValues[0] > sliderValues[1] - 5 ? 3 : 1 }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValues[1]}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  if (newValue >= sliderValues[0]) {
                    handleSliderChange([sliderValues[0], newValue]);
                  }
                }}
                className="range-slider range-slider-right"
                style={{ zIndex: 2 }}
              />
            </div>
            {(selectedStartDate || selectedEndDate) && (
              <div className="selected-date-range">
                <span className="selected-date">
                  {selectedStartDate ? sliderToDate(sliderValues[0]) : dateRange.min}
                </span>
                <span className="to-label">to</span>
                <span className="selected-date">
                  {selectedEndDate ? sliderToDate(sliderValues[1]) : dateRange.max}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Section (only show if we have both tags and categories) */}
      {categories.length > 0 && tags.length > 0 && (
        <div className="filter-section">
          <h4>Categories (Legacy)</h4>
          <div className="category-list">
            <button
              className={`category-button ${!selectedCategory ? 'active' : ''}`}
              onClick={() => handleCategorySelect(undefined)}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-button ${selectedCategory === category.name ? 'active' : ''}`}
                onClick={() => handleCategorySelect(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="active-filters">
          <h4>Active Filters</h4>
          <div className="active-filters-list">
            {selectedTags.map(tag => (
              <span key={tag} className="active-filter-tag">
                {tag}
                <button 
                  className="remove-filter"
                  onClick={() => handleTagToggle(tag)}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedCategory && (
              <span className="active-filter-tag">
                {selectedCategory}
                <button 
                  className="remove-filter"
                  onClick={() => handleCategorySelect(undefined)}
                >
                  ×
                </button>
              </span>
            )}
            {(selectedStartDate || selectedEndDate) && (
              <span className="active-filter-tag">
                {selectedStartDate && selectedEndDate 
                  ? `${selectedStartDate} to ${selectedEndDate}`
                  : selectedStartDate 
                    ? `From: ${selectedStartDate}`
                    : `To: ${selectedEndDate}`
                }
                <button 
                  className="remove-filter"
                  onClick={clearDateFilters}
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

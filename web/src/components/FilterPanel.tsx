import { useEffect, useState } from 'react';
import { tagApi, categoryApi } from '../api';
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

  const handleDateRangeChange = (startDate?: string, endDate?: string) => {
    onFilterChange({ 
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      category: selectedCategory,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
  };

  const handleStartDateChange = (date: string) => {
    handleDateRangeChange(date, selectedEndDate);
  };

  const handleEndDateChange = (date: string) => {
    handleDateRangeChange(selectedStartDate, date);
  };

  const clearDateFilters = () => {
    handleDateRangeChange(undefined, undefined);
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
        <div className="date-filters">
          <div className="date-filter-group">
            <label htmlFor="start-date">From:</label>
            <input
              id="start-date"
              type="date"
              value={selectedStartDate || ''}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="date-filter-group">
            <label htmlFor="end-date">To:</label>
            <input
              id="end-date"
              type="date"
              value={selectedEndDate || ''}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="date-input"
            />
          </div>
        </div>
      </div>

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
                {selectedStartDate && selectedEndDate && selectedStartDate === selectedEndDate
                  ? `On: ${selectedStartDate}`
                  : selectedStartDate && selectedEndDate 
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

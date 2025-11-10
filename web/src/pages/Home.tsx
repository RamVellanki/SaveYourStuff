import { useState, useEffect, useCallback } from 'react';
import { BookmarkCard } from '../components/BookmarkCard';
import { FilterPanel } from '../components/FilterPanel';
import { InfiniteScroll } from '../components/InfiniteScroll';
import { useBookmarks } from '../hooks/useBookmarks';
import { BookmarkFilters } from '../types';

export const Home = () => {
  const [filters, setFilters] = useState<BookmarkFilters>({
    limit: 20,
    offset: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const { bookmarks, loading, error, refetch } = useBookmarks(filters);
  const [hasMore, setHasMore] = useState(true);

  const handleFilterChange = (filterUpdates: { tags?: string[]; category?: string; startDate?: string; endDate?: string }) => {
    const newFilters = {
      ...filters,
      ...filterUpdates,
      offset: 0, // Reset pagination when filters change
    };
    setFilters(newFilters);
    refetch(newFilters);
  };

  const handleTagClick = (tag: string) => {
    // Add tag to current filters if not already selected
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tag)) {
      handleFilterChange({ tags: [...currentTags, tag] });
    }
  };

  // Debounced search handler
  const debouncedSearch = useCallback((query: string) => {
    setFilters(prevFilters => {
      const newFilters = {
        ...prevFilters,
        search: query || undefined,
        offset: 0, // Reset pagination when search changes
      };
      refetch(newFilters);
      return newFilters;
    });
  }, [refetch]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, debouncedSearch]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleLoadMore = () => {
    if (bookmarks.length < (filters.limit || 20)) {
      setHasMore(false);
      return;
    }

    const newFilters = {
      ...filters,
      offset: (filters.offset || 0) + (filters.limit || 20),
    };
    setFilters(newFilters);
    refetch(newFilters);
  };

  // Group bookmarks by date
  const groupBookmarksByDate = (bookmarks: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    bookmarks.forEach(bookmark => {
      const date = new Date(bookmark.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(bookmark);
    });
    
    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(groups).sort((a, b) => {
      const dateA = new Date(groups[a][0].created_at);
      const dateB = new Date(groups[b][0].created_at);
      return dateB.getTime() - dateA.getTime();
    });
    
    return sortedDates.map(date => ({
      date,
      bookmarks: groups[date].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }));
  };

  const groupedBookmarks = groupBookmarksByDate(bookmarks);

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="home-page">
      <div className="sidebar">
        <FilterPanel
          onFilterChange={handleFilterChange}
          selectedTags={filters.tags}
          selectedCategory={filters.category}
          selectedStartDate={filters.startDate}
          selectedEndDate={filters.endDate}
        />
      </div>

      <div className="main-content">
        <div className="content-header">
          <h1>My Bookmarks</h1>
          <div className="inline-search">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="search-input-inline"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="clear-search-btn"
                  type="button"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
          </div>
        </div>

        {loading && bookmarks.length === 0 ? (
          <div className="loading">Loading bookmarks...</div>
        ) : bookmarks.length === 0 ? (
          <div className="empty-state">
            <p>No bookmarks yet. Add some using the browser extension!</p>
          </div>
        ) : (
          <InfiniteScroll
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loading={loading}
          >
            <div className="bookmarks-timeline">
              {groupedBookmarks.map((group) => (
                <div key={group.date} className="date-group">
                  <div className="date-header">
                    <h2 className="date-title">{group.date}</h2>
                    <span className="bookmark-count">{group.bookmarks.length} bookmark{group.bookmarks.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="bookmarks-list">
                    {group.bookmarks.map((bookmark) => (
                      <BookmarkCard 
                        key={bookmark.id} 
                        bookmark={bookmark} 
                        onTagClick={handleTagClick}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
};

import { useState } from 'react';
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
        <h1>My Bookmarks</h1>

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
            <div className="bookmarks-grid">
              {bookmarks.map((bookmark) => (
                <BookmarkCard 
                  key={bookmark.id} 
                  bookmark={bookmark} 
                  onTagClick={handleTagClick}
                />
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
};

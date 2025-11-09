import { useState, useCallback } from 'react';
import { SearchBar } from '../components/SearchBar';
import { BookmarkCard } from '../components/BookmarkCard';
import { bookmarkApi } from '../api';
import { Bookmark, BookmarkFilters } from '../types';

export const Search = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setBookmarks([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const filters: BookmarkFilters = {
        limit: 50,
        offset: 0,
        category: undefined,
      };
      const result = await bookmarkApi.search(query, filters);
      setBookmarks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="search-page">
      <h1>Search Bookmarks</h1>

      <SearchBar onSearch={handleSearch} />

      {error && <div className="error-message">Error: {error}</div>}

      {loading ? (
        <div className="loading">Searching...</div>
      ) : searchQuery && bookmarks.length === 0 ? (
        <div className="empty-state">
          <p>No bookmarks found for "{searchQuery}"</p>
        </div>
      ) : (
        <div className="bookmarks-grid">
          {bookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
      )}
    </div>
  );
};

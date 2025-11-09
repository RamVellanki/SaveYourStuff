import { useState, useCallback } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState('');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      // Debounce search
      const timeoutId = setTimeout(() => {
        onSearch(value);
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [onSearch]
  );

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search bookmarks..."
        value={query}
        onChange={handleChange}
        className="search-input"
      />
    </div>
  );
};

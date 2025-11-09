import { formatDistanceToNow } from 'date-fns';
import { Bookmark } from '../types';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onTagClick?: (tag: string) => void;
}

export const BookmarkCard = ({ bookmark, onTagClick }: BookmarkCardProps) => {
  const openBookmark = () => {
    window.open(bookmark.url, '_blank');
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation(); // Prevent opening the bookmark
    onTagClick?.(tag);
  };

  // Use tags if available, fallback to category for backward compatibility
  const displayTags = bookmark.tags || (bookmark.category ? [bookmark.category] : []);

  return (
    <div className="bookmark-card" onClick={openBookmark}>
      <div className="bookmark-header">
        <h3>{bookmark.title}</h3>
        {displayTags.length > 0 && (
          <div className="tags-container">
            {displayTags.map((tag, index) => (
              <span 
                key={index}
                className={`tag-badge ${onTagClick ? 'clickable' : ''}`}
                onClick={onTagClick ? (e) => handleTagClick(e, tag) : undefined}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {bookmark.summary && (
        <p className="bookmark-summary">{bookmark.summary}</p>
      )}

      <div className="bookmark-footer">
        <span className="bookmark-url">{getDomain(bookmark.url)}</span>
        <span className="bookmark-date">
          {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};

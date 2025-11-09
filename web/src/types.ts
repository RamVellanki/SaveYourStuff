// Shared TypeScript Types for Web App

export interface User {
  id: string;
  email: string;
  created_at: string;
  name?: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  summary?: string;
  category?: string; // Kept for backward compatibility during migration
  tags?: string[]; // New tags array
  created_at: string;
}

export interface CreateBookmarkDto {
  url: string;
  title: string;
  summary?: string;
  category?: string; // Kept for backward compatibility
  tags?: string[]; // New tags array
}

export interface UpdateBookmarkDto {
  title?: string;
  summary?: string;
  category?: string; // Kept for backward compatibility
  tags?: string[]; // New tags array
}

export interface BookmarkFilters {
  search?: string;
  category?: string; // Kept for backward compatibility
  tags?: string[]; // New tags array filtering
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Renamed from Category to Tag for clarity
export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// Kept Category interface for backward compatibility during migration
export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// New interface for bookmark-tag relationships
export interface BookmarkTag {
  id: string;
  bookmark_id: string;
  tag_id: string;
  created_at: string;
}

// Enhanced bookmark interface with populated tags
export interface BookmarkWithTags extends Omit<Bookmark, 'tags'> {
  tags: Tag[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// UI-specific interfaces
export interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export interface TagDisplayProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
  onTagRemove?: (tag: string) => void;
  variant?: 'default' | 'clickable' | 'removable';
}

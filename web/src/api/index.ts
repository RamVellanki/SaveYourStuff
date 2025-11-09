import axios from 'axios';
import { 
  Bookmark, 
  CreateBookmarkDto, 
  BookmarkFilters, 
  Category, 
  Tag, 
  ApiResponse 
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': import.meta.env.VITE_USER_ID || 'test-user-123',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const bookmarkApi = {
  create: async (data: CreateBookmarkDto): Promise<Bookmark> => {
    const response = await api.post<ApiResponse<Bookmark>>('/bookmarks', data);
    return response.data.data!;
  },

  getAll: async (filters?: BookmarkFilters): Promise<Bookmark[]> => {
    // Handle tags array in filters
    const params: any = { ...filters };
    if (filters?.tags && Array.isArray(filters.tags)) {
      params.tags = filters.tags.join(',');
    }
    
    const response = await api.get<ApiResponse<Bookmark[]>>('/bookmarks', { params });
    return response.data.data || [];
  },

  getById: async (id: string): Promise<Bookmark> => {
    const response = await api.get<ApiResponse<Bookmark>>(`/bookmarks/${id}`);
    return response.data.data!;
  },

  updateTags: async (id: string, tags: string[]): Promise<Bookmark> => {
    const response = await api.put<ApiResponse<Bookmark>>(`/bookmarks/${id}/tags`, { tags });
    return response.data.data!;
  },

  search: async (query: string, filters?: Partial<BookmarkFilters>): Promise<Bookmark[]> => {
    const params: any = { search: query, ...filters };
    if (filters?.tags && Array.isArray(filters.tags)) {
      params.tags = filters.tags.join(',');
    }
    
    const response = await api.get<ApiResponse<Bookmark[]>>('/bookmarks', { params });
    return response.data.data || [];
  },
};

export const tagApi = {
  getAll: async (search?: string): Promise<Tag[]> => {
    const params = search ? { search } : {};
    const response = await api.get<ApiResponse<Tag[]>>('/tags', { params });
    return response.data.data || [];
  },

  create: async (name: string): Promise<Tag> => {
    const response = await api.post<ApiResponse<Tag>>('/tags', { name });
    return response.data.data!;
  },

  update: async (id: string, name: string): Promise<Tag> => {
    const response = await api.put<ApiResponse<Tag>>(`/tags/${id}`, { name });
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tags/${id}`);
  },

  getStats: async (): Promise<Array<{ tag: Tag; count: number }>> => {
    const response = await api.get<ApiResponse<Array<{ tag: Tag; count: number }>>>('/tags/stats');
    return response.data.data || [];
  },

  getPopular: async (limit?: number): Promise<Array<{ tag: Tag; count: number }>> => {
    const params = limit ? { limit } : {};
    const response = await api.get<ApiResponse<Array<{ tag: Tag; count: number }>>>('/tags/popular', { params });
    return response.data.data || [];
  },

  search: async (query: string): Promise<Tag[]> => {
    const response = await api.get<ApiResponse<Tag[]>>('/tags', { params: { search: query } });
    return response.data.data || [];
  },
};

// Keep categoryApi for backward compatibility during migration
export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data.data || [];
  },

  create: async (name: string): Promise<Category> => {
    const response = await api.post<ApiResponse<Category>>('/categories', { name });
    return response.data.data!;
  },
};

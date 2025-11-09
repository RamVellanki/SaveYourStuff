import { useEffect, useRef, ReactNode } from 'react';

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  children: ReactNode;
}

export const InfiniteScroll = ({ onLoadMore, hasMore, loading, children }: InfiniteScrollProps) => {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, onLoadMore]);

  return (
    <div>
      {children}
      {hasMore && (
        <div ref={observerRef} className="loading-trigger">
          {loading && <div className="loading-spinner">Loading...</div>}
        </div>
      )}
    </div>
  );
};

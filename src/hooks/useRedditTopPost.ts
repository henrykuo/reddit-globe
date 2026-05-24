import { useEffect, useRef, useState } from 'react';

export interface RedditPost {
  title: string;
  thumbnail: string;
  url: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
}

interface UseRedditTopPostResult {
  post: RedditPost | null;
  loading: boolean;
  error: string | null;
}

// Cache to store fetched posts (5 minute TTL)
const postCache = new Map<string, { post: RedditPost | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Track ongoing requests to prevent duplicates
const ongoingRequests = new Map<string, Promise<RedditPost | null>>();

/**
 * Clear the post cache (useful for debugging or forcing fresh data)
 * Can be called from browser console: window.clearRedditCache()
 */
export function clearRedditCache() {
  postCache.clear();
  console.log('Reddit post cache cleared');
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).clearRedditCache = clearRedditCache;
}

/**
 * Custom hook to fetch the top post from a subreddit
 * Uses Reddit's JSON API (no authentication required)
 * Implements caching and debouncing to respect rate limits
 */
export function useRedditTopPost(subreddit: string, enabled: boolean = true): UseRedditTopPostResult {
  const [post, setPost] = useState<RedditPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !subreddit) {
      return;
    }

    let cancelled = false;

    // Check cache first
    const cached = postCache.get(subreddit);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setPost(cached.post);
      setLoading(false);
      setError(null);
      return;
    }

    // Debounce: wait 300ms before fetching
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      const fetchTopPost = async () => {
        setLoading(true);
        setError(null);

        // Check if there's already an ongoing request for this subreddit
        const existingRequest = ongoingRequests.get(subreddit);
        if (existingRequest) {
          try {
            const result = await existingRequest;
            if (!cancelled) {
              setPost(result);
              setLoading(false);
            }
          } catch (err) {
            if (!cancelled) {
              setError('Failed to fetch post');
              setLoading(false);
            }
          }
          return;
        }

        // Create new request
        const requestPromise = (async () => {
          try {
            // Use a CORS proxy to bypass Reddit's CORS restrictions
            const proxyUrl = 'https://corsproxy.io/?';
            // Fetch top 10 posts to find first non-stickied post
            const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`;
            
            const response = await fetch(
              `${proxyUrl}${encodeURIComponent(redditUrl)}`,
              {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                },
              }
            );

            if (!response.ok) {
              // Handle specific HTTP status codes with user-friendly messages
              if (response.status === 403) {
                throw new Error('Unable to access subreddit');
              } else if (response.status === 404) {
                throw new Error('Subreddit not found');
              } else if (response.status === 429) {
                throw new Error('Rate limited, try again later');
              } else {
                throw new Error(`Failed to fetch: ${response.status}`);
              }
            }

            const data = await response.json();

            if (data.data?.children?.length > 0) {
              // Filter out stickied posts and common recurring threads
              const validPost = data.data.children.find((child: any) => {
                const postData = child.data;
                
                // Skip stickied posts
                if (postData.stickied) {
                  return false;
                }
                
                // Skip common recurring thread patterns (case-insensitive)
                const title = postData.title.toLowerCase();
                const recurringPatterns = [
                  'daily discussion',
                  'weekly discussion',
                  'monthly discussion',
                  'daily thread',
                  'weekly thread',
                  'monthly thread',
                  'megathread',
                  'general discussion',
                  'random discussion',
                  'casual conversation',
                  'what are you',
                  'rant thread',
                  'tourist',
                  'moving to',
                  'visiting',
                ];
                
                return !recurringPatterns.some(pattern => title.includes(pattern));
              });

              if (validPost) {
                const postData = validPost.data;
                
                // Get thumbnail or preview image
                let imageUrl = '';
                
                // Try to get the best quality image
                if (postData.preview?.images?.[0]?.source?.url) {
                  // Use preview image (higher quality)
                  imageUrl = postData.preview.images[0].source.url.replace(/&amp;/g, '&');
                } else if (postData.is_gallery && postData.media_metadata && postData.gallery_data?.items?.length > 0) {
                  // Gallery post — use the first gallery image
                  const firstItemId = postData.gallery_data.items[0].media_id;
                  const meta = postData.media_metadata[firstItemId];
                  if (meta?.s?.u) {
                    imageUrl = meta.s.u.replace(/&amp;/g, '&');
                  } else if (meta?.s?.gif) {
                    imageUrl = meta.s.gif.replace(/&amp;/g, '&');
                  }
                } else if (postData.thumbnail && 
                           postData.thumbnail.startsWith('http') &&
                           postData.thumbnail !== 'https://www.redditstatic.com/desktop2x/img/renderTimingPixel.png' &&
                           postData.thumbnail !== 'self' &&
                           postData.thumbnail !== 'default' &&
                           postData.thumbnail !== 'nsfw' &&
                           postData.thumbnail !== 'spoiler') {
                  // Use thumbnail if preview not available
                  imageUrl = postData.thumbnail;
                }

                const fetchedPost: RedditPost = {
                  title: postData.title,
                  thumbnail: imageUrl,
                  url: postData.permalink ? `https://www.reddit.com${postData.permalink}` : `https://www.reddit.com/r/${subreddit}`,
                  author: postData.author,
                  score: postData.score,
                  num_comments: postData.num_comments,
                  created_utc: postData.created_utc,
                };

                // Cache the result
                postCache.set(subreddit, {
                  post: fetchedPost,
                  timestamp: Date.now(),
                });

                return fetchedPost;
              }
            }
            
            // Cache null result if no valid posts found
            postCache.set(subreddit, {
              post: null,
              timestamp: Date.now(),
            });
            return null;
          } catch (err) {
            console.error(`Error fetching r/${subreddit}:`, err);
            throw err;
          } finally {
            // Remove from ongoing requests
            ongoingRequests.delete(subreddit);
          }
        })();

        // Store the ongoing request
        ongoingRequests.set(subreddit, requestPromise);

        try {
          const result = await requestPromise;
          if (!cancelled) {
            setPost(result);
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to fetch post');
            setPost(null);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

      fetchTopPost();
    }, 300); // 300ms debounce

    return () => {
      cancelled = true;
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [subreddit, enabled]);

  return { post, loading, error };
}

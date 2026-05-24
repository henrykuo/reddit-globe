import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { citySubreddits } from '../data/citySubreddits';

interface SubredditSearchProps {
  onSelect: (cityIndex: number) => void;
}

/** Simple fuzzy match: all query chars must appear in order within the target */
function fuzzyMatch(query: string, target: string): { match: boolean; score: number } {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  let score = 0;
  let lastMatchIdx = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Bonus for consecutive matches
      score += (ti === lastMatchIdx + 1) ? 2 : 1;
      // Bonus for matching at start of word
      if (ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === '/') score += 3;
      lastMatchIdx = ti;
      qi++;
    }
  }

  return { match: qi === q.length, score };
}

export default function SubredditSearch({ onSelect }: SubredditSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build search index with original indices preserved
  const searchItems = useMemo(() =>
    citySubreddits.map((city, index) => ({
      label: `r/${city.subreddit}`,
      sublabel: `${city.city}, ${city.country}`,
      searchText: `${city.subreddit} ${city.city} ${city.country}`,
      originalIndex: index,
    })),
  []);

  // Filter and sort results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchItems
      .map(item => {
        const { match, score } = fuzzyMatch(query, item.searchText);
        return { ...item, match, score };
      })
      .filter(item => item.match)
      .sort((a, b) => b.score - a.score);
  }, [query, searchItems]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[activeIndex] as HTMLElement;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Global "/" shortcut to focus the search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!inputRef.current?.parentElement?.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectItem = useCallback((originalIndex: number) => {
    onSelect(originalIndex);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        selectItem(results[activeIndex].originalIndex);
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, results, activeIndex, selectItem]);

  return (
    <div className="w-[240px]">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder='Search subreddits  "/"'
          className="w-full px-3 py-2 rounded-lg bg-gray-100 border-none text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Search subreddits"
          aria-expanded={isOpen && results.length > 0}
          aria-controls="subreddit-search-results"
          aria-activedescendant={isOpen && results.length > 0 ? `search-result-${activeIndex}` : undefined}
          role="combobox"
          autoComplete="off"
        />
        {isOpen && results.length > 0 && (
          <div
            ref={listRef}
            id="subreddit-search-results"
            role="listbox"
            className="absolute top-full mt-1 w-full bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {results.map((item, i) => (
              <div
                key={item.originalIndex}
                id={`search-result-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  i === activeIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={e => { e.preventDefault(); selectItem(item.originalIndex); }}
              >
                <div className="font-medium text-slate-900">{item.label}</div>
                <div className="text-xs text-slate-500">{item.sublabel}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

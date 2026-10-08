'use client';

import { Button, cn } from '@llf/ui';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState, type FormEvent } from 'react';
import { strings } from '@/content/strings';
import { SEARCH_INDEX_PATH, SEARCH_TERM_MAX_LENGTH, searchHref } from '@/lib/search';

interface SearchFormProps {
  placeholder?: string | undefined;
  initialTerm?: string;
  /** Called instead of navigating, e.g. on the search page itself. */
  onSearch?: (term: string) => void;
  className?: string;
}

/**
 * Site search input. Submitting goes to `/search/#q=…`; the term never enters a path or query
 * string (AGENTS.md). Focusing warms the HTTP cache for the search index.
 */
export function SearchForm({
  placeholder,
  initialTerm = '',
  onSearch,
  className,
}: SearchFormProps) {
  const router = useRouter();
  const inputId = useId();
  const [term, setTerm] = useState(initialTerm);
  const warmed = useRef(false);

  function warm() {
    if (warmed.current) return;
    warmed.current = true;
    void fetch(SEARCH_INDEX_PATH).catch(() => undefined);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onSearch) onSearch(term.trim());
    else router.push(searchHref(term));
  }

  return (
    <form role="search" onSubmit={submit} className={cn('flex w-full gap-xs', className)}>
      <label htmlFor={inputId} className="sr-only">
        {strings.search.label}
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        value={term}
        maxLength={SEARCH_TERM_MAX_LENGTH}
        placeholder={placeholder ?? strings.search.placeholder}
        autoComplete="off"
        enterKeyHint="search"
        onFocus={warm}
        onChange={(event) => setTerm(event.target.value)}
        className="h-control min-w-0 flex-1 rounded-pill border border-line bg-transparent px-md text-paragraph text-fg placeholder:text-fg-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
      />
      <Button type="submit" variant="primary">
        <Search aria-hidden="true" className="size-5" />
        <span className="sr-only md:not-sr-only">{strings.search.submit}</span>
      </Button>
    </form>
  );
}

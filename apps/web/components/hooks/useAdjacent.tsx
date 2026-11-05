import { useEffect, useState } from 'react';

export function useAdjacent({
  originalRef,
  tagName = 'section',
}: {
  originalRef: React.RefObject<HTMLOptionElement | null>;
  tagName?: string;
}) {
  const [Adjacent, setAdjacent] = useState<{
    next?: HTMLElement;
    prev?: HTMLElement;
  }>({
    next: undefined,
    prev: undefined,
  });

  useEffect(() => {
    if (!originalRef.current) {
      return;
    }
    let next = originalRef.current.nextElementSibling as HTMLElement;
    let prev = originalRef.current.previousElementSibling as HTMLElement;
    while (next && next.tagName.toLowerCase() !== tagName.toLowerCase()) {
      next = next.nextElementSibling as HTMLElement;
    }
    while (prev && prev.tagName.toLowerCase() !== tagName.toLowerCase()) {
      prev = prev.previousElementSibling as HTMLElement;
    }
    setAdjacent((current) => {
      if (current?.next === next && current?.prev === prev) {
        return current;
      }
      return {
        next,
        prev,
      };
    });
  }, [originalRef, tagName]);
  // console.log('useAdjacent:',Adjacent)
  return Adjacent;
}

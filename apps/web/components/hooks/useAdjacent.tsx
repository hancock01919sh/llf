import { useEffect, useState } from 'react';

export function useAdjacent({
  originalRef,
  tagName = 'section',
}: {
  originalRef: React.RefObject<HTMLDivElement | null>;
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
    const section = originalRef.current.closest(tagName);
    if (!section) return;
    const next = section.nextElementSibling as HTMLElement;
    const prev = section.previousElementSibling as HTMLElement;
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

'use client';
import { useEffect, useRef } from 'react';
import { BlocksRenderer, type BlocksContent } from '@strapi/blocks-react-renderer';
import { RichText } from '@/components/RichText';
import type { cms } from '@llf/contracts';
export function HeroTitle({ Title }: { Title: cms.BlocksContent | null | undefined }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current === null) return;
    const replaceText = ref.current?.querySelector('code');
    let timer: NodeJS.Timeout | null = null;
    if (replaceText) {
      timer = setTimeout(() => {
        replaceText.textContent = 'Use what you have';
      }, 3000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);
  return (
    <div ref={ref} className="text-headline-lg [&_code]:text-surface-mint [&_code]:font-anton">
      {/* <BlocksRenderer content={Title as BlocksContent} /> */}
      <RichText content={Title} />
    </div>
  );
}

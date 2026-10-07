'use client';

import { sanitizePageLocation } from '@llf/contracts/analytics';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';
import { pageTypeFor, track } from '@/lib/analytics';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const MODULE_SELECTOR = '[data-module-type]';
/** A module counts as viewed after being at least half visible for one second (TDD §8). */
const VIEW_RATIO = 0.5;
const VIEW_DWELL_MS = 1000;

function moduleOf(el: Element) {
  const section = el.closest<HTMLElement>(MODULE_SELECTOR);
  if (!section) return {};
  return {
    module_type: section.dataset.moduleType,
    module_index: Number(section.dataset.moduleIndex),
  };
}

/**
 * Generic analytics (TDD §8): `page_view` on every route change, `cta_click` from `data-cta`
 * links, and `module_view` from `data-module-*` sections. Modules need no analytics code.
 * TODO(OPEN-18): gate GTM on consent if a CMP is required.
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    track({
      event: 'page_view',
      page_location: sanitizePageLocation(window.location.href),
      page_path: pathname,
      page_type: pageTypeFor(pathname),
    });
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const cta = event.target.closest<HTMLElement>('[data-cta]');
      if (!cta) return;
      const { module_type, module_index } = moduleOf(cta);
      track({
        event: 'cta_click',
        cta_label: cta.textContent?.trim() ?? '',
        cta_href: cta.getAttribute('href') ?? '',
        ...(cta.dataset.ctaVariant ? { cta_variant: cta.dataset.ctaVariant } : {}),
        ...(module_type ? { module_type, module_index } : {}),
      });
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const timers = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting && entry.intersectionRatio >= VIEW_RATIO) {
            if (timers.has(el)) continue;
            const timer = window.setTimeout(() => {
              observer.unobserve(el);
              timers.delete(el);
              const { moduleType, moduleIndex, moduleId, moduleLayout } = el.dataset;
              track({
                event: 'module_view',
                module_type: moduleType ?? '',
                module_index: Number(moduleIndex),
                module_id: moduleId ?? '',
                ...(moduleLayout ? { module_layout: moduleLayout } : {}),
                page_path: pathname,
              });
            }, VIEW_DWELL_MS);
            timers.set(el, timer);
          } else {
            window.clearTimeout(timers.get(el));
            timers.delete(el);
          }
        }
      },
      { threshold: VIEW_RATIO },
    );
    document.querySelectorAll(MODULE_SELECTOR).forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pathname]);

  if (!GTM_ID) return null;
  return (
    <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(GTM_ID)});`}
    </Script>
  );
}

'use client';

import type { ReactNode } from 'react';

export function Anchor(props: { children: ReactNode }) {
  function scrollToAccordion() {
    const accordion = document.querySelector('section[data-module-type="accordion"]');
    accordion?.scrollIntoView({ behavior: 'smooth' });
  }
  return (
    <button type="button" className="cursor-pointer bg-transparent p-0" onClick={scrollToAccordion}>
      {props.children}
    </button>
  );
}

// components/TransitionLink.tsx

'use client';

import Link, { type LinkProps } from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import type { AnchorHTMLAttributes } from 'react';
type Props = LinkProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: React.ReactNode;
  };
export default function TransitionLink(props: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { href, children, ...restProps } = props;
  if (!href) {
    return null;
  }
  return (
    <Link
      href={href || '#'}
      onClick={() => {
        if (pathname === href) {
          return;
        }
        const navigate = () => router.push(href);
        if ('startViewTransition' in document) {
          document.startViewTransition(navigate);
        } else {
          navigate();
        }
      }}
      {...restProps}
    >
      {children}
    </Link>
  );
}

'use client';
import { IconClose, IconMenu, IconSearch } from './Icon';
import TransitionLink from './TransitionLink';
import { Typography } from './Typography';
import { useContext, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { LinkProps } from '@/blocks/types';
import { AppContext } from '@/components/Provider';
import { Menu } from './Menu';
import { searchHref } from '@/lib/search';
export interface NavigationCmsDataProps {
  searchPlaceholder: string;
  title: string;
  link: Array<LinkProps>;
}
interface NavigationProp {
  className?: string;
  showClose?: boolean;
  onClose?: () => void;
  inPopup?: boolean;
}
export function Header({ className = '', showClose = false, onClose = () => {}, inPopup = false }: NavigationProp) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isSearchPage = pathname.startsWith('/search');
  const whiteBg = pathname.startsWith('/toolkit') || isSearchPage;
  const hiddenSearch = isSearchPage && (!showClose || inPopup);
  const { navigation } = useContext(AppContext);
  if (!navigation) {
    console.error('Navigation is not provided');
    return null;
  }
  const Tag = inPopup ? 'div' : 'header';
  return (
    <Tag
      className={`flex justify-between items-center px-5 pt-16.5 pb-5 border-b lg:border-b-[1.5px] border-ink-terra-15 lg:pt-12.5 lg:pb-6.5 lg:px-15 bg-brand-forest text-surface-mint ${className}`}
    >
      <div className="text-[35px] h-8.75">
        <TransitionLink href="/">{navigation.title}</TransitionLink>
      </div>
      <div className="flex items-center gap-lg lg:hidden">
        {!hiddenSearch && (
          <TransitionLink aria-label={navigation.searchPlaceholder || 'Search'} href="/search">
            <IconSearch />
          </TransitionLink>
        )}

        <button
          aria-label={showClose ? 'Close' : 'Menu'}
          onClick={() => {
            if (showClose) {
              onClose();
              return;
            }
            setIsOpen(true);
          }}
        >
          {showClose ? (
            <IconClose className="cursor-pointer" onClick={onClose} />
          ) : (
            <IconMenu className="cursor-pointer" />
          )}
        </button>
      </div>
      <div className="hidden lg:flex gap-lg items-center">
        {navigation.link.map((item) => (
          <TransitionLink className="capitalize" key={item.href} href={`${item.href}`}>
            <Typography variant="paragraph-regular" className="font-bold" as="span">
              {item.label}
            </Typography>
          </TransitionLink>
        ))}
        <div
          className={`rounded-pill flex gap-2.5 items-center py-sm px-5  border-2 w-79 ${whiteBg ? 'border-ink-terra' : 'border-surface-mint'}`}
        >
          <IconSearch />
          <input
            type="text"
            className={`font-bold w-43 flex-1 outline-0 ${whiteBg ? 'placeholder:text-ink-terra' : 'placeholder:text-surface-mint'}`}
            placeholder="Search specific ingredient tips"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const query = (e.target as HTMLInputElement).value;
                if (isSearchPage) {
                  window.location.hash = searchHref(query).replace(/^[^#]*/, '');
                  return;
                }
                router.push(`/search/${searchHref(query).replace(/^[^#]*/, '')}`);
              }
            }}
          />
        </div>
      </div>
      <Menu
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </Tag>
  );
}

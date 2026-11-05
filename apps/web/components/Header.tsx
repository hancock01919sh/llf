'use client';
import { IconClose, IconMenu, IconSearch } from './Icon';
import TransitionLink from './TransitionLink';
import { Typography } from './Typography';
import { useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { LinkProps } from '@/blocks/types';
import { AppContext } from '@/components/Provider';
import { Menu } from './Menu';
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
export function Header({ className = '', showClose = false, onClose = () => {} }: NavigationProp) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const hiddenSearch = pathname === '/search' && !showClose;
  const { navigation } = useContext(AppContext);
  if (!navigation) {
    console.error('Navigation is not provided');
    return null;
  }
  return (
    <nav
      className={`flex justify-between items-center px-5 pt-16.5 pb-5 border-b lg:border-b-[1.5px] border-ink-terra-15 lg:pt-12.5 lg:pb-6.5 lg:px-15 bg-ink-terra text-surface-mint ${className}`}
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
        <div className="rounded-4xl flex gap-2.5 items-center py-sm px-5 border-surface-mint border-2">
          <IconSearch />
          <input
            type="text"
            className="font-bold placeholder:text-surface-mint w-43"
            placeholder="Search Ingredients Tips"
          />
        </div>
      </div>
      <Menu
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </nav>
  );
}

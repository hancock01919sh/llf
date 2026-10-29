'use client';
import { createContext } from 'react';
import { AppFooter, type FooterCmsDataProps } from './AppFooter';
import { Header, type NavigationCmsDataProps } from './Header';
import type { GlobalProps } from '@/blocks/types';
export const AppContext = createContext<{
  footer?: FooterCmsDataProps;
  navigation?: NavigationCmsDataProps;
  global?: GlobalProps;
}>({});
export function Provider({
  children,
  footer,
  navigation,
  global,
}: {
  children: React.ReactNode;
  footer: FooterCmsDataProps;
  navigation: NavigationCmsDataProps;
  global: GlobalProps;
}) {
  return (
    <AppContext.Provider value={{ footer, navigation, global }}>
      <Header />
      <main>{children}</main>
      <AppFooter />
    </AppContext.Provider>
  );
}

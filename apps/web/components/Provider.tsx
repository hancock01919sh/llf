'use client';
import { createContext } from 'react';
import { AppFooter, type FooterCmsDataProps } from './AppFooter';
import { Header, type NavigationCmsDataProps } from './Header';
export const AppContext = createContext<{
  footer?: FooterCmsDataProps;
  navigation?: NavigationCmsDataProps;
}>({});
export function Provider({
  children,
  footer,
  navigation,
}: {
  children: React.ReactNode;
  footer?: FooterCmsDataProps;
  navigation?: NavigationCmsDataProps;
}) {
  return (
    <AppContext.Provider value={{ footer, navigation }}>
      <Header />
      <main>{children}</main>
      <AppFooter />
    </AppContext.Provider>
  );
}

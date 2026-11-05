'use client';
import { createContext } from 'react';
import { AppFooter } from './AppFooter';
import { Header } from './Header';
import type { cmsType } from '@llf/contracts';
export const AppContext = createContext<{
  footer?: cmsType.api.Footer;
  navigation?: cmsType.api.Navigation;
  global?: cmsType.api.Global;
}>({});
export function Provider({
  children,
  footer,
  navigation,
  global,
}: {
  children: React.ReactNode;
  footer: cmsType.api.Footer;
  navigation: cmsType.api.Navigation;
  global: cmsType.api.Global;
}) {
  return (
    <AppContext.Provider value={{ footer, navigation, global }}>
      <Header />
      <main>{children}</main>
      <AppFooter />
    </AppContext.Provider>
  );
}

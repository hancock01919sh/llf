'use client';
import { createContext } from 'react';
import { AppFooter } from './AppFooter';
import { Header } from './Header';
import type { cmsType } from '@llf/contracts';
export const AppContext = createContext<{
  footer?: cmsType.api.Footer;
  navigation?: cmsType.api.Navigation;
  global?: cmsType.api.GlobalDeepRef;
  path: string;
}>({
  path: '/',
});
export function Provider({
  children,
  footer,
  navigation,
  global,
  path,
}: {
  children: React.ReactNode;
  footer: cmsType.api.Footer;
  navigation: cmsType.api.Navigation;
  global: cmsType.api.GlobalDeepRef;
  path: string;
}) {
  function getHeaderClassByPath(path: string) {
    switch (path) {
      case '/':
      case '/about':
        return 'bg-ink-terra!';
      case '/search':
        return 'bg-surface-paper! text-ink-terra! [&_svg_path]:stroke-ink-terra [&_svg_rect]:fill-ink-terra';
      default:
        return 'bg-brand-forest';
    }
  }
  return (
    <AppContext.Provider value={{ footer, navigation, global, path }}>
      <Header className={getHeaderClassByPath(path)} />
      <main>{children}</main>
      <AppFooter />
    </AppContext.Provider>
  );
}

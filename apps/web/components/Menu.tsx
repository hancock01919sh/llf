'use client';
import { Popup } from './Popup';
import { Header } from './Header';
import { AppFooter } from './AppFooter';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function Menu({
  open = false,
  onClose = () => {},
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const oldPathname = pathname;
  useEffect(() => {
    if (pathname !== oldPathname) {
      onClose();
    }
  }, [pathname, onClose, oldPathname]);
  return (
    <Popup open={open} onClose={onClose} animationClass="opacity">
      <div className="bg-brand-forest h-dvh overflow-y-auto flex flex-col">
        <Header
          showClose={true}
          onClose={() => {
            onClose();
          }}
          className="bg-brand-forest! text-surface-mint border-[#FBF4CE]"
          inPopup={true}
        />

        <AppFooter inPopup={true} inMenu={true} className="flex-1 text-surface-mint" />
      </div>
    </Popup>
  );
}

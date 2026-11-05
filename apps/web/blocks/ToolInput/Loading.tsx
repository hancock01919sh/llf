import { AppFooter } from '@/components/AppFooter';
import { Header } from '@/components/Header';
import { IconWork2 } from '@/components/Icon';
import { Popup } from '@/components/Popup';
import { AppContext } from '@/components/Provider';
import { Typography } from '@/components/Typography';
import { useContext } from 'react';

export function Loading({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { global } = useContext(AppContext);
  return (
    <Popup open={open} className="bg-surface-paper" animationClass="opacity">
      <Header showClose={true} onClose={onClose} />
      <div className=" bg-brand-forest h-dvh flex flex-col">
        <div className="flex-1 flex flex-col justify-center items-center gap-lg px-5 text-center">
          <IconWork2 className={`animate-[spin_3s_linear_infinite]`} />
          <Typography variant="subhead-md" className="text-surface-mint">
            {global?.load?.statement}
          </Typography>
          <Typography variant="headline-lg" className="text-surface-sand">
            {global?.load?.title}
          </Typography>
        </div>
      </div>
      <AppFooter />
    </Popup>
  );
}

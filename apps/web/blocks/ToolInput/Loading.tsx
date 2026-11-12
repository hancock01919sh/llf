import { AppFooter } from '@/components/AppFooter';
import { BlockTitle } from '@/components/BlockTitle';
import { Header } from '@/components/Header';
import { IconWork2 } from '@/components/Icon';
import { Popup } from '@/components/Popup';
import { AppContext } from '@/components/Provider';
import { Typography } from '@/components/Typography';
import { useContext } from 'react';

export function Loading({ open }: { open: boolean }) {
  const { global } = useContext(AppContext);
  return (
    <Popup open={open} className="bg-surface-paper lg:h-full" animationClass="opacity">
      <Header className="bg-brand-forest!" />
      <div className="bg-brand-forest h-dvh flex flex-col">
        <div className="flex-1 flex flex-col justify-center items-center gap-lg px-5 text-center">
          <IconWork2 className={`animate-[spin_3s_linear_infinite]`} />
          <Typography variant="subhead-md" className="text-surface-mint">
            {global?.load?.statement}
          </Typography>
          {global?.load?.title && <BlockTitle className="text-surface-sand" title={global?.load?.title} moduleIndex={0} />}
        </div>
      </div>
      <AppFooter />
    </Popup>
  );
}

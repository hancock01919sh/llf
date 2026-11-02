// import { AppFooter } from '@/components/AppFooter';
// import { Header } from '@/components/Header';
import { IconWork2 } from '@/components/Icon';
import { Popup } from '@/components/Popup';
import { Typography } from '@/components/Typography';

export function Loading({ open }: { open: boolean }) {
  return (
    <Popup open={open} className="bg-surface-paper">
      {/* <Header showClose={true} /> */}
      <div className="loading-container bg-brand-forest h-dvh flex flex-col">
        <div className="flex-1 flex flex-col justify-center items-center gap-lg px-5 text-center">
          <IconWork2 className={`animate-[spin_3s_linear_infinite]`} />
          <Typography variant="subhead-md" className="text-surface-mint">
            Extracting ingredients...
          </Typography>
          <Typography variant="headline-lg" className="text-surface-sand">
            Finding ways to waste less of the food you love.
          </Typography>
        </div>
      </div>
      {/* <AppFooter /> */}
    </Popup>
  );
}

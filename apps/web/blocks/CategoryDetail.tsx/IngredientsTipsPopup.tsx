import { IconClose } from '@/components/Icon';
import { Popup } from '@/components/Popup';
import { Typography } from '@/components/Typography';
import TransitionLink from '@/components/TransitionLink';
import type { cmsType } from '@llf/contracts';

export function IngredientsTipsPopup(
  props: cmsType.component.TipsPopupDeepRef & {
    open: boolean;
    onClose: () => void;
  },
) {
  const { open, onClose, title, description, link } = props;
  return (
    <Popup open={open} onClose={onClose}>
      <div className="flex flex-col gap-10 bg-surface-paper text-ink-terra px-4 py-6 rounded-t-[24px] lg:rounded-[24px] lg:p-10 lg:w-3/5 max-w-page mx-auto lg:text-center">
        <div className="flex justify-end items-center">
          <IconClose
            className=" w-6 h-6 [&_rect]:fill-ink-terra cursor-pointer"
            onClick={onClose}
          />
        </div>
        <div className="flex flex-col gap-5 lg:mt-5 lg:w-4/5 lg:mx-auto">
          <Typography variant="headline-lg" className="uppercase">
            {title}
          </Typography>
          <Typography variant="subhead-lg" className="font-bold">
            {description}
          </Typography>
        </div>
        <TransitionLink href={link?.href || '#'} className="btn w-full lg:w-max mx-auto lg:mb-10">
          {link?.label || ''}
        </TransitionLink>
      </div>
    </Popup>
  );
}

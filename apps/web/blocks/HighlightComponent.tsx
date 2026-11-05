import { type BlockProps } from '@/blocks/types';
import TransitionLink from '@/components/TransitionLink';
import { Typography } from '@/components/Typography';
import { UIImage } from '@/components/UIImage';
import type { cmsType } from '@llf/contracts';
export function BlockHighlightComponent(props: BlockProps<cmsType.component.HighlightComponent>) {
  const { image: backgroundImage, link, title, description } = props.block;

  return (
    <div className={`w-full text-surface-paper lg:aspect-1440/865 lg:px-[5.625%] lg:py-[6.94%] `}>
      <div
        className={`relative w-full h-full lg:rounded-[35px] overflow-hidden aspect-402/725 mx-auto max-w-page  `}
      >
        <UIImage {...backgroundImage} className="absolute w-full h-full" />
        <div
          className={`absolute inset-0 bg-[rgba(0,0,0,0.2)] lg:bg-black/30 flex flex-col items-center text-center justify-center px-5 lg:px-[19%]`}
        >
          <Typography variant="headline-lg" className="uppercase lg:text-headline-xl">
            {title}
          </Typography>
          <Typography variant="subhead-lg" className="lg:font-normal mt-3 lg:mt-5">
            {description}
          </Typography>
          {link
            ?.filter((l) => l.isDisplay)
            .map((l) => {
              return (
                <TransitionLink
                  key={l.label}
                  className={`${l.buttonType === 'Primary' ? 'btn' : 'link'} mt-5`}
                  href={l.href || '#'}
                >
                  {l.label}
                </TransitionLink>
              );
            })}
        </div>
      </div>
    </div>
  );
}
